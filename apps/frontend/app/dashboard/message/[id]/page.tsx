// "use client";

// /* app/dashboard/message/[id]/page.tsx */

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import styles from "./message.module.css";

// /* ── Types ── */
// type Tone = "prof" | "friend" | "brief" | "formal";

// const TONE_LABELS: Record<Tone, { label: string; desc: string }> = {
//   prof:   { label: "Professional", desc: "Polished, complete sentences" },
//   friend: { label: "Friendly",     desc: "Warm and conversational" },
//   brief:  { label: "Brief",        desc: "2 sentences max" },
//   formal: { label: "Formal",       desc: "Dear / Regards format" },
// };

// const TAG_STYLES: Record<string, { bg: string; color: string }> = {
//   Urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
//   Pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
//   Booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
//   FAQ:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
//   Complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
//   Spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
// };

// /* ── Mock data — replace with real API fetch ── */
// const MOCK_MESSAGE = {
//   id: "1",
//   fromName: "Sarah Johnson",
//   fromEmail: "sarah.johnson@example.com",
//   subject: "Order hasn't arrived — urgent help needed",
//   body: `Hi there,

// I placed an order two weeks ago (order #4821) and it still hasn't arrived. I've checked the tracking and it's been stuck on "In Transit" for 10 days now.

// This is really frustrating as it was a birthday gift and the birthday has already passed. I'd like either an immediate update on where my package is, or a full refund processed today.

// Please get back to me as soon as possible.

// Best,
// Sarah`,
//   category: "Urgent",
//   priority: 2,
//   receivedAt: "2025-01-14T10:32:00Z",
//   isReplied: false,
//   isRead: true,
//   drafts: {
//     prof: "Dear Sarah, thank you for reaching out. I sincerely apologize for the delay with order #4821. I've escalated this to our fulfillment team and will have a full update for you within the hour. If we cannot confirm delivery by end of day, I'll process an immediate refund. I'm sorry this affected such an important occasion.",
//     friend: "",   // generated on-demand
//     brief: "",
//     formal: "",
//   },
// };

// export default function MessageDetailPage() {
//   const params   = useParams();
//   const router   = useRouter();
//   const msgId    = params.id as string;

//   /* ── State ── */
//   const [message]         = useState(MOCK_MESSAGE);
//   const [activeTone, setActiveTone]     = useState<Tone>("prof");
//   const [drafts, setDrafts]             = useState(MOCK_MESSAGE.drafts);
//   const [editedReply, setEditedReply]   = useState(MOCK_MESSAGE.drafts.prof);
//   const [loadingTone, setLoadingTone]   = useState<Tone | null>(null);
//   const [regenerating, setRegenerating] = useState(false);
//   const [sending, setSending]           = useState(false);
//   const [sent, setSent]                 = useState(false);
//   const [archived, setArchived]         = useState(false);

//   /* ── Tone switch ── */
//   const handleToneSwitch = async (tone: Tone) => {
//     setActiveTone(tone);

//     // If draft already cached — just switch
//     if (drafts[tone]) {
//       setEditedReply(drafts[tone]);
//       return;
//     }

//     // Generate on demand
//     setLoadingTone(tone);
//     try {
//       // 🔌 WIRE UP: replace with real API call
//       // const res = await fetch(`/api/messages/${msgId}/tone/${tone}`)
//       // const data = await res.json()
//       // const generated = data.data.draft

//       // Mock delay
//       await new Promise((r) => setTimeout(r, 1200));
//       const generated = `[${TONE_LABELS[tone].label} draft for "${message.subject}" — wire up real API]`;

//       setDrafts((prev) => ({ ...prev, [tone]: generated }));
//       setEditedReply(generated);
//     } finally {
//       setLoadingTone(null);
//     }
//   };

//   /* ── Regenerate ── */
//   const handleRegenerate = async () => {
//     setRegenerating(true);
//     try {
//       // 🔌 WIRE UP:
//       // const res = await fetch(`/api/messages/${msgId}/regenerate`, {
//       //   method: "POST",
//       //   headers: { "Content-Type": "application/json" },
//       //   body: JSON.stringify({ tone: activeTone }),
//       // })
//       // const data = await res.json()
//       // const fresh = data.data.draft

