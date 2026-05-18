import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/BottomNav.module.css";

import home from "../images/buttom-home.svg";
import comm from "../images/buttom-comm.svg";
import list from "../images/buttom-list.svg";

type NavTab = "threat" | "comm" | "result";

const NAV_ITEMS: { id: NavTab; label: string; src: string; path: string }[] = [
  { id: "threat", label: "위협 분석", src: home, path: "/" },
  { id: "comm",   label: "통신",     src: comm, path: "/comm" },
  { id: "result", label: "제보목록", src: list, path: "/result" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeTab: NavTab =
    pathname === "/comm" ? "comm" : pathname === "/result" ? "result" : "threat";

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            onClick={() => navigate(tab.path)}
          >
            <span className={styles.navIcon}>
              <img src={tab.src} alt={tab.label} height={24} />
            </span>
            <span className={styles.navLabel}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}