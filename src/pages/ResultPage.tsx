import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { useDeviceId } from "../hooks/useDeviceId";
import {
  useMyReports,
  type ReportResponse,
  REPORT_TYPE_LABEL,
  STATUS_LABEL,
  RISK_LABEL,
  formatDate,
} from "../hooks/useMyReports";
import styles from "../styles/MyReportsPage.module.css";

import camera from "../images/camera.svg"
import sound from "../images/sound.svg"

// ← 여기서 useDeviceId() 호출하던 줄 2개 삭제 ✅

// ── 탭 ───────────────────────────────────────────────────────
type Tab = "전체" | "제보 승인" | "제보 거부";

const TABS: Tab[] = ["전체", "제보 승인", "제보 거부"];

// ── 위험도 색상 ───────────────────────────────────────────────

const RISK_COLOR = {
  LOW: { bg: "#dcfce7", text: "#15803d" },
  MEDIUM: { bg: "#fff7ed", text: "#c2410c" },
  HIGH: { bg: "#fee2e2", text: "#dc2626" },
  CRITICAL: { bg: "#f3e8ff", text: "#7c3aed" },
};



// ── 카드 컴포넌트 ─────────────────────────────────────────────

function ReportCard({ report }: { report: ReportResponse }) {
  const [open, setOpen] = useState(false);


  const statusStyle =
    report.status === "VERIFIED"   
      ? styles.badgeApproved
      : report.status === "REJECTED"
      ? styles.badgeRejected
      : styles.badgePending

  return (
    <div className={styles.card} onClick={() => setOpen((v) => !v)}>
      {/* 상단 행 */}
      <div className={styles.cardTop}>
        <span className={styles.category}>
          {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
        </span>
        <span className={`${styles.badge} ${statusStyle}`}>
          {STATUS_LABEL[report.status]}
        </span>
      </div>

      {/* 위치 */}
      {(report.lat != null && report.lng != null) && (
        <p className={styles.location}>
          📍 {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
        </p>
      )}

      {/* 일시 */}
      <p className={styles.date}>제보 일시 {formatDate(report.createdAt)}</p>

      {/* 위험도 칩 */}
      {report.riskLevel && (
        <span
          className={styles.riskChip}
          style={{
            background: RISK_COLOR[report.riskLevel].bg,
            color: RISK_COLOR[report.riskLevel].text,
          }}
        >
          위험도 {RISK_LABEL[report.riskLevel]}
        </span>
      )}

      {/* 상세 펼치기 */}
      {open && (
        <div className={styles.detail}>
          {/* 내 설명 */}
          {report.description && (
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>내용</span>
              {report.description}
            </p>
          )}

          {/* AI 분석 사유 */}
          {report.riskReason && (
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>AI 분석</span>
              {report.riskReason}
            </p>
          )}

          {/* Grounding 검증 요약 */}
          {report.verifiedSummary && (
            <p className={styles.detailRow}>
              <span className={styles.detailLabel}>검증 결과</span>
              {report.verifiedSummary}
            </p>
          )}

          {/* 미디어 아이콘 표시 */}
{report.mediaUrls?.length > 0 && (() => {
  const imageUrls = report.mediaUrls.filter(u =>
    /\/(images|videos)\//i.test(u) || /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)(\?|$)/i.test(u)
  );
  const audioUrls = report.mediaUrls.filter(u =>
    /\/audio\//i.test(u) || /\.(aac|mp3|wav|ogg|flac)(\?|$)/i.test(u)
  );

  return (
    <div className={styles.mediaIconRow}>
      {imageUrls.length > 0 && (
        <div className={styles.mediaIconItem}>
          <img src={camera} alt="이미지" className={styles.mediaIconImg} />
          <span className={styles.mediaIconCount}>{imageUrls.length}개</span>
        </div>
      )}
      {audioUrls.length > 0 && (
        <div className={styles.mediaIconItem}>
          <img src={sound} alt="음성" className={styles.mediaIconImg} />
          <span className={styles.mediaIconCount}>음성 첨부</span>
        </div>
      )}
    </div>
  );
})()}
        </div>
      )}

      <span className={styles.chevron}>{open ? "▲" : "▼"}</span>
    </div>
  );
}


// ── 메인 페이지 ───────────────────────────────────────────────

export default function MyReportsPage() {
  const { userId } = useDeviceId();

  // ✅ 빈 문자열이나 "null" 문자열 차단
  const validUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    ? userId
    : null;

  const { getFiltered, counts, loading, error, reload } = useMyReports(validUserId);
  const [activeTab, setActiveTab] = useState<Tab>("전체");

  const list = getFiltered(activeTab);

  return (
    <div className={styles.page}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <h1 className={styles.title}>내 제보 목록</h1>
        <button className={styles.refreshBtn} onClick={reload} title="새로고침">
          ↻
        </button>
      </header>

      {/* ── 탭 ── */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className={styles.tabCount}>{counts[tab]}</span>
            <span className={styles.tabLabel}>{tab}</span>
          </button>
        ))}
      </div>

      {/* ── 목록 ── */}
      <div className={styles.list}>
        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>불러오는 중...</p>
          </div>
        )}
        {error && !loading && (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={reload}>
              다시 시도
            </button>
          </div>
        )}
        {!loading && !error && list.length === 0 && (
          <div className={styles.stateBox}>
            <p className={styles.emptyText}>제보 내역이 없습니다.</p>
          </div>
        )}
        {!loading && list.map((r) => <ReportCard key={r.id} report={r} />)}
      </div>

      <BottomNav />
    </div>
  );
}