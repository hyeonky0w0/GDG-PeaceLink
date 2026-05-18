import type { EmergencyAlert } from "../types";
import styles from "../styles/EmergencyBanner.module.css";



const ICON_MAP = {
  critical: "⚠️",
  warning: "🔔",
  info: "ℹ️",
};

const LABEL_MAP = {
  critical: "긴급 정보",
  warning: "주의 정보",
  info: "안내",
};

interface Props {
  alerts: EmergencyAlert[];
  loading: boolean;
  error: string | null;
  onDismiss: (id: string) => void;
}

export function EmergencyBanner({ alerts, loading, error, onDismiss }: Props) {
  if (loading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.banner} ${styles.warning}`}>
        <div className={styles.topRow}>
          <div className={styles.labelGroup}>
            <span className={styles.icon}>⚠️</span>
            <span className={`${styles.label} ${styles.warning}`}>연결 오류</span>
          </div>
        </div>
        <p className={`${styles.message} ${styles.warning}`}>{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <>
      {alerts.map((alert) => (
        <div key={alert.id} className={`${styles.banner} ${styles[alert.level]}`}>
          <div className={styles.topRow}>
            <div className={styles.labelGroup}>
              <span className={styles.icon}>{ICON_MAP[alert.level]}</span>
              <span className={`${styles.label} ${styles[alert.level]}`}>
                {LABEL_MAP[alert.level]}
              </span>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => onDismiss(alert.id)}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <p className={`${styles.message} ${styles[alert.level]}`}>{alert.message}</p>
        </div>
      ))}
    </>
  );
}