//       await new Promise((r) => setTimeout(r, 1000));
//       const fresh = `[Regenerated ${TONE_LABELS[activeTone].label} draft — wire up real API]`;

//       setDrafts((prev) => ({ ...prev, [activeTone]: fresh }));
//       setEditedReply(fresh);
//     } finally {
//       setRegenerating(false);
//     }
//   };

//   /* ── Send ── */
//   const handleSend = async () => {
//     if (!editedReply.trim()) return;
//     setSending(true);
//     try {
//       // 🔌 WIRE UP:
//       // await fetch(`/api/messages/${msgId}/reply`, {
//       //   method: "PATCH",
//       //   headers: { "Content-Type": "application/json" },
//       //   body: JSON.stringify({ replyText: editedReply, tone: activeTone }),
//       // })

//       await new Promise((r) => setTimeout(r, 900));
//       setSent(true);
//       setTimeout(() => router.push("/dashboard"), 1500);
//     } finally {
//       setSending(false);
//     }
//   };

//   /* ── Archive ── */
//   const handleArchive = async () => {
//     // 🔌 WIRE UP:
//     // await fetch(`/api/messages/${msgId}/archive`, { method: "PATCH" })
//     setArchived(true);
//     setTimeout(() => router.push("/dashboard"), 800);
//   };

//   /* ── Helpers ── */
//   const tag = TAG_STYLES[message.category] ?? TAG_STYLES.FAQ;
//   const formattedDate = new Date(message.receivedAt).toLocaleDateString("en-GB", {
//     weekday: "short", day: "numeric", month: "short",
//     hour: "2-digit", minute: "2-digit",
//   });

//   if (sent || archived) {
//     return (
//       <div className={styles.successWrap}>
//         <div className={styles.successIcon}>
//           <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
//             stroke={sent ? "var(--accent2)" : "var(--muted2)"} strokeWidth="2.5">
//             <polyline points="20 6 9 17 4 12"/>
//           </svg>
//         </div>
//         <p className={styles.successText}>
//           {sent ? "Reply sent!" : "Message archived"}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.page}>

//       {/* ── Top bar ── */}
//       <div className={styles.topBar}>
//         <Link href="/dashboard" className={styles.backBtn}>
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//             stroke="currentColor" strokeWidth="2.5">
//             <path d="M19 12H5M12 5l-7 7 7 7"/>
//           </svg>
//           Back to inbox
//         </Link>
//         <div className={styles.topActions}>
//           <button className={styles.archiveBtn} onClick={handleArchive}>
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2">
//               <polyline points="21 8 21 21 3 21 3 8"/>
//               <rect x="1" y="3" width="22" height="5"/>
//               <line x1="10" y1="12" x2="14" y2="12"/>
//             </svg>
//             Archive
//           </button>
//         </div>
//       </div>

//       {/* ── Two-column layout ── */}
//       <div className={styles.columns}>

//         {/* ── LEFT: Original message ── */}
//         <div className={styles.left}>
//           <div className={styles.messageCard}>

//             {/* Header */}
//             <div className={styles.msgHeader}>
//               <div className={styles.senderRow}>
//                 <div className={styles.avatar}>
//                   {message.fromName.charAt(0)}
//                 </div>
//                 <div className={styles.senderInfo}>
//                   <span className={styles.senderName}>{message.fromName}</span>
//                   <span className={styles.senderEmail}>{message.fromEmail}</span>
//                 </div>
//                 <div className={styles.msgMeta}>
//                   <span
//                     className={styles.categoryTag}
//                     style={{ background: tag.bg, color: tag.color }}
//                   >
//                     {message.category}
//                   </span>
//                   <span className={styles.msgTime}>{formattedDate}</span>
//                 </div>
//               </div>
//               <h2 className={styles.subject}>{message.subject}</h2>
//               {message.priority <= 3 && (
//                 <div className={styles.urgentBanner}>
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
//                     stroke="currentColor" strokeWidth="2.5">
//                     <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
//                     <line x1="12" y1="9" x2="12" y2="13"/>
//                     <line x1="12" y1="17" x2="12.01" y2="17"/>
//                   </svg>
//                   Priority {message.priority} — needs fast reply
//                 </div>
//               )}
//             </div>

