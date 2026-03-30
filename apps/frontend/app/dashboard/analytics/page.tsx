"use client";

/* app/dashboard/analytics/page.tsx */

import styles from "./analytics.module.css";

const MessagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    <path d="M19 16v6M16 19h6"/>
  </svg>
)

const RepliesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M8 10h8M8 14h4"/>
  </svg>
)

const SpeedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const STATS = [
  { label: "Messages received", value: "0",     delta: null, icon: <MessagesIcon /> },
  { label: "Replies sent",      value: "0",     delta: null, icon: <RepliesIcon /> },
  { label: "Avg. reply time",   value: "—",     delta: null, icon: <SpeedIcon />   },
  { label: "Time saved",        value: "0 hrs", delta: null, icon: <ClockIcon />   },
];

const CATEGORY_BREAKDOWN = [
  { label: "Urgent",    pct: 0, color: "#f87171" },
  { label: "Pricing",   pct: 0, color: "#fbbf24" },
  { label: "Booking",   pct: 0, color: "#00e5b0" },
  { label: "FAQ",       pct: 0, color: "#93b4ff" },
  { label: "Complaint", pct: 0, color: "#f87171" },
  { label: "Spam",      pct: 0, color: "#6b7280" },
];

export default function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.sub}>Connect Gmail to start tracking your inbox performance</p>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Message volume</span>
          <span className={styles.chartSub}>Last 30 days</span>
        </div>
        <div className={styles.chartEmpty}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
          <p>Data will appear after you connect Gmail and receive messages</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Category breakdown</span>
          <span className={styles.chartSub}>All time</span>
        </div>
        <div className={styles.breakdown}>
          {CATEGORY_BREAKDOWN.map((c) => (
            <div key={c.label} className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>{c.label}</span>
              <div className={styles.breakdownBar}>
                <div
                  className={styles.breakdownFill}
                  style={{ width: `${c.pct}%`, background: c.color }}
                />
              </div>
              <span className={styles.breakdownPct}>{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}