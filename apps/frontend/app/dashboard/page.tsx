"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import styles from "./inbox.module.css";

const CATEGORIES = ["All", "Urgent", "Pricing", "Booking", "FAQ", "Complaint", "Spam"] as const;
type Category = (typeof CATEGORIES)[number];

// Added "Archived" tab
type InboxTab = "Open" | "Done" | "Archived";

type Message = {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  category: string;
  receivedAt: string;
  isRead: boolean;
  isReplied: boolean;
  isArchived?: boolean; // backend should return this field
};

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  Urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  Booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
  FAQ:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
  Complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  Automated: { bg: "#94a3b826",              color: "#94a3b8" },
};

const categoryMap: Record<string, string> = {
  urgent: "Urgent", pricing: "Pricing", booking: "Booking",
  faq: "FAQ", complaint: "Complaint", spam: "Spam", automated: "Automated",
};

const TONE_DISPLAY: Record<string, string> = {
  professional: "Professional",
  friendly:     "Friendly",
  brief:        "Brief",
  formal:       "Formal",
};

const getAvatar = (name: string) => {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#f87171,#fb923c)",
    "linear-gradient(135deg,#fbbf24,#f59e0b)",
    "linear-gradient(135deg,#00e5b0,#0891b2)",
    "linear-gradient(135deg,#a78bfa,#7c3aed)",
    "linear-gradient(135deg,#4f7cff,#6366f1)",
    "linear-gradient(135deg,#34d399,#059669)",
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return { initials, grad: gradients[index] };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const MOCK_MESSAGES = [
  { id: "1", fromName: "Sarah Johnson", fromEmail: "", subject: "Order hasn't arrived", body: "URGENT: My order still hasn't arrived and it's been 2 weeks...", category: "Urgent",  receivedAt: new Date(Date.now() - 2 * 60000).toISOString(),  isRead: false, isReplied: false },
  { id: "2", fromName: "Mike Chen",     fromEmail: "", subject: "Retainer pricing",     body: "Hey, what are your rates for a monthly retainer package?",   category: "Pricing", receivedAt: new Date(Date.now() - 14 * 60000).toISOString(), isRead: false, isReplied: false },
  { id: "3", fromName: "Aisha Patel",   fromEmail: "", subject: "Discovery call",       body: "I'd love to book a 30-minute discovery call this week!",      category: "Booking", receivedAt: new Date(Date.now() - 60 * 60000).toISOString(), isRead: true,  isReplied: false },
  { id: "4", fromName: "Tom Rivera",    fromEmail: "", subject: "What are your hours?", body: "Quick question — what are your support hours?",              category: "FAQ",     receivedAt: new Date(Date.now() - 3 * 3600000).toISOString(), isRead: true,  isReplied: false },
];

const fetcher = (url: string) => apiFetch(url).then((r) => r.data);

export default function InboxPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeTab, setActiveTab]           = useState<InboxTab>("Open");
  const [selected, setSelected]             = useState<string[]>([]);
  const [fetching, setFetching]             = useState(false);
  const [showBulkModal, setShowBulkModal]   = useState(false);
  const [bulkSending, setBulkSending]       = useState(false);
  const [bulkResult, setBulkResult]         = useState<{ sent: number; failed: number } | null>(null);

  // ── SWR: Gmail status ──
  const { data: statusData, isLoading: statusLoading } = useSWR("/api/gmail/status", fetcher, {
    revalidateOnFocus: false,
  });
  const gmailConnected = statusLoading ? true : (statusData?.connected ?? false);

  // ── SWR: User settings ──
  const { data: settingsData } = useSWR(
    gmailConnected ? "/api/settings" : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const tonePreference: string = settingsData?.settings?.tonePreference ?? "professional";
  const toneLabel = TONE_DISPLAY[tonePreference] ?? "Professional";

  // ── SWR: Messages ──
  const { data: activeData, isLoading: loadingActive, mutate: mutateActive } = useSWR(
  gmailConnected ? "/api/messages" : null,
  fetcher,
  { refreshInterval: 40000, revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 1000 }
);

const { data: archivedData, isLoading: loadingArchived, mutate: mutateArchived } = useSWR(
  gmailConnected ? "/api/messages?isArchived=true" : null,
  fetcher,
  { refreshInterval: 0, revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 1000 }
);

const messages: Message[] = [
  ...(activeData?.messages ?? []),
  ...(archivedData?.messages ?? []),
];
const loading = loadingActive || loadingArchived;
const mutate = () => { mutateActive(); mutateArchived(); };

  // ── Manual refresh ──
  const handleRefresh = async () => {
    setFetching(true);
    try {
      await apiFetch("/api/gmail/fetch", { method: "POST" });
      await mutate();
    } catch (err) {
    } finally {
      setFetching(false);
    }
  };

  // ── Bulk reply ──
  const handleBulkReply = async () => {
    setBulkSending(true);
    setBulkResult(null);
    try {
      const res = await apiFetch("/api/messages/bulk-reply", {
        method: "POST",
        body: JSON.stringify({ messageIds: selected }),
      });
      setBulkResult({ sent: res.data?.sent ?? 0, failed: res.data?.failed ?? 0 });
      setSelected([]);
      await mutate();
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkResult(null);
      }, 2000);
    } catch (err) {
    } finally {
      setBulkSending(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ✅ Filter logic now handles 3 tabs
  const filtered = messages
    .filter((m) => {
      if (activeTab === "Archived") return !!m.isArchived;
      if (activeTab === "Done")     return !m.isArchived && m.isReplied;
      return !m.isArchived && !m.isReplied; // Open
    })
    .filter((m) =>
      activeCategory === "All" ||
      (categoryMap[m.category.toLowerCase()] ?? m.category) === activeCategory
    );

  const tabCounts: Record<InboxTab, number> = {
    Open:     messages.filter(m => !m.isArchived && !m.isReplied).length,
    Done:     messages.filter(m => !m.isArchived && m.isReplied).length,
    Archived: messages.filter(m => !!m.isArchived).length,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inbox</h1>
          <p className={styles.sub}>All your Gmail messages, categorized by AI</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {gmailConnected && (
            <button className={styles.refreshBtn} onClick={handleRefresh} disabled={fetching}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: fetching ? "rotate(360deg)" : "none", transition: "transform 0.5s" }}>
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {fetching ? "Refreshing..." : "Refresh"}
            </button>
          )}
          {/* Only show bulk reply when on Open tab and items selected */}
          {gmailConnected && selected.length > 0 && activeTab === "Open" && (
            <button className={styles.bulkBtn} onClick={() => setShowBulkModal(true)}>
              Send {selected.length} replies
            </button>
          )}
        </div>
      </div>

      {/* Gmail connect banner */}
      {!statusLoading && !gmailConnected && (
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
              inbix will read your inbox, categorize messages, and draft AI replies — all in real time.
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

      {/* ✅ Tabs — now 3: Open, Done, Archived */}
      <div className={styles.tabs}>
        {(["Open", "Done", "Archived"] as InboxTab[]).map((tab) => (
          <button key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""} ${tab === "Archived" ? styles.tabArchived : ""}`}
            onClick={() => { setActiveTab(tab); setSelected([]); }}>
            {tab === "Archived" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            )}
            {tab}
            <span className={styles.tabCount}>
              {gmailConnected ? tabCounts[tab] : 0}
            </span>
          </button>
        ))}
      </div>

      {/* Category filters — hide for Archived since they're already done */}
      {activeTab !== "Archived" && (
        <div className={styles.filters}>
          {CATEGORIES.map((cat) => (
            <button key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ""}`}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Archived tab empty state */}
      {activeTab === "Archived" && gmailConnected && filtered.length === 0 && (
        <div className={styles.archivedEmpty}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2">
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <p>No archived messages yet</p>
          <span>Messages you archive will appear here</span>
        </div>
      )}

      {/* Message list */}
      <div className={styles.list}>
        {gmailConnected ? (
          filtered.length === 0 && activeTab !== "Archived" ? (
            <div className={styles.empty}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
              <p>{activeCategory === "All" ? `No ${activeTab === "Open" ? "open" : "replied"} messages` : `No ${activeCategory} messages`}</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                selected={selected.includes(msg.id)}
                onSelect={() => toggleSelect(msg.id)}
                isArchived={activeTab === "Archived"}
              />
            ))
          )
        ) : !statusLoading ? (
          <div className={styles.blurWrap}>
            {MOCK_MESSAGES.map((msg) => (
              <MessageRow key={msg.id} msg={msg} selected={false} onSelect={() => {}} isArchived={false} />
            ))}
            <div className={styles.blurOverlay}>
              <div className={styles.blurMsg}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Connect Gmail to see your real messages
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Bulk reply modal ── */}
      {showBulkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              Send {selected.length} {selected.length === 1 ? "reply" : "replies"}?
            </h3>
            <div className={styles.modalMeta}>
              <div className={styles.modalMetaRow}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Tone: <strong>{toneLabel}</strong>
              </div>
              <div className={styles.modalMetaRow}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Template replies used where category matches
              </div>
            </div>
            <p className={styles.modalDesc}>
              This will send AI-generated replies to {selected.length} selected messages using your saved preferences. This cannot be undone.
            </p>
            {bulkResult && (
              <div className={styles.bulkResult}>
                <span className={styles.bulkResultSent}>✓ {bulkResult.sent} sent</span>
                {bulkResult.failed > 0 && (
                  <span className={styles.bulkResultFailed}>✗ {bulkResult.failed} failed</span>
                )}
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn}
                onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                disabled={bulkSending}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleBulkReply}
                disabled={bulkSending || !!bulkResult}>
                {bulkSending ? "Sending..." : `Send ${selected.length} replies`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Message row ── */
function MessageRow({ msg, selected, onSelect, isArchived }: {
  msg: Message;
  selected: boolean;
  onSelect: () => void;
  isArchived: boolean;
}) {
  const category = categoryMap[msg.category.toLowerCase()] ?? msg.category;
  const tag = TAG_STYLES[category] ?? TAG_STYLES.FAQ;
  const { initials, grad } = getAvatar(msg.fromName);

  return (
    <div className={`
      ${styles.row}
      ${!msg.isRead ? styles.rowUnread : ""}
      ${selected ? styles.rowSelected : ""}
      ${msg.isReplied ? styles.rowReplied : ""}
      ${isArchived ? styles.rowArchived : ""}
    `}>
      {/* Don't show checkbox in Archived tab — bulk reply doesn't apply there */}
      {!isArchived && (
        <input type="checkbox" className={styles.checkbox} checked={selected} onChange={onSelect}/>
      )}
      <div className={styles.avatar} style={{ background: grad }}>{initials}</div>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowName}>{msg.fromName}</span>
          <span className={styles.rowTime}>{timeAgo(msg.receivedAt)}</span>
        </div>
        <div className={styles.rowSubject}>{msg.subject}</div>
        <div className={styles.rowPreview}>{msg.body?.slice(0, 100)}</div>
      </div>
      {/* ✅ Show "Archived" badge in the archived tab, otherwise normal category/replied tag */}
      {isArchived ? (
        <span className={styles.tag} style={{ background: "rgba(107,114,128,0.15)", color: "#9ca3af" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 3 }}>
            <polyline points="21 8 21 21 3 21 3 8"/>
            <rect x="1" y="3" width="22" height="5"/>
          </svg>
          Archived
        </span>
      ) : msg.isReplied ? (
        <span className={styles.tag} style={{ background: "#22c55e26", color: "#22c55e" }}>
          ✓ Replied
        </span>
      ) : (
        <span className={styles.tag} style={{ background: tag.bg, color: tag.color }}>
          {category}
        </span>
      )}
      <Link href={`/dashboard/message/${msg.id}`} className={styles.viewBtn}>
        View
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  );
}