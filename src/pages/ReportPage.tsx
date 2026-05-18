import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/ReportPage.module.css";
import { submitReport } from "../api/reportApi";
import {
  getUserLocation,
  patchUserLocation,
  type LocationResponse,
} from "../api/locationApi";

// ── 제보 유형 정의 ────────────────────────────────────────────

interface ReportType {
  id: string;
  label: string;
  icon: string;
  dangerLevel: "높음" | "중간" | "낮음";
  dangerDesc: string;
}

const REPORT_TYPES: ReportType[] = [
  { id: "fire",   label: "화재 / 연기", icon: "🔥", dangerLevel: "높음", dangerDesc: "연기와 화재가 감지되어 위험 수준이 높습니다." },
  { id: "bomb",   label: "폭발 / 폭격", icon: "💥", dangerLevel: "높음", dangerDesc: "폭발 위험이 감지되어 즉시 대피가 필요합니다." },
  { id: "rescue", label: "구조 요청",   icon: "🆘", dangerLevel: "높음", dangerDesc: "구조가 필요한 인원이 있습니다." },
  { id: "road",   label: "도로 통제",   icon: "🚧", dangerLevel: "중간", dangerDesc: "도로 통제로 이동에 제한이 있습니다." },
  { id: "other",  label: "기타 위험",   icon: "⚠️", dangerLevel: "낮음", dangerDesc: "위험 요소가 감지되었습니다. 주의가 필요합니다." },
];

const LEVEL_COLOR: Record<string, string> = {
  높음: "#ef4444",
  중간: "#f97316",
  낮음: "#22c55e",
};

const LEVEL_BAR_WIDTH: Record<string, string> = {
  높음: "65%",
  중간: "40%",
  낮음: "20%",
};

type MediaTab = "photo" | "audio";

// ── 컴포넌트 ─────────────────────────────────────────────────

