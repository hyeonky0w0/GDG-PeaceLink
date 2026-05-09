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