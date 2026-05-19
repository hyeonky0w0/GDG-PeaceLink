import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import login from "../images/login.svg";
import logoSvg from "../images/Peacelink.svg";

const DEVICE_ID_KEY = "peacelink_device_id";
const USER_ID_KEY = "peacelink_user_id";

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `PL-${timestamp}-${random}`.toUpperCase();
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

async function doRegister() {
  setLoading(true);
  setError(null);

  try {
    // 개발용 임시 로그인 우회
    localStorage.setItem(USER_ID_KEY, "dev-user");

    navigate("/", { replace: true });

    return;

    // ↓ 서버 연결 다시 할 때 복구
    /*
    const existingUserId = localStorage.getItem(USER_ID_KEY);
    if (existingUserId) {
      navigate("/", { replace: true });
      return;
    }

    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    const res = await fetch("/api/user/register-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, language: "ko" }),
    });

    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

    const data = await res.json();
    localStorage.setItem(USER_ID_KEY, String(data.userId));
    navigate("/", { replace: true });
    */
  } catch (err) {
    setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    doRegister();
  }, []);

  return (
    <div style={styles.page}>
      {/* 로고 */}
      <div style={styles.logoArea}>
        <img src={logoSvg} alt="Peacelink" style={styles.logo} />
      </div>

      {/* 설명 텍스트 */}
      <p style={styles.subtitle}>
        실시간 위험 정보를 기반으로<br />더 안전한 길을 안내해요
      </p>

      {/* 일러스트 */}
      <div style={styles.illustrationArea}>
        <img src={login} alt="illustration" style={styles.illustration} />
      </div>

      {/* 에러 메시지 */}
      {error && <p style={styles.error}>{error}</p>}

      {/* 시작하기 버튼 */}
      <div style={styles.buttonArea}>
        <button
          style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={error ? doRegister : undefined}
          disabled={loading && !error}
        >
          {loading && !error ? "로딩 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    background: "#ffffff",
    padding: "0 24px",
    boxSizing: "border-box",
  },
  logoArea: {
    marginTop: "72px",
    marginBottom: "12px",
  },
  logo: {
    height: 30,
    objectFit: "contain",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    lineHeight: 1.75,
    margin: "0 0 32px",
  },
  illustrationArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50%",
    maxHeight: 400,
  },
  illustration: {
    width: "100%",
    maxWidth: 320,
    objectFit: "contain",
  },
  error: {
    color: "#EB504E",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
  buttonArea: {
    width: "100%",
    padding: "24px 0 40px",
  },
  btn: {
    width: "100%",
    padding: "14px 0",
    background: "#EB504E",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.3px",

    transition: "opacity 0.15s",
  },
};