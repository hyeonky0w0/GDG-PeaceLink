import { useState, useEffect } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

import { BottomNav } from "../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useDeviceId } from "../hooks/useDeviceId";
import { useUserLocation } from "../hooks/useUserLocation";
import { useEmergencyAlerts } from "../hooks/useEmergencyAlerts";
import { LocationModal } from "../components/LocationModal";
import { EmergencyBanner } from "../components/EmergencyBanner";
import {
  fetchNearbyShelters,
  createEvacuationRoute,
  type NearestShelterResponse,
  type EvacuationRouteResponse,
} from "../services/evacuationApi";

import styles from "../styles/HomePage.module.css";

// ── 마커 이미지 ──────────────────────────────────────────────

const SHELTER_MARKER_IMAGE = {
  src:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000033"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
        fill="#3b82f6" filter="url(#s)"/>
      <circle cx="18" cy="17" r="9" fill="white"/>
      <text x="18" y="21" text-anchor="middle" font-size="11" font-weight="bold" fill="#3b82f6">대피</text>
    </svg>
  `),
  size: { width: 36, height: 44 },
  options: { offset: { x: 18, y: 44 } },
};

const SHELTER_SELECTED_MARKER_IMAGE = {
  src:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="52" viewBox="0 0 42 52">
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#00000044"/>
      </filter>
      <path d="M21 0C9.4 0 0 9.4 0 21c0 15.75 21 31 21 31S42 36.75 42 21C42 9.4 32.6 0 21 0z"
        fill="#f97316" filter="url(#s)"/>
      <circle cx="21" cy="20" r="11" fill="white"/>
      <text x="21" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#f97316">대피</text>
    </svg>
  `),
  size: { width: 42, height: 52 },
  options: { offset: { x: 21, y: 52 } },
};

