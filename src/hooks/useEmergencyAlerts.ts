import { useState, useEffect, useCallback } from "react";
import type { EmergencyAlert } from "../types";

export function useEmergencyAlerts(
  lat: number,
  lng: number,
  _deviceId?: string
) {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    try {
      // ✅ /latest 엔드포인트 사용
      const res = await fetch(
        `/api/evacuation/threats/alerts/latest?lat=${lat}&lng=${lng}`
      );
      if (res.status === 204) {
        setAlerts([]);
        return;
      }
      if (!res.ok) throw new Error();
      const data: EmergencyAlert = await res.json();
      setAlerts([data]);
    } catch {
      setError("재난 알림을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, loading, error, dismiss };
}