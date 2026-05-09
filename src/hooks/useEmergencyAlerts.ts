import { useState, useEffect, useCallback } from "react";
import type { EmergencyAlert } from "../types";
import { fetchEmergencyAlerts } from "../services/alertService";

const POLL_INTERVAL_MS = 30_000; // 30초마다 재조회

export function useEmergencyAlerts(districtCode: string, deviceId: string) {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!districtCode || !deviceId) return;
    try {
      setError(null);
      const data = await fetchEmergencyAlerts(districtCode, deviceId);
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [districtCode, deviceId]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, loading, error, refetch: load, dismiss };
}