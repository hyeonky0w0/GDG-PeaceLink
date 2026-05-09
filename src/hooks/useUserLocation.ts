import { useState, useCallback } from "react";
import type { UserLocation, District } from "../types";

const LOCATION_KEY = "peacelink_user_location";

const DEFAULT_LOCATION: UserLocation = {
  district: { code: "KR-11-140", name: "서울특별시 중구" },
  lat: 37.5665,
  lng: 126.978,
};

function loadSaved(): UserLocation {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (raw) return JSON.parse(raw) as UserLocation;
  } catch {
    // ignore
  }
  return DEFAULT_LOCATION;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(loadSaved);

  const updateLocation = useCallback((district: District, lat: number, lng: number) => {
    const next: UserLocation = { district, lat, lng };
    setLocation(next);
    localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
  }, []);

  const detectGPS = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS를 지원하지 않는 기기입니다."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // 실제로는 좌표 → 행정구역 역지오코딩 API 호출 필요
          // 여기서는 좌표만 업데이트하고 구 이름은 유지
          updateLocation(location.district, pos.coords.latitude, pos.coords.longitude);
          resolve();
        },
        () => reject(new Error("위치 정보를 가져올 수 없습니다."))
      );
    });
  }, [location.district, updateLocation]);

  return { location, updateLocation, detectGPS };
}