export default function ReportPage() {
  const navigate = useNavigate();
  const USER_ID_KEY = "peacelink_user_id";
  const userId = localStorage.getItem(USER_ID_KEY) ?? "";

  // 제보 유형
  const [selectedType, setSelectedType] = useState<ReportType>(REPORT_TYPES[0]);

  // 미디어
  const [mediaTab, setMediaTab]     = useState<MediaTab>("photo");
  const [photos, setPhotos]         = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [audioBlob, setAudioBlob]   = useState<Blob | null>(null);
  const [recording, setRecording]   = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const mediaRecorderRef            = useRef<MediaRecorder | null>(null);
  const audioChunksRef              = useRef<Blob[]>([]);

  // 위치
  const [userLocation, setUserLocation]       = useState<LocationResponse | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // 제출
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  // ── 마운트 시 위치 조회 ──────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    setLocationLoading(true);

    getUserLocation(userId)
      .then(setUserLocation)
      .catch(() => {
        // 서버에 저장된 위치 없으면 GPS fallback
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            try {
              const res = await patchUserLocation(userId, lat, lng);
              setUserLocation(res);
            } catch {
              setUserLocation({ lat, lng, address: null });
            }
          },
          () => {} // GPS도 실패하면 null 유지
        );
      })
      .finally(() => setLocationLoading(false));
  }, [userId]);

  // ── GPS 재감지 ───────────────────────────────────────────────

  const handleDetectGPS = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await patchUserLocation(userId, lat, lng);
          setUserLocation(res);
        } catch {
          setUserLocation({ lat, lng, address: null });
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false)
    );
  };

  // ── 파일 선택 ────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        setImageFiles((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (ev) =>
          setPhotos((prev) => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      }
    });
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── 음성 녹음 ────────────────────────────────────────────────

  const toggleRecording = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/aac" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  // ── 제출 ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);

    if (!userId) {
      alert("사용자 정보를 불러올 수 없습니다. 앱을 다시 시작해주세요.");
      return;
    }
    try {
      const audioFile = audioBlob
        ? new File([audioBlob], "recording.aac", { type: "audio/aac" })
        : null;

      await submitReport({
        typeId:      selectedType.id,
        userId,
        lat:         userLocation?.lat  ?? null,
        lng:         userLocation?.lng  ?? null,
        description,
        imageFiles,
        videoFile,
        audioFile,
      });

      setSubmitted(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 제출 완료 화면 ───────────────────────────────────────────

  if (submitted) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate("/")}>←</button>
          <span className={styles.headerTitle}>제보하기</span>
          <span />
        </header>
        <div className={styles.successWrap}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.successTitle}>제보가 접수되었습니다</h2>
          <p className={styles.successDesc}>
            소중한 제보 감사합니다.<br />
            제보는 익명으로 안전하게 처리됩니다.
          </p>
          <button className={styles.successBtn} onClick={() => navigate("/")}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 메인 렌더 ────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <span className={styles.headerTitle}>제보하기</span>
        <span />
      </header>

      {/* ── 안내 배너 ── */}
      <div className={styles.infoBanner}>
        <span className={styles.infoBannerIcon}>ℹ️</span>
        <span className={styles.infoBannerText}>여러분의 제보가 더 안전한 지도를 만듭니다.</span>
      </div>

      <div className={styles.scrollBody}>

        {/* ── 제보 유형 선택 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>제보 유형 선택</h2>
          <div className={styles.typeGrid}>
            {REPORT_TYPES.map((type) => (
              <button
                key={type.id}
                className={`${styles.typeCard} ${selectedType.id === type.id ? styles.typeCardActive : ""}`}
                onClick={() => setSelectedType(type)}
              >
                <span className={styles.typeIcon}>{type.icon}</span>
                <span className={styles.typeLabel}>{type.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 위치 확인 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>위치 확인</h2>
          <div className={styles.locationCard}>
            <div className={styles.locationMapThumb}>
              <span className={styles.locationPin}>📍</span>
            </div>
            <div className={styles.locationInfo}>
              {locationLoading ? (
                <p className={styles.locationAddr}>위치 조회 중...</p>
              ) : (
                <>
                  <p className={styles.locationAddr}>
                    {userLocation?.address ??
                      (userLocation
                        ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                        : "위치 없음")}
                  </p>
                  <p className={styles.locationSub}>현재 위치 기준</p>
                </>
              )}
            </div>
            <button
              className={styles.locationEditBtn}
              onClick={handleDetectGPS}
              disabled={locationLoading}
            >
              <span>↺</span> 위치 수정
            </button>
          </div>
        </section>

        {/* ── 자료 첨부 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>자료 첨부</h2>

          <div className={styles.mediaTabs}>
            <button
              className={`${styles.mediaTab} ${mediaTab === "photo" ? styles.mediaTabActive : ""}`}
              onClick={() => setMediaTab("photo")}
            >
              사진 / 동영상
            </button>
            <button
              className={`${styles.mediaTab} ${mediaTab === "audio" ? styles.mediaTabActive : ""}`}
              onClick={() => setMediaTab("audio")}
            >
              음성 녹음
            </button>
          </div>

          {mediaTab === "photo" ? (
            <div className={styles.photoGrid}>
              {photos.map((src, idx) => (
                <div key={idx} className={styles.photoThumb}>
                  <img src={src} alt={`첨부 ${idx + 1}`} className={styles.photoImg} />
                  <button className={styles.photoRemove} onClick={() => removePhoto(idx)}>×</button>
                </div>
              ))}
              {videoFile && (
                <div className={styles.photoThumb}>
                  <div className={styles.videoThumbPlaceholder}>🎬</div>
                  <button className={styles.photoRemove} onClick={() => setVideoFile(null)}>×</button>
                </div>
              )}
              {photos.length + (videoFile ? 1 : 0) < 4 && (
                <button
                  className={styles.photoAdd}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className={styles.photoAddIcon}>📷</span>
                  <span className={styles.photoAddLabel}>추가 촬영</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className={styles.audioRecorder}>
              <button
                className={styles.audioBtn}
                onClick={toggleRecording}
                style={{ background: recording ? "#ef4444" : undefined }}
              >
                <span className={styles.audioIcon}>🎙️</span>
                <span>{recording ? "녹음 중지" : "녹음 시작"}</span>
              </button>
              {audioBlob
                ? <p className={styles.audioHint}>✅ 녹음 완료</p>
                : <p className={styles.audioHint}>버튼을 눌러 음성을 녹음하세요</p>
              }
            </div>
          )}
        </section>

        {/* ── 상세 내용 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            상세 내용 <span className={styles.optional}>(선택)</span>
          </h2>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="상황에 대해 자세히 설명해 주세요. (예: 연기가 보이고 타는 냄새가 납니다.)"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className={styles.charCount}>{description.length}/200</span>
          </div>
        </section>

        {/* ── 위험 정도 (자동 분석) ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            위험 정도 <span className={styles.autoTag}>(자동 분석)</span>
          </h2>
          <div className={styles.dangerCard}>
            <div className={styles.dangerLevelRow}>
              <span className={styles.dangerIcon}>{selectedType.icon}</span>
              <span
                className={styles.dangerLevelLabel}
                style={{ color: LEVEL_COLOR[selectedType.dangerLevel] }}
              >
                {selectedType.dangerLevel}
              </span>
            </div>
            <div className={styles.dangerBarTrack}>
              <div
                className={styles.dangerBarFill}
                style={{
                  width: LEVEL_BAR_WIDTH[selectedType.dangerLevel],
                  background: LEVEL_COLOR[selectedType.dangerLevel],
                }}
              />
            </div>
            <p className={styles.dangerDesc}>{selectedType.dangerDesc}</p>
            <p className={styles.dangerNote}>※ 제출 후 더 정확한 분석으로 업데이트 됩니다.</p>
          </div>
        </section>

        {/* ── 제출 버튼 ── */}
        <div className={styles.submitWrap}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <span className={styles.submitSpinner} />
              : <span className={styles.submitIcon}>➤</span>
            }
            {submitting ? "제출 중..." : "제보 제출하기"}
          </button>
          <p className={styles.submitNote}>⓪ 제보는 익명으로 안전하게 처리됩니다.</p>
        </div>

      </div>
    </div>
  );
}