import { useState, useEffect, useCallback } from "react";


export type ReportType =
  | "FIRE_SMOKE"
  | "EXPLOSION_ATTACK"
  | "RESCUE_REQUEST"
  | "ROAD_CONTROL"
  | "OTHER_DANGER";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReportResponse {
  id: string;
  userId: string;
  reportType: ReportType;
  lat: number | null;
  lng: number | null;
  description: string | null;
  riskLevel: RiskLevel | null;
  riskReason: string | null;
  verified: boolean | null;
  verifiedSummary: string | null;
  mediaUrls: string[];
  status: ReportStatus;
  createdAt: string;
}

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  FIRE_SMOKE: "화재 / 연기",
  EXPLOSION_ATTACK: "폭발 / 포격",
  RESCUE_REQUEST: "구조 요청",
  ROAD_CONTROL: "도로 통제",
  OTHER_DANGER: "기타 위험",
};

export const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "거부",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
  CRITICAL: "위급",
};

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${mo}.${day} ${h}:${mi}`;
  } catch {
    return iso;
  }
}

// UUID 형식 검증
function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function useMyReports(userId: string | null) {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // ✅ UUID 형식 아니면 절대 요청 안 함
    if (!isValidUUID(userId)) return;

    setLoading(true);
    setError(null);

    fetch(`/api/reports/user/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
        return r.json();
      })
      .then((data) => {
        // ✅ 배열인지 반드시 확인 후 세팅
        setReports(Array.isArray(data) ? data : []);
      })
      .catch((e: Error) => {
        setError(e.message);
        setReports([]); // ✅ 에러 시 빈 배열로 초기화
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const getFiltered = (tab: "전체" | "제보 승인" | "제보 거부") => {
    if (tab === "전체") return reports;
    if (tab === "제보 승인") return reports.filter((r) => r.status === "APPROVED");
    return reports.filter((r) => r.status === "REJECTED");
  };

  const counts = {
    전체: reports.length,
    "제보 승인": reports.filter((r) => r.status === "APPROVED").length,
    "제보 거부": reports.filter((r) => r.status === "REJECTED").length,
  };

  return { reports, getFiltered, counts, loading, error, reload: load };
}