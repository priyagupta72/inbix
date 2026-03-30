"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/HowItWorks.tsx
   6-step "how it works" section on dark bg
───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    num:   "01",
    title: "Message arrives",
    desc:  "Customer sends email to Gmail or a DM on Instagram / Facebook.",
  },
  {
    num:   "02",
    title: "Webhook triggers n8n",
    desc:  "Gmail / Meta API fires a webhook — the automation pipeline kicks off instantly.",
  },
  {
    num:   "03",
    title: "Queued & stored",
    desc:  "n8n reads the message, saves to PostgreSQL, and adds it to the Redis Bull queue.",
  },
  {
    num:   "04",
    title: "AI categorizes",
    desc:  "GPT-4o reads and assigns a category — urgent, pricing, booking, FAQ, complaint, or spam.",
  },
  {
    num:   "05",
    title: "Draft generated",
    desc:  "GPT-4o writes a reply in your chosen tone and stores it against the message in the DB.",
  },
  {
    num:   "06",
    title: "You review & send",
    desc:  "Dashboard updates in real-time. Edit the draft, switch tone, and hit send — one click.",
  },
] as const;

export default function HowItWorks() {
  const headerRef = useRef<HTMLDivElement>(null);
  const stepRefs  = useRef<(HTMLDivElement | null)[]>([]);

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
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how" className={styles.howSection}>
      <div className={styles.howInner}>
        {/* Header */}
        <div className="fade-up" ref={headerRef}>
          <span className="section-tag">How it works</span>
          <h2 className="section-title">
            From inbox to sent<br />in 9 steps.
          </h2>
          <p className="section-sub">
            Fully automated from message arrival to your one-click send.
          </p>
        </div>

        {/* Steps grid */}
        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`${styles.stepCard} fade-up`}
              ref={(el) => { stepRefs.current[i] = el; }}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className={styles.stepNum}>{s.num}</div>
              <h4 className={styles.stepTitle}>{s.title}</h4>
              <p  className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}