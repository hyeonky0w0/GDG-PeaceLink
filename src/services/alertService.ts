import type { EmergencyAlert } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * 긴급 정보를 백엔드에서 가져옵니다.
 * GET /api/alerts?districtCode={code}&deviceId={id}
 */
export async function fetchEmergencyAlerts(
  districtCode: string,
  deviceId: string
): Promise<EmergencyAlert[]> {
  const params = new URLSearchParams({ districtCode, deviceId });
  const res = await fetch(`${BASE_URL}/api/alerts?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`긴급 정보 조회 실패: ${res.status}`);
  }

  const data = await res.json();
  // 백엔드 응답이 { alerts: [...] } 형태라고 가정
  return (data.alerts ?? data) as EmergencyAlert[];
}

/**
 * 제보 전송
 * POST /api/reports
 */
export async function submitReport(payload: {
  deviceId: string;
  districtCode: string;
  type: "photo" | "audio" | "text";
  content: string;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`제보 전송 실패: ${res.status}`);
  }
}

