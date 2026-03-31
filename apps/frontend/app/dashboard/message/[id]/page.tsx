"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./message.module.css";
import { useSWRConfig } from "swr";

/* ── Types ── */
type Tone = "prof" | "friend" | "brief" | "formal";
type ActiveTab = Tone | "template";

interface MatchedTemplate {
  id:       string;
  content:  string;
  category: string;
  trigger:  string;
}

interface Message {
  id:             string;
  fromName:       string;
  fromEmail:      string;
  subject:        string;
  body:           string;
  category:       string;
  priority:       number;
  receivedAt:     string;
  isReplied:      boolean;
  isRead:         boolean;
  aiReplyProf:    string | null;
  aiReplyFriend:  string | null;
  aiReplyBrief:   string | null;
  aiReplyFormal:  string | null;
  matchedTemplate: MatchedTemplate | null;
}

const TONE_LABELS: Record<Tone, string> = {
  prof:   "Professional",
  friend: "Friendly",
  brief:  "Brief",
  formal: "Formal",
};

const TONE_TO_FIELD: Record<Tone, keyof Message> = {
  prof:   "aiReplyProf",
  friend: "aiReplyFriend",
  brief:  "aiReplyBrief",
  formal: "aiReplyFormal",
};

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
  faq:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
  complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const msgId  = params.id as string;

  /* ── State ── */
  const [message, setMessage]           = useState<Message | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<ActiveTab>("prof");
  const [editedReply, setEditedReply]   = useState("");

  // ── Draft history: one stack per tone ──────────────────────────────────────
  // Each entry: { drafts: string[], cursor: number }
  // cursor points to the currently displayed draft (0 = oldest, length-1 = newest)
  const [draftHistory, setDraftHistory] = useState<
    Partial<Record<Tone, { drafts: string[]; cursor: number }>>
  >({});

  const [loadingTone, setLoadingTone]   = useState<Tone | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [archived, setArchived]         = useState(false);

  /* ── Helpers for history ── */
  const pushDraft = (tone: Tone, draft: string) => {
    setDraftHistory(prev => {
      const existing = prev[tone];
      if (existing) {
        // If cursor isn't at the end, discard everything after cursor before pushing
        const kept = existing.drafts.slice(0, existing.cursor + 1);
        return {
          ...prev,
          [tone]: { drafts: [...kept, draft], cursor: kept.length },
        };
      }
      return { ...prev, [tone]: { drafts: [draft], cursor: 0 } };
    });
  };

  const navigateHistory = (tone: Tone, direction: "back" | "forward") => {
    setDraftHistory(prev => {
      const existing = prev[tone];
      if (!existing) return prev;
      const next = direction === "back"
        ? Math.max(0, existing.cursor - 1)
        : Math.min(existing.drafts.length - 1, existing.cursor + 1);
      const newDraft = existing.drafts[next];
      setEditedReply(newDraft);
      return { ...prev, [tone]: { ...existing, cursor: next } };
    });
  };

  /* ── Fetch message on mount ── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/messages/${msgId}`);
        const msg: Message = data.data;
        setMessage(msg);

        // Seed history stacks from DB values (each becomes draft[0])
        const initialHistory: Partial<Record<Tone, { drafts: string[]; cursor: number }>> = {};
        (["prof", "friend", "brief", "formal"] as Tone[]).forEach(tone => {
          const val = msg[TONE_TO_FIELD[tone]] as string | null;
          if (val) initialHistory[tone] = { drafts: [val], cursor: 0 };
        });
        setDraftHistory(initialHistory);

        if (msg.matchedTemplate) {
          setActiveTab("template");
          setEditedReply(msg.matchedTemplate.content);
        } else {
          setActiveTab("prof");
          setEditedReply(msg.aiReplyProf || "");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [msgId]);

  /* ── Switch to a tone tab ── */
  const handleToneSwitch = async (tone: Tone) => {
    setActiveTab(tone);

    // Already have history for this tone — show current cursor position
    if (draftHistory[tone]) {
      const { drafts, cursor } = draftHistory[tone]!;
      setEditedReply(drafts[cursor]);
      return;
    }

    // Already in DB but not yet loaded into history
    if (message) {
      const existing = message[TONE_TO_FIELD[tone]] as string | null;
      if (existing) {
        pushDraft(tone, existing);
        setEditedReply(existing);
        return;
      }
    }

    // Generate on-demand
    setLoadingTone(tone);
    try {
      const data = await apiFetch(`/api/messages/${msgId}/tone/${tone}`);
      const generated: string = data.data.draft;
      pushDraft(tone, generated);
      setEditedReply(generated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingTone(null);
    }
  };

  /* ── Switch to template tab ── */
  const handleTemplateTab = () => {
    if (!message?.matchedTemplate) return;
    setActiveTab("template");
    setEditedReply(message.matchedTemplate.content);
  };

  /* ── Regenerate ── */
  const handleRegenerate = async () => {
    if (activeTab === "template") return;
    const tone = activeTab as Tone;
    setRegenerating(true);
    try {
      const data = await apiFetch(`/api/messages/${msgId}/regenerate`, {
        method: "POST",
        body: JSON.stringify({ tone }),
      });
      const fresh: string = data.data.draft;
      // Push to history stack; cursor advances to new end
      pushDraft(tone, fresh);
      setEditedReply(fresh);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

  /* ── Send ── */
  const handleSend = async () => {
    if (!editedReply.trim()) return;
    setSending(true);
    try {
      if (activeTab === "template" && message?.matchedTemplate) {
        await apiFetch(`/api/templates/${message.matchedTemplate.id}/use`, {
          method: "POST",
        });
      }
      await apiFetch(`/api/messages/${msgId}/reply`, {
        method: "PATCH",
        body: JSON.stringify({
          replyText: editedReply,
          tone: activeTab === "template" ? "template" : activeTab,
        }),
      });
      setSent(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  /* ── Archive ── */
  const handleArchive = async () => {
  try {
    await apiFetch(`/api/messages/${msgId}/archive`, { method: "PATCH" });
    await Promise.all([
      mutate("/api/messages"),
      mutate("/api/messages?isArchived=true"),
    ]);
    setArchived(true);
    setTimeout(() => router.push("/dashboard"), 800);
  } catch (err) {
    setError((err as Error).message);
  }
};

  /* ── Loading / error / success states ── */
  if (loading) {
    return (
      <div className={styles.centerState}>
        <div className={styles.pageSpinner} />
        <p>Loading message...</p>
      </div>
    );
  }

  if (error && !message) {
    return (
      <div className={styles.centerState}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.archiveBtn} onClick={() => router.push("/dashboard")}>
          Back to inbox
        </button>
      </div>
    );
  }

  if (!message) return null;

  if (sent || archived) {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={sent ? "var(--accent2)" : "var(--muted2)"} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className={styles.successText}>
          {sent ? "Reply sent!" : "Message archived"}
        </p>
      </div>
    );
  }

  const tag           = TAG_STYLES[message.category.toLowerCase()] ?? TAG_STYLES.faq;
  const formattedDate = new Date(message.receivedAt).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
  const isTemplateTab = activeTab === "template";

  // History info for current tone tab
  const currentToneHistory = !isTemplateTab ? draftHistory[activeTab as Tone] : null;
  const historyTotal  = currentToneHistory?.drafts.length ?? 0;
  const historyCursor = currentToneHistory?.cursor ?? 0;
  const canGoBack     = !isTemplateTab && historyTotal > 1 && historyCursor > 0;
  const canGoForward  = !isTemplateTab && historyTotal > 1 && historyCursor < historyTotal - 1;

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <Link href="/dashboard" className={styles.backBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to inbox
        </Link>
        <div className={styles.topActions}>
          {message.isReplied && (
            <span className={styles.repliedBadge}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Replied
            </span>
          )}
          <button className={styles.archiveBtn} onClick={handleArchive}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            Archive
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className={styles.columns}>

        {/* LEFT — original message */}
        <div className={styles.left}>
          <div className={styles.messageCard}>
            <div className={styles.msgHeader}>
              <div className={styles.senderRow}>
                <div className={styles.avatar}>
                  {message.fromName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.senderInfo}>
                  <span className={styles.senderName}>{message.fromName}</span>
                  <span className={styles.senderEmail}>{message.fromEmail}</span>
                </div>
                <div className={styles.msgMeta}>
                  <span className={styles.categoryTag}
                    style={{ background: tag.bg, color: tag.color }}>
                    {message.category}
                  </span>
                  <span className={styles.msgTime}>{formattedDate}</span>
                </div>
              </div>
              <h2 className={styles.subject}>{message.subject}</h2>
              {message.priority <= 3 && (
                <div className={styles.urgentBanner}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Priority {message.priority} — needs fast reply
                </div>
              )}
            </div>
            <div className={styles.msgBody}>
              <pre className={styles.msgText}>
  {message.body
    .split("\n")
    .map((line, i) => (
      <span
        key={i}
        style={{
          display: "block",
          color: line.startsWith(">")
            ? "var(--muted)"
            : "var(--muted2)",
          fontSize: line.startsWith(">")
            ? "0.8rem"
            : undefined,
          opacity: line.startsWith(">") ? 0.6 : 1,
        }}
      >
        {line || "\u00A0"}
      </span>
    ))}
</pre>
            </div>
          </div>
        </div>

        {/* RIGHT — reply panel */}
        <div className={styles.right}>
          <div className={styles.replyCard}>

            {/* ── Tab bar ── */}
            <div className={styles.toneBar}>
              {message.matchedTemplate && (
                <div className={styles.templateTabWrap}>
                  <button
                    className={`${styles.toneTab} ${styles.templateTab} ${isTemplateTab ? styles.toneTabActive : ""}`}
                    onClick={handleTemplateTab}
                    title={`Matched by: ${message.matchedTemplate.trigger}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Template
                    <span className={styles.templateDot} />
                  </button>
                  <span className={styles.tabDivider} />
                </div>
              )}

              <span className={styles.toneBarLabel}>AI tone</span>
              <div className={styles.toneTabs}>
                {(Object.keys(TONE_LABELS) as Tone[]).map((tone) => {
                  const hist = draftHistory[tone];
                  return (
                    <button
                      key={tone}
                      className={`${styles.toneTab} ${activeTab === tone ? styles.toneTabActive : ""}`}
                      onClick={() => handleToneSwitch(tone)}
                      disabled={loadingTone !== null}
                    >
                      {loadingTone === tone
                        ? <span className={styles.toneSpinner} />
                        : TONE_LABELS[tone]
                      }
                      {/* Dot if we have drafts for this tone but it's not active */}
                      {hist && activeTab !== tone && (
                        <span className={styles.toneDot} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Template banner ── */}
            {isTemplateTab && message.matchedTemplate && (
              <div className={styles.templateBanner}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Template matched by category <strong>{message.matchedTemplate.category}</strong>
                {message.matchedTemplate.trigger && (
                  <> · keyword <strong>{message.matchedTemplate.trigger}</strong></>
                )}
                <span className={styles.templateBannerNote}>— you can still edit before sending</span>
              </div>
            )}

            {/* ── Draft history navigator (shown only for AI tone tabs with >1 draft) ── */}
            {!isTemplateTab && historyTotal > 1 && (
              <div className={styles.historyNav}>
                <button
                  className={styles.historyBtn}
                  onClick={() => navigateHistory(activeTab as Tone, "back")}
                  disabled={!canGoBack}
                  title="Previous draft"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>

                <span className={styles.historyLabel}>
                  Draft {historyCursor + 1} of {historyTotal}
                  {historyCursor === 0 && <span className={styles.historyBadge}>original</span>}
                  {historyCursor === historyTotal - 1 && historyTotal > 1 && (
                    <span className={styles.historyBadge} style={{ background: "rgba(0,229,176,0.15)", color: "#00e5b0" }}>
                      latest
                    </span>
                  )}
                </span>

                <button
                  className={styles.historyBtn}
                  onClick={() => navigateHistory(activeTab as Tone, "forward")}
                  disabled={!canGoForward}
                  title="Next draft"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>

                <span className={styles.historyHint}>
                  Use arrows to browse all {historyTotal} drafts
                </span>
              </div>
            )}

            {/* Textarea */}
            <div className={styles.replyArea}>
              {loadingTone ? (
                <div className={styles.draftLoading}>
                  <div className={styles.draftLoadingDots}>
                    <span /><span /><span />
                  </div>
                  <p>Generating {TONE_LABELS[loadingTone as Tone]?.toLowerCase()} draft...</p>
                </div>
              ) : (
                <textarea
                  className={styles.replyTextarea}
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  placeholder="Draft will appear here..."
                  rows={12}
                  disabled={message.isReplied}
                />
              )}
            </div>

            {/* Actions */}
            <div className={styles.replyActions}>
              {!isTemplateTab && (
                <button className={styles.regenBtn} onClick={handleRegenerate}
                  disabled={regenerating || !!loadingTone || message.isReplied}>
                  {regenerating
                    ? <span className={styles.toneSpinner} />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                  }
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}

              <button className={styles.sendBtn} onClick={handleSend}
                disabled={sending || !editedReply.trim() || !!loadingTone || message.isReplied}>
                {sending ? (
                  <><span className={styles.toneSpinner} />Sending...</>
                ) : message.isReplied ? (
                  "Already replied"
                ) : (
                  <>Send reply
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className={styles.charCount}>{editedReply.length} characters</div>
          </div>
        </div>
      </div>
    </div>
  );
}