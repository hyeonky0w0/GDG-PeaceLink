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

  const detectGPS = useCallback((): Promise<void> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2RegionCode(lng, lat, (result: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const region = result.find((r) => r.region_type === "H");
            if (region) {
              updateLocation(
                { code: region.code, name: `${region.region_1depth_name} ${region.region_2depth_name}` },
                lat,
                lng
              );
            }
          }
          resolve();
        });
      },
      (err) => {
        console.warn("GPS 감지 실패:", err.message);
        reject(err);
      }
    );
  });
}, [updateLocation]);

  
  return { location, updateLocation, detectGPS };
}