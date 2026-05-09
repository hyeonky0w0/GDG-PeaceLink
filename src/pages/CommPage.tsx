// 여기서 통신창 작업해주세요!! 
import { BottomNav } from "../components/BottomNav";
import styles from "../styles/HomePage.module.css";

export default function CommPage() {
  return (
    <div className={styles.page}>
      <div className={styles.centered}>
        <p style={{ color: "#a0aec0", fontSize: 14 }}>통신 기능 준비 중입니다.</p>
      </div>
      <BottomNav />
    </div>
  );
}