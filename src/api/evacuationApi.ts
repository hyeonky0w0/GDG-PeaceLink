import type { EmergencyAlert } from "../types";

export interface NearestShelterResponse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  code: string;
  distanceKm: number;
  walkMinutes: number;
}

export interface EvacuationRouteResponse {
  id: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  shelterName: string | null;
  shelterCode: string | null;
  distanceKm: number | null;
  walkMinutes: number | null;
  isOffline: boolean;
  routeGeoJson: string | null;
  createdAt: string;
}

const BASE = "/api/evacuation";

export async function fetchNearestShelter(
  lat: number,
  lng: number
): Promise<NearestShelterResponse> {
  const res = await fetch(`${BASE}/shelters/nearest?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("대피소 조회 실패");
  return res.json();
}

export async function createEvacuationRoute(req: {
  userId: string;
  originLat: number;
  originLng: number;
  destLat?: number;
  destLng?: number;
}): Promise<EvacuationRouteResponse> {
  const res = await fetch(`${BASE}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("경로 생성 실패");
  return res.json();
}

export async function fetchNearbyShelters(
  lat: number,
  lng: number,
  limit = 5
): Promise<NearestShelterResponse[]> {
  const res = await fetch(`/api/evacuation/shelters/nearby?lat=${lat}&lng=${lng}&limit=${limit}`);
  if (!res.ok) throw new Error("대피소 목록 조회 실패");
  return res.json();
}


export async function fetchLatestAlert(
  lat: number,
  lng: number
): Promise<EmergencyAlert | null> {
  const res = await fetch(
    `/api/evacuation/threats/alerts/latest?lat=${lat}&lng=${lng}`
  );
  if (res.status === 204) return null; // 데이터 없음
  if (!res.ok) throw new Error("재난 알림 조회 실패");
  return res.json();
}


export interface SituationItem {
  id: string;
  icon: string;
  title: string;
  location: string;
  level: "높음" | "중간" | "낮음" | "안전";
  minutesAgo: number;
}

export async function fetchSituations(
  lat: number,
  lng: number
): Promise<SituationItem[]> {
  const res = await fetch(
    `/api/evacuation/threats/situations?lat=${lat}&lng=${lng}`
  );
  if (!res.ok) throw new Error("상황 조회 실패");
  return res.json();
}