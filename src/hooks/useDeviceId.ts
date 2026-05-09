import { useState, useEffect } from "react";

const DEVICE_ID_KEY = "peacelink_device_id";
const USER_ID_KEY = "peacelink_user_id";

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PL-${timestamp}-${random}`.toUpperCase();
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // 저장된 값 불러오기
    const savedDeviceId = localStorage.getItem(DEVICE_ID_KEY) ?? "";
    const savedUserId = localStorage.getItem(USER_ID_KEY) ?? "";
    setDeviceId(savedDeviceId);
    setUserId(savedUserId);
  }, []);

  return { deviceId, userId };
}