import { useState, useEffect } from "react";

export const DEVICE_ID_KEY = "peacelink_device_id";
export const USER_ID_KEY = "peacelink_user_id";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PL-${timestamp}-${random}`.toUpperCase();
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function initDevice() {
      let did = localStorage.getItem(DEVICE_ID_KEY);
      if (!did) {
        did = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, did);
      }
      setDeviceId(did);

      try {
        const res = await fetch(`${BASE}/api/user/register-device`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: did }),
        });
        if (res.ok) {
          const data: { userId: string } = await res.json();
          localStorage.setItem(USER_ID_KEY, data.userId);
          setUserId(data.userId);
        }
      } catch (e) {
        const saved = localStorage.getItem(USER_ID_KEY) ?? "";
        setUserId(saved);
        console.error("유저 등록 실패:", e);
      }
    }

    initDevice();
  }, []);

  return { deviceId, userId };
}