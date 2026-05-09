import { Map, useKakaoLoader } from "react-kakao-maps-sdk";

export default function HomePage() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_KEY, // Vite 전용 환경변수 호출 방식
    libraries: ["services", "clusterer"],
  });

  if (loading) return <div>지도를 불러오는 중입니다...</div>;
  if (error) return <div>지도를 로드할 수 없습니다.</div>;

  return (
    <Map
      center={{ lat: 37.5665, lng: 126.9780 }} // 서울 시청 기준
      style={{ width: "100%", height: "500px" }}
      level={3}
    />
  );
}