const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;

const TYPE_MAP: Record<string, string> = {
  flood:  "FLOOD",
  fire:   "FIRE_SMOKE",
  bomb:   "EXPLOSION_ATTACK",
  rescue: "RESCUE_REQUEST",
  road:   "ROAD_CONTROL",
  other:  "OTHER_DANGER",
};

export interface SubmitReportParams {
  typeId:      string;
  userId:      string;
  lat:         number | null;
  lng:         number | null;
  description: string;
  imageFiles:  File[];
  videoFile:   File | null;
  audioFile:   File | null;
}

export async function submitReport(params: SubmitReportParams) {
  if (!params.userId) throw new Error("로그인이 필요합니다.");

  const form = new FormData();
  form.append("userId",      params.userId);
  form.append("reportType",  TYPE_MAP[params.typeId]);
  if (params.lat  != null) form.append("lat",  String(params.lat));
  if (params.lng  != null) form.append("lng",  String(params.lng));
  if (params.description)   form.append("description", params.description);

  // 이미지 (여러 장 — 키 이름을 "images"로 통일)
  params.imageFiles.forEach((f) => form.append("images", f));

  // 동영상
  if (params.videoFile) form.append("video", params.videoFile);

  // 음성
  if (params.audioFile) form.append("audio", params.audioFile);

  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    body: form,
    // Content-Type 헤더 직접 설정 금지 — fetch가 boundary 포함해서 자동 설정
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`제보 실패: ${err.message ?? res.status}`);
  }

  return res.json();
}