//             {/* Body */}
//             <div className={styles.msgBody}>
//               <pre className={styles.msgText}>{message.body}</pre>
//             </div>
//           </div>
//         </div>

//         {/* ── RIGHT: AI reply panel ── */}
//         <div className={styles.right}>
//           <div className={styles.replyCard}>

//             {/* Tone tabs */}
//             <div className={styles.toneBar}>
//               <span className={styles.toneBarLabel}>Tone</span>
//               <div className={styles.toneTabs}>
//                 {(Object.keys(TONE_LABELS) as Tone[]).map((tone) => (
//                   <button
//                     key={tone}
//                     className={`${styles.toneTab} ${activeTone === tone ? styles.toneTabActive : ""}`}
//                     onClick={() => handleToneSwitch(tone)}
//                     disabled={loadingTone !== null}
//                   >
//                     {loadingTone === tone ? (
//                       <span className={styles.toneSpinner} />
//                     ) : (
//                       TONE_LABELS[tone].label
//                     )}
//                     {drafts[tone] && activeTone !== tone && (
//                       <span className={styles.toneDot} />
//                     )}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Reply textarea */}
//             <div className={styles.replyArea}>
//               {loadingTone ? (
//                 <div className={styles.draftLoading}>
//                   <div className={styles.draftLoadingDots}>
//                     <span /><span /><span />
//                   </div>
//                   <p>Generating {TONE_LABELS[loadingTone].label.toLowerCase()} draft...</p>
//                 </div>
//               ) : (
//                 <textarea
//                   className={styles.replyTextarea}
//                   value={editedReply}
//                   onChange={(e) => setEditedReply(e.target.value)}
//                   placeholder="AI draft will appear here..."
//                   rows={12}
//                 />
//               )}
//             </div>

//             {/* Reply actions */}
//             <div className={styles.replyActions}>
//               <button
//                 className={styles.regenBtn}
//                 onClick={handleRegenerate}
//                 disabled={regenerating || !!loadingTone}
//               >
//                 {regenerating ? (
//                   <span className={styles.toneSpinner} />
//                 ) : (
//                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
//                     stroke="currentColor" strokeWidth="2.5">
//                     <polyline points="23 4 23 10 17 10"/>
//                     <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
//                   </svg>
//                 )}
//                 {regenerating ? "Regenerating..." : "Regenerate"}
//               </button>

//               <button
//                 className={styles.sendBtn}
//                 onClick={handleSend}
//                 disabled={sending || !editedReply.trim() || !!loadingTone}
//               >
//                 {sending ? (
//                   <>
//                     <span className={styles.toneSpinner} />
//                     Sending...
//                   </>
//                 ) : (
//                   <>
//                     Send reply
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                       stroke="currentColor" strokeWidth="2.5">
//                       <line x1="22" y1="2" x2="11" y2="13"/>
//                       <polygon points="22 2 15 22 11 13 2 9 22 2"/>
//                     </svg>
//                   </>
//                 )}
//               </button>
//             </div>

//             {/* Character count */}
//             <div className={styles.charCount}>
//               {editedReply.length} characters
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./message.module.css";

/* ── Types ── */
type Tone = "prof" | "friend" | "brief" | "formal";

