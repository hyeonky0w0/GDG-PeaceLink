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

export interface SituationItem {
  id: string;
  icon: string;
  title: string;
  location: string;
  level: "높음" | "중간" | "낮음" | "안전";
  minutesAgo: number;
}

export interface LocationResponse {
  lat: number;
  lng: number;
  address: string | null;
}

// ✅ 환경변수 하나로 통일
const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchNearestShelter(
  lat: number,
  lng: number
): Promise<NearestShelterResponse> {
  const res = await fetch(`${BASE}/api/evacuation/shelters/nearest?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("대피소 조회 실패");
  return res.json();
}

export async function fetchNearbyShelters(
  lat: number,
  lng: number,
  limit = 5
): Promise<NearestShelterResponse[]> {
  const res = await fetch(`${BASE}/api/evacuation/shelters/nearby?lat=${lat}&lng=${lng}&limit=${limit}`);
  if (!res.ok) throw new Error("대피소 목록 조회 실패");
  return res.json();
}

export async function createEvacuationRoute(req: {
  userId: string;
  originLat: number;
  originLng: number;
  destLat?: number;
  destLng?: number;
}): Promise<EvacuationRouteResponse> {
  const res = await fetch(`${BASE}/api/evacuation/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("경로 생성 실패");
  return res.json();
}

export async function fetchLatestAlert(
  lat: number,
  lng: number
): Promise<EmergencyAlert | null> {
  const res = await fetch(`${BASE}/api/evacuation/threats/alerts/latest?lat=${lat}&lng=${lng}`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("재난 알림 조회 실패");
  return res.json();
}

export async function fetchSituations(
  lat: number,
  lng: number
): Promise<SituationItem[]> {
  const res = await fetch(`${BASE}/api/evacuation/threats/situations?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("상황 조회 실패");
  return res.json();
}

export async function getUserLocation(userId: string): Promise<LocationResponse> {
  const res = await fetch(`${BASE}/api/user/${userId}/location`);
  if (!res.ok) throw new Error("위치 조회 실패");
  return res.json();
}

export async function patchUserLocation(
  userId: string,
  lat: number,
  lng: number
): Promise<LocationResponse> {
  const res = await fetch(`${BASE}/api/user/${userId}/location?lat=${lat}&lng=${lng}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("위치 업데이트 실패");
  return res.json();
}