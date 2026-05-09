import { useState, useEffect } from "react";

const DEVICE_ID_KEY = "peacelink_device_id";

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PL-${timestamp}-${random}`.toUpperCase();
}

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}