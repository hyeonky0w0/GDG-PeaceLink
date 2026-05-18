import { useState, useEffect, useCallback } from "react";
import { fetchSituations, type SituationItem } from "../api/evacuationApi";

export function useSituations(lat: number, lng: number) {
  const [situations, setSituations] = useState<SituationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSituations(lat, lng);
      setSituations(data);
    } catch {
      setError("상황 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    load();
    // 30분마다 폴링
    const interval = setInterval(load, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return { situations, loading, error };
}