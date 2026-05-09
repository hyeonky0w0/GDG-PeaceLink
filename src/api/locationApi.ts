const BASE = import.meta.env.VITE_API_BASE_URL;

export interface LocationResponse {
  lat: number;
  lng: number;
  address: string | null;
}

export async function getUserLocation(userId: string): Promise<LocationResponse> {
  const res = await fetch(`${BASE}/api/user/${userId}/location`);
  if (!res.ok) throw new Error("위치 조회 실패");
  return res.json();
}

export async function patchUserLocation(userId: string, lat: number, lng: number): Promise<LocationResponse> {
  const res = await fetch(`${BASE}/api/user/${userId}/location?lat=${lat}&lng=${lng}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("위치 업데이트 실패");
  return res.json();
}