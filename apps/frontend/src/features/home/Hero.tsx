"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/Hero.tsx
   Full-viewport hero with badge, headline, CTA buttons,
   and animated dashboard preview mockup
───────────────────────────────────────────────────────────── */

import Link from "next/link";
import {
  IconArrowRight,
  IconMail,
  IconInstagram,
  IconFacebook,
} from "./icons/Icons";
import styles from "./Hero.module.css";

/* ── Preview message data ── */
const PREVIEW_MESSAGES = [
  {
    initials:   "S",
    avatarGrad: "linear-gradient(135deg,#f87171,#fb923c)",
    name:       "Sarah Johnson",
    preview:    "URGENT: My order still hasn't arrived and it's been 2 weeks...",
    tagLabel:   "Urgent",
    tagClass:   styles.tagUrgent,
    delay:      "0.85s",
  },
  {
    initials:   "M",
    avatarGrad: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    name:       "Mike Chen",
    preview:    "Hey, what are your rates for a monthly retainer package?",
    tagLabel:   "Pricing",
    tagClass:   styles.tagPricing,
    delay:      "1.05s",
  },
  {
    initials:   "A",
    avatarGrad: "linear-gradient(135deg,#00e5b0,#0891b2)",
    name:       "Aisha Patel",
    preview:    "I'd love to book a 30-minute discovery call this week!",
    tagLabel:   "Booking",
    tagClass:   styles.tagBooking,
    delay:      "1.25s",
  },
] as const;

/* ── Sidebar nav data ── */
const SIDEBAR_CATEGORIES = [
  { color: "#4f7cff", label: "All Messages", count: "124", active: true  },
  { color: "#f87171", label: "Urgent",                     active: false },
  { color: "#fbbf24", label: "Pricing",                    active: false },
  { color: "#00e5b0", label: "Booking",                    active: false },
  { color: "#a78bfa", label: "FAQ",                        active: false },
] as const;

const SIDEBAR_PLATFORMS = [
  { icon: <IconMail size={13} />,      label: "Gmail"     },
  { icon: <IconInstagram size={13} />, label: "Instagram" },
  { icon: <IconFacebook size={13} />,  label: "Facebook"  },
] as const;

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Background glow orb */}
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroContent}>
        {/* Badge */}
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          AI-powered inbox management · Now in beta
        </div>

        {/* Headline */}
        <h1 className={styles.heroH1}>
          Reply to 100+ messages<br />
          in{" "}
          <span className="text-grad">under 10 minutes</span>
        </h1>

        {/* Subheadline */}
        <p className={styles.heroSub}>
          ReplyEngine reads your Gmail, Instagram &amp; Facebook DMs, categorizes every
          message, drafts AI replies in your tone — and lets you send them all with one click.
        </p>

        {/* CTA buttons */}
        <div className={styles.heroCtas}>
          <Link href="/signup" className="btn btn--hero btn--hero-primary">
            Start for free <IconArrowRight size={16} />
          </Link>
          <a href="#how" className="btn btn--hero btn--hero-outline">
            See how it works
          </a>
        </div>

        {/* ── Dashboard preview mockup ── */}
        <div className={styles.previewWrap}>
          <div className={styles.previewGlow} aria-hidden="true" />

          <div className={styles.previewFrame}>
            {/* Title bar */}
            <div className={styles.previewBar}>
              <span className={`${styles.previewDot} ${styles.dotRed}`}    />
              <span className={`${styles.previewDot} ${styles.dotYellow}`} />
              <span className={`${styles.previewDot} ${styles.dotGreen}`}  />
              <span className={styles.previewUrl}>app.replyengine.io/inbox</span>
            </div>

            {/* Body: sidebar + messages */}
            <div className={styles.previewBody}>
              {/* Sidebar */}
              <aside className={styles.previewSidebar}>
                {SIDEBAR_CATEGORIES.map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.sidebarItem} ${item.active ? styles.sidebarItemActive : ""}`}
                  >
                    <span
                      className={styles.sidebarDot}
                      style={{ background: item.color }}
                    />
                    <span className={styles.sidebarLabel}>{item.label}</span>
                    {"count" in item && item.count && (
                      <span className={styles.sidebarCount}>{item.count}</span>
                    )}
                  </div>
                ))}

                <div className={styles.sidebarDivider}>PLATFORMS</div>

                {SIDEBAR_PLATFORMS.map((p) => (
                  <div key={p.label} className={styles.sidebarItem}>
                    <span className={styles.sidebarPlatformIcon}>{p.icon}</span>
                    <span className={styles.sidebarLabel}>{p.label}</span>
                  </div>
                ))}
              </aside>

              {/* Message list */}
              <div className={styles.previewMain}>
                {PREVIEW_MESSAGES.map((msg) => (
                  <div
                    key={msg.name}
                    className={styles.previewMsg}
                    style={{ animation: `slideIn 0.4s ${msg.delay} ease both` }}
                  >
                    <div
                      className={styles.previewAvatar}
                      style={{ background: msg.avatarGrad }}
                    >
                      {msg.initials}
                    </div>

                    <div className={styles.previewMsgInfo}>
                      <div className={styles.previewMsgName}>{msg.name}</div>
                      <div className={styles.previewMsgPreview}>{msg.preview}</div>
                    </div>

                    <span className={`${styles.tag} ${msg.tagClass}`}>
                      {msg.tagLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}