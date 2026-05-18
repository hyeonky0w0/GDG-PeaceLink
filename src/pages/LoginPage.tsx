import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    async function autoRegister() {
      try {
        // 이미 등록된 경우 바로 홈으로
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
          body: JSON.stringify({ deviceId, language: "ko" }), // language 추가
        });

        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

        const data = await res.json();
        localStorage.setItem(USER_ID_KEY, String(data.userId));

        navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      }
    }

    autoRegister();
  }, []);

  // 등록 중 로딩 화면
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <span style={{ color: "#1e293b" }}>Peace</span>
          <span style={{ color: "#3b82f6" }}>link</span>
        </h1>
        {error ? (
          <>
            <p style={styles.error}>{error}</p>
            <button style={styles.btn} onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </>
        ) : (
          <p style={styles.desc}>준비 중...</p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4ff",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "48px 36px",
    textAlign: "center",
    boxShadow: "0 8px 32px #0001",
    maxWidth: 360,
    width: "100%",
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    margin: "0 0 12px",
  },
  desc: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.7,
    margin: "0 0 32px",
  },
  error: {
    color: "#e53e3e",
    fontSize: 13,
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    padding: "14px 0",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
};