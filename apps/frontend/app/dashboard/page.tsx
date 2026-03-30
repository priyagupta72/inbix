"use client";

/* ─────────────────────────────────────────────────────────────
   app/dashboard/page.tsx  — Inbox
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import styles from "./inbox.module.css";

const CATEGORIES = ["All", "Urgent", "Pricing", "Booking", "FAQ", "Complaint", "Spam"] as const;
type Category = (typeof CATEGORIES)[number];

/* Mock messages — replace with real API data */
const MOCK_MESSAGES = [
  {
    id: "1", name: "Sarah Johnson", initials: "S",
    avatarGrad: "linear-gradient(135deg,#f87171,#fb923c)",
    subject: "Order hasn't arrived",
    preview: "URGENT: My order still hasn't arrived and it's been 2 weeks...",
    category: "Urgent", time: "2m ago", read: false,
  },
  {
    id: "2", name: "Mike Chen", initials: "M",
    avatarGrad: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    subject: "Retainer pricing",
    preview: "Hey, what are your rates for a monthly retainer package?",
    category: "Pricing", time: "14m ago", read: false,
  },
  {
    id: "3", name: "Aisha Patel", initials: "A",
    avatarGrad: "linear-gradient(135deg,#00e5b0,#0891b2)",
    subject: "Discovery call",
    preview: "I'd love to book a 30-minute discovery call this week!",
    category: "Booking", time: "1h ago", read: true,
  },
  {
    id: "4", name: "Tom Rivera", initials: "T",
    avatarGrad: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    subject: "What are your hours?",
    preview: "Quick question — what are your support hours?",
    category: "FAQ", time: "3h ago", read: true,
  },
] as const;

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  Urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  Booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
  FAQ:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
  Complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

/* Change this to `true` when Gmail is connected */
const GMAIL_CONNECTED = false;

export default function InboxPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [selected, setSelected] = useState<string[]>([]);

  const messages = MOCK_MESSAGES.filter(
    (m) => activeCategory === "All" || m.category === activeCategory
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inbox</h1>
          <p className={styles.sub}>All your Gmail messages, categorized by AI</p>
        </div>
        {GMAIL_CONNECTED && selected.length > 0 && (
          <button className={styles.bulkBtn}>
            Send {selected.length} replies
          </button>
        )}
      </div>

      {/* Gmail connect banner */}
      {!GMAIL_CONNECTED && (
        <div className={styles.connectBanner}>
          <div className={styles.connectBannerGlow} aria-hidden="true" />
          <div className={styles.connectIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#4f7cff" strokeWidth="1.5"/>
              <polyline points="22,6 12,13 2,6" stroke="#4f7cff" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className={styles.connectText}>
            <span className={styles.connectTitle}>Connect your Gmail to get started</span>
            <span className={styles.connectDesc}>
              ReplyEngine will read your inbox, categorize messages, and draft AI replies — all in real time.
            </span>
          </div>
          <Link href="/dashboard/settings" className={styles.connectBtn}>
            Connect Gmail
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      )}

      {/* Category filters */}
      <div className={styles.filters}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className={styles.list}>
        {GMAIL_CONNECTED ? (
          messages.length === 0 ? (
            <div className={styles.empty}>
              <p>No messages in this category</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                selected={selected.includes(msg.id)}
                onSelect={() => toggleSelect(msg.id)}
              />
            ))
          )
        ) : (
          /* Show blurred mock messages when not connected */
          <div className={styles.blurWrap}>
            {MOCK_MESSAGES.map((msg) => (
              <MessageRow key={msg.id} msg={msg} selected={false} onSelect={() => {}} />
            ))}
            <div className={styles.blurOverlay}>
              <div className={styles.blurMsg}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Connect Gmail to see your real messages
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Message row sub-component ── */
function MessageRow({
  msg, selected, onSelect,
}: {
  msg: (typeof MOCK_MESSAGES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const tag = TAG_STYLES[msg.category] ?? TAG_STYLES.FAQ;

  return (
    <div className={`${styles.row} ${!msg.read ? styles.rowUnread : ""} ${selected ? styles.rowSelected : ""}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={selected}
        onChange={onSelect}
      />
      <div className={styles.avatar} style={{ background: msg.avatarGrad }}>
        {msg.initials}
      </div>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowName}>{msg.name}</span>
          <span className={styles.rowTime}>{msg.time}</span>
        </div>
        <div className={styles.rowSubject}>{msg.subject}</div>
        <div className={styles.rowPreview}>{msg.preview}</div>
      </div>
      <span
        className={styles.tag}
        style={{ background: tag.bg, color: tag.color }}
      >
        {msg.category}
      </span>
      <Link href={`/dashboard/message/${msg.id}`} className={styles.viewBtn}>
        View
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  );
}