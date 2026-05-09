import { useState } from "react";
import type { District } from "../types";
import { SEOUL_DISTRICTS } from "../services/districts";
import styles from "../styles/LocationModal.module.css";

interface Props {
  current: District;
  onSelect: (district: District) => void;
  onDetectGPS: () => Promise<void>;
  onClose: () => void;
}

export function LocationModal({ current, onSelect, onDetectGPS, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const filtered = SEOUL_DISTRICTS.filter((d) =>
    d.name.includes(query.trim())
  );

  const handleGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      await onDetectGPS();
      onClose();
    } catch (e) {
      setGpsError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelect = (district: District) => {
    onSelect(district);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>위치 변경</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <button className={styles.gpsBtn} onClick={handleGPS} disabled={gpsLoading}>
          <span className={styles.gpsIcon}>📡</span>
          {gpsLoading ? "위치 감지 중..." : "현재 GPS 위치 사용"}
        </button>

        {gpsError && (
          <p style={{ fontSize: 12, color: "#e53e3e", marginBottom: 10 }}>{gpsError}</p>
        )}

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>또는 직접 선택</span>
          <span className={styles.dividerLine} />
        </div>

        <input
          className={styles.searchInput}
          type="text"
          placeholder="구 이름 검색 (예: 강남구)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.districtList}>
          {filtered.map((d) => (
            <button
              key={d.code}
              className={`${styles.districtItem} ${d.code === current.code ? styles.active : ""}`}
              onClick={() => handleSelect(d)}
            >
              {d.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: "16px", fontSize: 13, color: "#a0aec0", textAlign: "center" }}>
              검색 결과가 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}