"use client";

/* ─────────────────────────────────────────────────────────────
   app/forgot-password/page.tsx
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./forgot-password.module.css";

type Status = "idle" | "loading" | "sent";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatus("sent");
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Try again.");
      setStatus("idle");
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.glowTop}    aria-hidden="true" />
      <div className={styles.glowBottom} aria-hidden="true" />
      <div className={styles.grid}       aria-hidden="true" />

      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
  <defs>
    <linearGradient id="inbix-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#4f7cff" />
      <stop offset="100%" stopColor="#00e5b0" />
    </linearGradient>
  </defs>
  <rect width="34" height="34" rx="8" fill="url(#inbix-g)" />
  <path d="M17 6 L12 17 L17 17 L13 28 L25 17 L20 17 Z" fill="#07080f" />
</svg>
        </span>
        inbix
      </Link>

      <div className={styles.card}>
        <div className={styles.cardGlow} aria-hidden="true" />

        {status === "sent" ? (
          /* ── Success state ── */
          <div className={styles.stateWrap}>
            <div className={styles.iconRing}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#00e5b0" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.sub}>
              We sent a password reset link to <strong>{email}</strong>.
              Click the link to set a new password.
            </p>
            <p className={styles.hint}>Didn't get it? Check your spam folder.</p>
            <Link href="/signin" className={styles.backLink}>← Back to sign in</Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Forgot password?</h1>
              <p className={styles.sub}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="15" height="15"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="email" type="email" className={styles.input}
                    placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}
                disabled={status === "loading"}>
                {status === "loading" ? <span className={styles.spinner} /> : (
                  <>Send reset link
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className={styles.switchText}>
              Remember it?{" "}
              <Link href="/signin" className={styles.switchLink}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}