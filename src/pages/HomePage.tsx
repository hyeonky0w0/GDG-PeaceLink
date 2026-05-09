import { useState, useEffect } from "react";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

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

const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

// 일반 대피소 마커 (파란색)
const SHELTER_MARKER_IMAGE = {
  src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
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

// 선택된 대피소 마커 (주황색)
const SHELTER_SELECTED_MARKER_IMAGE = {
  src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
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

// 현재 위치 마커
const USER_MARKER_IMAGE = {
  src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#3b82f6" stroke="white" stroke-width="3"/>
      <circle cx="11" cy="11" r="3" fill="white"/>
    </svg>
  `),
  size: { width: 22, height: 22 },
  options: { offset: { x: 11, y: 11 } },
};

export default function HomePage() {
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_KEY,
    libraries: ["services", "clusterer"],
  });

  const deviceId = useDeviceId();
  const { location, updateLocation, detectGPS } = useUserLocation();
  const { alerts, loading: alertLoading, error: alertError, dismiss } =
    useEmergencyAlerts(location.district.code, deviceId);

  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // 대피소 목록 + 선택 상태
  const [shelters, setShelters] = useState<NearestShelterResponse[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<NearestShelterResponse | null>(null);
  const [shelterLoading, setShelterLoading] = useState(false);
  const [shelterError, setShelterError] = useState<string | null>(null);

  // 경로 생성 상태
  const [routeResult, setRouteResult] = useState<EvacuationRouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

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
    if (!selectedShelter) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const result = await createEvacuationRoute({
        userId: MOCK_USER_ID,
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
              image={s.id === selectedShelter?.id
                ? SHELTER_SELECTED_MARKER_IMAGE
                : SHELTER_MARKER_IMAGE}
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
                    {selectedShelter.distanceKm.toFixed(1)} km / 도보 {selectedShelter.walkMinutes}분
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
                disabled={routeLoading}
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
            사진, 소리로 제보하고<br />
            모두의 안전을 지켜주세요.
          </p>
          <button className={styles.reportBtn}>제보하기</button>
        </div>
        <div className={styles.reportIllustration}>
          <div className={styles.reportPhone}>
            <span className={styles.reportPhoneIcon}>⚠️</span>
          </div>
        </div>
      </div>

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