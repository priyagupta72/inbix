"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/StatsStrip.tsx
   Horizontal strip of 4 key metric stats
───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import styles from "./StatsStrip.module.css";

const STATS = [
  { num: "~15s", label: "to process 100 messages"  },
  { num: "60%",  label: "reduction in AI API costs" },
  { num: "4",    label: "tone styles per reply"     },
  { num: "3",    label: "platforms connected"       },
] as const;

export default function StatsStrip() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.strip}>
      {STATS.map((s, i) => (
        <div
          key={s.label}
          className={`${styles.statItem} fade-up`}
          ref={(el) => { itemRefs.current[i] = el; }}
          style={{ transitionDelay: `${i * 0.08}s` }}
        >
          <div className={`${styles.statNum} text-grad`}>{s.num}</div>
          <div className={styles.statLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}