const USER_MARKER_IMAGE = {
  src:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#3b82f6" stroke="white" stroke-width="3"/>
      <circle cx="11" cy="11" r="3" fill="white"/>
    </svg>
  `),
  size: { width: 22, height: 22 },
  options: { offset: { x: 11, y: 11 } },
};

// ── 실시간 상황 타입 (나중에 API 연동 시 services/situationApi.ts 로 이동) ──

export type SituationLevel = "높음" | "중간" | "낮음" | "안전";

export interface SituationItem {
  id: string;
  icon: string;         // 이모지 또는 아이콘 키
  title: string;        // e.g. "산불 발생"
  location: string;     // e.g. "중구 남산동"
  level: SituationLevel;
  minutesAgo: number;
}

// 임시 목업 데이터 – API 연동 시 fetchRealtimeSituations() 로 교체
const MOCK_SITUATIONS: SituationItem[] = [
  { id: "1", icon: "🔥", title: "산불 발생", location: "중구 남산동",  level: "높음", minutesAgo: 2  },
  { id: "2", icon: "💨", title: "연기 발생", location: "청구동 일대",  level: "중간", minutesAgo: 5  },
  { id: "3", icon: "🚧", title: "도로 통제", location: "퇴계로 3가",   level: "낮음", minutesAgo: 10 },
];

const LEVEL_COLOR: Record<SituationLevel, string> = {
  높음: "#ef4444",
  중간: "#f97316",
  낮음: "#22c55e",
  안전: "#3b82f6",
};



// ── 컴포넌트 ─────────────────────────────────────────────────

export default function HomePage() {
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_KEY,
    libraries: ["services", "clusterer"],
  });

  const navigate = useNavigate();
  const { deviceId, userId } = useDeviceId();
  const { location, updateLocation, detectGPS } = useUserLocation();
  const { alerts, loading: alertLoading, error: alertError, dismiss } =
    useEmergencyAlerts(location.district.code, deviceId);

  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // 대피소
  const [shelters, setShelters] = useState<NearestShelterResponse[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<NearestShelterResponse | null>(null);
  const [shelterLoading, setShelterLoading] = useState(false);
  const [shelterError, setShelterError] = useState<string | null>(null);

  // 경로
  const [routeResult, setRouteResult] = useState<EvacuationRouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 실시간 상황 – 나중에 useRealtimeSituations(location.district.code) 훅으로 교체
  const [situations] = useState<SituationItem[]>(MOCK_SITUATIONS);
  const [situationLoading] = useState(false); // API 연동 시 실제 로딩 상태 사용

  // 위치가 바뀌면 주변 대피소 5개 조회
  useEffect(() => {
    setShelterLoading(true);
    setShelterError(null);
    fetchNearbyShelters(location.lat, location.lng, 5)
      .then((list: NearestShelterResponse[]) => {
        setShelters(list);
        setSelectedShelter(list[0] ?? null);
      })
      .catch(() => setShelterError("대피소를 불러올 수 없습니다."))
      .finally(() => setShelterLoading(false));
  }, [location.lat, location.lng]);

  // 길 안내 시작
  const handleNavigate = async () => {
    if (!selectedShelter || !userId) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const result = await createEvacuationRoute({
        userId,
        originLat: location.lat,
        originLng: location.lng,
        destLat: selectedShelter.lat,
        destLng: selectedShelter.lng,
      });
      setRouteResult(result);

      const appUrl = `kakaomap://route?sp=${location.lat},${location.lng}&ep=${selectedShelter.lat},${selectedShelter.lng}&by=FOOT`;
      const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(selectedShelter.name)},${selectedShelter.lat},${selectedShelter.lng}`;
      const now = Date.now();
      window.location.href = appUrl;
      setTimeout(() => {
        if (Date.now() - now < 1500) window.open(webUrl, "_blank");
      }, 500);
    } catch {
      setRouteError("경로 생성에 실패했습니다.");
    } finally {
      setRouteLoading(false);
    }
  };

  // ── 로딩 / 에러 화면 ────────────────────────────────────────

  if (mapLoading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p>지도를 불러오는 중입니다...</p>
      </div>
    );
  }
  if (mapError) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>지도를 로드할 수 없습니다.</p>
      </div>
    );
  }

  // ── 메인 렌더 ────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoText}>Peace</span>
          <span className={styles.logoAccent}>link</span>
        </a>
        <div className={styles.locationRow}>
          <button
            className={styles.locationBtn}
            onClick={() => setLocationModalOpen(true)}
          >
            <span className={styles.locationPin}>📍</span>
            <span className={styles.locationName}>{location.district.name}</span>
            <span className={styles.locationArrow}>⌄</span>
          </button>
          <span className={styles.locationSub}>현재 위치 기준</span>
        </div>
        {deviceId && (
          <div className={styles.deviceChip}>
            <span className={styles.deviceDot} />
            {deviceId}
          </div>
        )}
      </header>

      {/* ── 재난 알림 ── */}
      <EmergencyBanner
        alerts={alerts}
        loading={alertLoading}
        error={alertError}
        onDismiss={dismiss}
      />

      {/* ── 스크롤 가능한 본문 (네비게이션 바 높이만큼 패딩) ── */}
      <div className={styles.scrollBody}>

        {/* ── 지도 영역 ── */}
        <div className={styles.mapSection}>
          <Map
            center={{ lat: location.lat, lng: location.lng }}
            style={{ width: "100%", height: "100%" }}
            level={4}
          >
            {/* 현재 위치 마커 */}
            <MapMarker
              position={{ lat: location.lat, lng: location.lng }}
              image={USER_MARKER_IMAGE}
            />

            {/* 주변 대피소 마커들 */}
            {shelters.map((s) => (
              <MapMarker
                key={s.id}
                position={{ lat: s.lat, lng: s.lng }}
                image={
                  s.id === selectedShelter?.id
                    ? SHELTER_SELECTED_MARKER_IMAGE
                    : SHELTER_MARKER_IMAGE
                }
                onClick={() => setSelectedShelter(s)}
              />
            ))}

            {/* 선택된 대피소로 경로선 */}
            {selectedShelter && (
              <Polyline
                path={[
                  { lat: location.lat, lng: location.lng },
                  { lat: selectedShelter.lat, lng: selectedShelter.lng },
                ]}
                strokeWeight={4}
                strokeColor="#3b82f6"
                strokeOpacity={0.85}
                strokeStyle="solid"
              />
            )}
          </Map>

          {/* ── 대피소 카드 오버레이 ── */}
          <div className={styles.shelterOverlay}>
            <div className={styles.shelterBadge}>
              <span className={styles.shelterBadgeDot} />
              가장 가까운 대피소
            </div>

            {shelterLoading && (
              <p style={{ fontSize: 13, color: "#a0aec0" }}>대피소 조회 중...</p>
            )}
            {shelterError && (
              <p style={{ fontSize: 13, color: "#e53e3e" }}>{shelterError}</p>
            )}

            {selectedShelter && !shelterLoading && (
              <>
                <div className={styles.shelterInfo}>
                  <div className={styles.shelterThumb}>🏫</div>
                  <div className={styles.shelterDetails}>
                    <h2 className={styles.shelterName}>{selectedShelter.name}</h2>
                    <p className={styles.shelterMeta}>
                      {selectedShelter.distanceKm.toFixed(1)} km / 도보{" "}
                      {selectedShelter.walkMinutes}분
                    </p>
                  </div>
                </div>

                {routeResult && (
                  <p style={{ fontSize: 12, color: "#3b82f6", marginBottom: 6 }}>
                    ✅ 경로 저장됨 ({routeResult.shelterCode})
                  </p>
                )}
                {routeError && (
                  <p style={{ fontSize: 12, color: "#e53e3e", marginBottom: 6 }}>
                    {routeError}
                  </p>
                )}

                <button
                  className={styles.navigateBtn}
                  onClick={handleNavigate}
                  disabled={routeLoading || !userId}
                >
                  <span className={styles.navigateBtnIcon}>➤</span>
                  {routeLoading ? "경로 생성 중..." : "길 안내 시작"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── 제보 배너 ── */}
        <div className={styles.reportBanner}>
          <div className={styles.reportTextGroup}>
            <h3 className={styles.reportTitle}>위험을 발견하셨나요?</h3>
            <p className={styles.reportDesc}>
              사진, 소리로 제보하고
              <br />
              모두의 안전을 지켜주세요.
            </p>
            <button className={styles.reportBtn} onClick={() => navigate("/report")}>
              제보하기
            </button>
          </div>
          <div className={styles.reportIllustration}>
            <div className={styles.reportPhone}>
              <span className={styles.reportPhoneIcon}>⚠️</span>
            </div>
          </div>
        </div>

        {/* ── 실시간 상황 ── (제보 배너 아래로 이동) */}
        <section className={styles.situationSection}>
          {/* 섹션 헤더 */}
          <div className={styles.situationHeader}>
            <h2 className={styles.situationTitle}>실시간 상황</h2>
            <div className={styles.situationLegend}>
              {(["높음", "중간", "낮음", "안전"] as SituationLevel[]).map((lv) => (
                <span key={lv} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: LEVEL_COLOR[lv] }}
                  />
                  {lv}
                </span>
              ))}
            </div>
          </div>

          {/* 아이템 목록 */}
          {situationLoading ? (
            <p className={styles.situationLoading}>상황 조회 중...</p>
          ) : (
            <ul className={styles.situationList}>
              {situations.map((item) => (
                <li key={item.id} className={styles.situationItem}>
                  <div className={styles.situationIconWrap}>
                    <span className={styles.situationIcon}>{item.icon}</span>
                  </div>
                  <div className={styles.situationBody}>
                    <span className={styles.situationName}>{item.title}</span>
                    <span className={styles.situationLocation}>{item.location}</span>
                  </div>
                  <div className={styles.situationRight}>
                    <span
                      className={styles.situationLevel}
                      style={{ color: LEVEL_COLOR[item.level] }}
                    >
                      {item.level}
                    </span>
                    <span className={styles.situationTime}>{item.minutesAgo}분 전</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button className={styles.situationMore}>상황 더보기 &gt;</button>
        </section>

      </div>{/* end scrollBody */}

      <BottomNav /> 

      {/* ── 위치 모달 ── */}
      {locationModalOpen && (
        <LocationModal
          current={location.district}
          onSelect={(district) => updateLocation(district, location.lat, location.lng)}
          onDetectGPS={detectGPS}
          onClose={() => setLocationModalOpen(false)}
        />
      )}
    </div>
    
    
  );
}