interface Message {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  category: string;
  priority: number;
  receivedAt: string;
  isReplied: boolean;
  isRead: boolean;
  aiReplyProf: string | null;
  aiReplyFriend: string | null;
  aiReplyBrief: string | null;
  aiReplyFormal: string | null;
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
  Urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  urgent:    { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  pricing:   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  Booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
  booking:   { bg: "rgba(0,229,176,0.15)",   color: "#00e5b0" },
  FAQ:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
  faq:       { bg: "rgba(79,124,255,0.15)",  color: "#93b4ff" },
  Complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  complaint: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  Spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
  spam:      { bg: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const msgId  = params.id as string;

  /* ── State ── */
  const [message, setMessage]           = useState<Message | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeTone, setActiveTone]     = useState<Tone>("prof");
  const [editedReply, setEditedReply]   = useState("");
  const [cachedTones, setCachedTones]   = useState<Partial<Record<Tone, string>>>({});
  const [loadingTone, setLoadingTone]   = useState<Tone | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const [archived, setArchived]         = useState(false);

  /* ── Fetch message on mount ── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/messages/${msgId}`);
        const msg: Message = data.data;
        setMessage(msg);

        // Seed cached tones from whatever the DB already has
        const initial: Partial<Record<Tone, string>> = {};
        if (msg.aiReplyProf)   initial.prof   = msg.aiReplyProf;
        if (msg.aiReplyFriend) initial.friend = msg.aiReplyFriend;
        if (msg.aiReplyBrief)  initial.brief  = msg.aiReplyBrief;
        if (msg.aiReplyFormal) initial.formal = msg.aiReplyFormal;
        setCachedTones(initial);

        // Default textarea to prof draft
        setEditedReply(msg.aiReplyProf || "");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [msgId]);

  /* ── Tone switch ── */
  const handleToneSwitch = async (tone: Tone) => {
    setActiveTone(tone);

    // Already cached locally — just switch
    if (cachedTones[tone]) {
      setEditedReply(cachedTones[tone]!);
      return;
    }

    // Check if it came from the DB already
    if (message) {
      const field = TONE_TO_FIELD[tone];
      const existing = message[field] as string | null;
      if (existing) {
        setCachedTones(prev => ({ ...prev, [tone]: existing }));
        setEditedReply(existing);
        return;
      }
    }

    // Generate on-demand from backend
    setLoadingTone(tone);
    try {
      const data = await apiFetch(`/api/messages/${msgId}/tone/${tone}`);
      const generated: string = data.data.draft;
      setCachedTones(prev => ({ ...prev, [tone]: generated }));
      setEditedReply(generated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingTone(null);
    }
  };

  /* ── Regenerate ── */
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await apiFetch(`/api/messages/${msgId}/regenerate`, {
        method: "POST",
        body: JSON.stringify({ tone: activeTone }),
      });
      const fresh: string = data.data.draft;
      setCachedTones(prev => ({ ...prev, [activeTone]: fresh }));
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
      await apiFetch(`/api/messages/${msgId}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ replyText: editedReply, tone: activeTone }),
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

  if (error) {
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

  const tag = TAG_STYLES[message.category] ?? TAG_STYLES.faq;
  const formattedDate = new Date(message.receivedAt).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

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
              <pre className={styles.msgText}>{message.body}</pre>
            </div>
          </div>
        </div>

        {/* RIGHT — reply panel */}
        <div className={styles.right}>
          <div className={styles.replyCard}>

            {/* Tone tabs */}
            <div className={styles.toneBar}>
              <span className={styles.toneBarLabel}>Tone</span>
              <div className={styles.toneTabs}>
                {(Object.keys(TONE_LABELS) as Tone[]).map((tone) => (
                  <button
                    key={tone}
                    className={`${styles.toneTab} ${activeTone === tone ? styles.toneTabActive : ""}`}
                    onClick={() => handleToneSwitch(tone)}
                    disabled={loadingTone !== null}
                  >
                    {loadingTone === tone
                      ? <span className={styles.toneSpinner} />
                      : TONE_LABELS[tone]
                    }
                    {cachedTones[tone] && activeTone !== tone && (
                      <span className={styles.toneDot} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className={styles.replyArea}>
              {loadingTone ? (
                <div className={styles.draftLoading}>
                  <div className={styles.draftLoadingDots}>
                    <span /><span /><span />
                  </div>
                  <p>Generating {TONE_LABELS[loadingTone].toLowerCase()} draft...</p>
                </div>
              ) : (
                <textarea
                  className={styles.replyTextarea}
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  placeholder="AI draft will appear here..."
                  rows={12}
                  disabled={message.isReplied}
                />
              )}
            </div>

            {/* Actions */}
            <div className={styles.replyActions}>
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