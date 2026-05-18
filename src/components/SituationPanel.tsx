import { useState } from "react";
import type { SituationItem } from "../api/evacuationApi";
import styles from "../styles/SituationPanel.module.css";

type SituationLevel = "높음" | "중간" | "낮음" | "안전";

const LEVEL_COLOR: Record<SituationLevel, string> = {
  높음: "#ef4444",
  중간: "#f97316",
  낮음: "#22c55e",
  안전: "#3b82f6",
};

// 아이콘 → 카테고리명
const CATEGORY_LABEL: Record<string, string> = {
  "🔥": "화재/산불",
  "🌊": "홍수/호우",
  "🌏": "지진",
  "🌀": "태풍",
  "😷": "미세먼지",
  "🚧": "교통통제",
  "📢": "기타",
  "⚠️": "위험",
};

interface CategoryGroup {
  icon: string;
  label: string;
  items: SituationItem[];
  topLevel: SituationLevel;
}

function groupByCategory(items: SituationItem[]): CategoryGroup[] {
  const map = new Map<string, SituationItem[]>();
  items.forEach((item) => {
    const list = map.get(item.icon) ?? [];
    list.push(item);
    map.set(item.icon, list);
  });

  const levelOrder: Record<SituationLevel, number> = {
    높음: 0, 중간: 1, 낮음: 2, 안전: 3,
  };

  return Array.from(map.entries()).map(([icon, groupItems]) => {
    // ✅ reduce 타입 명시 + < 연산자 복구
    const topLevel = groupItems.reduce<SituationLevel>((best, cur) => {
      const curLevel = cur.level as SituationLevel;
      return levelOrder[curLevel] < levelOrder[best] ? curLevel : best;
    }, "안전");

    return {
      icon,
      label: CATEGORY_LABEL[icon] ?? "기타",
      items: groupItems.sort((a, b) =>
        levelOrder[a.level as SituationLevel] -
        levelOrder[b.level as SituationLevel]
      ),
      topLevel,
    };
  }).sort((a, b) =>
    levelOrder[a.topLevel] - levelOrder[b.topLevel]
  );
}

interface Props {
  situations: SituationItem[];
  loading: boolean;
  error: string | null;
}

export function SituationPanel({ situations, loading, error }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const groups = groupByCategory(situations);

  const handlePress = (icon: string) => {
    setOpenCategory((prev) => (prev === icon ? null : icon));
  };

  if (loading) return <p className={styles.msg}>상황 조회 중...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (groups.length === 0)
    return <p className={styles.msg}>현재 주변 위험 상황이 없습니다.</p>;

  return (
    <ul className={styles.list}>
      {groups.map((group) => (
        <li key={group.icon} className={styles.categoryItem}>
          {/* 카테고리 헤더 - 꾹 누르면 토글 */}
          <button
            className={styles.categoryHeader}
            onMouseDown={() => {}}
            onClick={() => handlePress(group.icon)}
            style={{ borderLeft: `4px solid ${LEVEL_COLOR[group.topLevel]}` }}
          >
            <span className={styles.categoryIcon}>{group.icon}</span>
            <span className={styles.categoryLabel}>{group.label}</span>
            <span
              className={styles.categoryLevel}
              style={{ color: LEVEL_COLOR[group.topLevel] }}
            >
              {group.topLevel}
            </span>
            <span className={styles.categoryCount}>{group.items.length}건</span>
            <span className={styles.categoryArrow}>
              {openCategory === group.icon ? "▲" : "▼"}
            </span>
          </button>

          {/* 상세 목록 토글 */}
          {openCategory === group.icon && (
            <ul className={styles.detailList}>
              {group.items.map((item) => (
                <li key={item.id} className={styles.detailItem}>
                  <div className={styles.detailTop}>
                    <span
                      className={styles.detailLevel}
                      style={{ color: LEVEL_COLOR[item.level as SituationLevel] }}
                    >
                      {item.level}
                    </span>
                    <span className={styles.detailTime}>
                      {item.minutesAgo}분 전
                    </span>
                  </div>
                  <p className={styles.detailTitle}>{item.title}</p>
                  <p className={styles.detailLocation}>{item.location}</p>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}