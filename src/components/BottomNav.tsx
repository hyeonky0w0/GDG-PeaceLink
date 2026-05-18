import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/BottomNav.module.css";

type NavTab = "threat" | "comm" | "result";

const NAV_ITEMS: { id: NavTab; label: string; icon: string; path: string }[] = [
  { id: "threat", label: "위협 분석", icon: "🏠", path: "/" },
  { id: "comm",   label: "통신",     icon: "📡", path: "/comm" },
  { id: "result",   label: "제보목록",     icon: "📡", path: "/result" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeTab: NavTab = pathname === "/comm" ? "comm" : "threat";

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <span className={styles.navIcon}>{tab.icon}</span>
          <span className={styles.navLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}