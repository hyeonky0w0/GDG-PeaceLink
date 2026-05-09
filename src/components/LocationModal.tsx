import { useState, useEffect, useRef } from "react";
import type { District } from "../types";
import styles from "../styles/LocationModal.module.css";

interface Props {
  current: District;
  onSelect: (district: District) => void;
  onDetectGPS: () => Promise<void>;
  onClose: () => void;
}

export function LocationModal({ current, onSelect, onDetectGPS, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<District[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 입력할 때마다 카카오 주소 검색
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(trimmed, (data: any[], status: string) => {
        setSearching(false);
        if (status !== window.kakao.maps.services.Status.OK) {
          setResults([]);
          return;
        }
        // 시·군·구 단위로 중복 제거해서 District 목록 생성
        const seen = new Set<string>();
        const districts: District[] = [];
        for (const item of data) {
          const name = `${item.address.region_1depth_name} ${item.address.region_2depth_name}`;
          if (!seen.has(name)) {
            seen.add(name);
            districts.push({
              code: item.address.region_2depth_h_code ?? item.address.b_code.slice(0, 5),
              name,
            });
          }
        }
        setResults(districts);
      });
    }, 300); // 300ms 디바운스

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">×</button>
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
          placeholder="지역 검색 (예: 수원시, 부산 해운대)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.districtList}>
          {searching && (
            <p style={{ padding: "16px", fontSize: 13, color: "#a0aec0", textAlign: "center" }}>
              검색 중...
            </p>
          )}
          {!searching && results.map((d) => (
            <button
              key={d.code}
              className={`${styles.districtItem} ${d.code === current.code ? styles.active : ""}`}
              onClick={() => handleSelect(d)}
            >
              {d.name}
            </button>
          ))}
          {!searching && query.trim() && results.length === 0 && (
            <p style={{ padding: "16px", fontSize: 13, color: "#a0aec0", textAlign: "center" }}>
              검색 결과가 없습니다
            </p>
          )}
          {!query.trim() && (
            <p style={{ padding: "16px", fontSize: 13, color: "#a0aec0", textAlign: "center" }}>
              지역명을 입력하세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}