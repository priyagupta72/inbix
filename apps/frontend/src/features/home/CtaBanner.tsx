"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/CtaBanner.tsx
   Full-width bottom call-to-action banner with glow background
───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { IconArrowRight } from "./icons/Icons";
import styles from "./CtaBanner.module.css";

export default function CtaBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

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
    if (bannerRef.current) observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.ctaOuter}>
      <div
        className={`${styles.ctaBanner} fade-up`}
        ref={bannerRef}
      >
        {/* Background glow */}
        <div className={styles.ctaGlow} aria-hidden="true" />

        <h2 className={styles.ctaH2}>
          Stop drowning in messages.<br />
          Start replying smarter.
        </h2>

        <p className={styles.ctaP}>
          Set up in under 10 minutes. No credit card required for the free trial.
        </p>

        <Link href="/signup" className="btn btn--hero btn--hero-primary">
          Get started for free <IconArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}