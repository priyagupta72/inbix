"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/Features.tsx
   6-card features grid with hover highlight + scroll animation
───────────────────────────────────────────────────────────── */

import { useEffect, useRef, type ReactNode } from "react";
import {
  IconBrain,
  IconPen,
  IconZap,
  IconLink,
  IconChart,
  IconTemplate,
} from "./icons/Icons";
import styles from "./Features.module.css";

interface Feature {
  icon:      ReactNode;
  iconBg:    string;
  iconColor: string;
  title:     string;
  desc:      string;
}

// const FEATURES: Feature[] = [
//   {
//     icon:      <IconBrain />,
//     iconBg:    "rgba(79,124,255,0.12)",
//     iconColor: "#4f7cff",
//     title:     "Smart Categorization",
//     desc:      "Every message is automatically sorted, urgent, pricing, booking, FAQ, complaint, or spam, so you know exactly what needs attention first.",
//   },
//   {
//     icon:      <IconPen />,
//     iconBg:    "rgba(0,229,176,0.1)",
//     iconColor: "#00e5b0",
//     title:     "AI Draft in Your Tone",
//     desc:      "GPT-4o generates replies that sound like you. Switch between Professional, Friendly, Brief, or Formal tones on demand — cached for speed.",
//   },
//   {
//     icon:      <IconZap />,
//     iconBg:    "rgba(251,191,36,0.1)",
//     iconColor: "#fbbf24",
//     title:     "Bulk Processing",
//     desc:      "30 messages processed simultaneously via Bull queue. 100 messages done in about 15 seconds. Priority queue keeps urgent messages up front.",
//   },
//   {
//     icon:      <IconLink />,
//     iconBg:    "rgba(167,139,250,0.1)",
//     iconColor: "#a78bfa",
//     title:     "Unified Inbox",
//     desc:      "Gmail, Instagram DMs, and Facebook messages all in one place. One review flow, one send action — no platform-switching.",
//   },
//   {
//     icon:      <IconChart />,
//     iconBg:    "rgba(248,113,113,0.1)",
//     iconColor: "#f87171",
//     title:     "Real-Time Analytics",
//     desc:      "Track reply rate, average response time, message volume by platform, and time saved — updated live as you work.",
//   },
//   {
//     icon:      <IconTemplate />,
//     iconBg:    "rgba(45,212,191,0.1)",
//     iconColor: "#2dd4bf",
//     title:     "Template Library",
//     desc:      "Save your best replies as templates. FAQ messages with 90%+ confidence get auto-sent without you lifting a finger.",
//   },
// ];


const FEATURES: Feature[] = [
  {
    icon:      <IconBrain />,
    iconBg:    "rgba(79,124,255,0.12)",
    iconColor: "#4f7cff",
    title:     "Smart Categorization",
    desc:      "Every message is automatically sorted, urgent, pricing, booking, FAQ, complaint, or spam, so you know exactly what needs attention first.",
  },
  {
    icon:      <IconPen />,
    iconBg:    "rgba(0,229,176,0.1)",
    iconColor: "#00e5b0",
    title:     "AI Draft in Your Tone",
    desc:      "AI generates replies that sound like you. Switch between Professional, Friendly, Brief, or Formal tones on demand, regenerate as many times as you want.",
  },
  {
    icon:      <IconZap />,
    iconBg:    "rgba(251,191,36,0.1)",
    iconColor: "#fbbf24",
    title:     "Bulk Replies",
    desc:      "Select multiple messages and send AI-generated replies to all of them in one click, saving hours of manual typing.",
  },
  {
    icon:      <IconLink />,
    iconBg:    "rgba(167,139,250,0.1)",
    iconColor: "#a78bfa",
    title:     "Unified Inbox",
    desc:      "Gmail connected now. Instagram DMs and Facebook messages coming soon, one inbox to rule them all.",
  },
  {
    icon:      <IconChart />,
    iconBg:    "rgba(248,113,113,0.1)",
    iconColor: "#f87171",
    title:     "Real-Time Analytics",
    desc:      "Track reply rate, average response time, message volume by category, and time saved, updated as you work.",
  },
  {
    icon:      <IconTemplate />,
    iconBg:    "rgba(45,212,191,0.1)",
    iconColor: "#2dd4bf",
    title:     "Template Library",
    desc:      "Save your best replies as templates. inbix auto-matches them to incoming messages by category, just review and send.",
  },
]

export default function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    if (gridRef.current)   observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className={styles.featuresSection}>
      <div className="section-wrapper">
        {/* Header */}
        <div className="fade-up" ref={headerRef}>
          <span className="section-tag">Features</span>
          <h2 className="section-title">
            Everything your inbox needs.<br />
            Nothing it doesn&apos;t.
          </h2>
          <p className="section-sub">
            Built for freelancers, clinics, coaches and agencies who get
            flooded with messages every day.
          </p>
        </div>

        {/* Grid */}
        <div className={`${styles.featuresGrid} fade-up`} ref={gridRef}>
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={styles.featureCard}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              {/* Top highlight line on hover — CSS only */}
              <div className={styles.featureCardHighlight} aria-hidden="true" />

              {/* Icon */}
              <div
                className={styles.featureIcon}
                style={{ background: f.iconBg, color: f.iconColor }}
              >
                {f.icon}
              </div>

              {/* Text */}
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p  className={styles.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}