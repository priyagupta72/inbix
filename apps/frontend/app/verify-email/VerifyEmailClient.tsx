"use client";

/* ─────────────────────────────────────────────────────────────
   app/verify-email/page.tsx
   Handles email verification via ?token= URL param.
   - Auto-calls the API on mount
   - Shows loading → success or error state
   - Lets user resend verification email
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import styles from "./verify-email.module.css";
import { saveAuth } from "@/lib/auth";

type Status = "loading" | "success" | "error" | "resent";

export default function VerifyEmailClient() { 
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [status,  setStatus]  = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [email,   setEmail]   = useState("");
  const [resending, setResending] = useState(false);

  /* ── Auto-verify on mount ── */
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    apiFetch(`/api/auth/verify-email?token=${token}`, {
  method: "GET",
})
//       .then((data) => {
//   setStatus("success");
//   if (data?.data?.token) {
//     saveAuth(data.data.token, data.data.refreshToken, data.data.user);
//   }
//   setTimeout(() => router.push("/dashboard"), 1500);
// })

.then((data) => {
  setStatus("success");
  // ← was data?.data?.token (wrong), now using correct structure
  if (data?.data?.tokens?.accessToken) {
    saveAuth(
      data.data.tokens.accessToken,
      data.data.tokens.refreshToken,
      data.data.user
    );
  }
  setTimeout(() => router.push("/dashboard"), 1500);
})

      .catch((err: Error) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token, router]);

  /* ── Resend verification email ── */
  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatus("resent");
    } catch (err) {
      setMessage((err as Error).message || "Could not resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.glowTop}    aria-hidden="true" />
      <div className={styles.glowBottom} aria-hidden="true" />
      <div className={styles.grid}       aria-hidden="true" />

      {/* Logo */}
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

        {/* ── LOADING ── */}
        {status === "loading" && (
          <div className={styles.stateWrap}>
            <div className={styles.iconRing}>
              <span className={styles.spinner} />
            </div>
            <h1 className={styles.title}>Verifying your email…</h1>
            <p className={styles.sub}>Hang tight, this only takes a second.</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && (
          <div className={styles.stateWrap}>
            <div className={`${styles.iconRing} ${styles.iconRingSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#00e5b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className={styles.title}>Email verified!</h1>
            <p className={styles.sub}>
              Your account is active. Redirecting you to the dashboard…
            </p>
            <Link href="/dashboard" className={styles.btn}>
              Go to dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div className={styles.stateWrap}>
            <div className={`${styles.iconRing} ${styles.iconRingError}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className={styles.title}>Verification failed</h1>
            <p className={styles.sub}>{message}</p>

            {/* Resend form */}
            <div className={styles.resendBox}>
              <p className={styles.resendLabel}>Need a new link? Enter your email:</p>
              <div className={styles.resendRow}>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="14" height="14"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResend()}
                  />
                </div>
                <button
                  className={styles.resendBtn}
                  onClick={handleResend}
                  disabled={resending || !email.trim()}
                >
                  {resending ? <span className={styles.spinnerSm} /> : "Resend"}
                </button>
              </div>
            </div>

            <Link href="/signin" className={styles.backLink}>
              ← Back to sign in
            </Link>
          </div>
        )}

        {/* ── RESENT ── */}
        {status === "resent" && (
          <div className={styles.stateWrap}>
            <div className={`${styles.iconRing} ${styles.iconRingSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#00e5b0" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className={styles.title}>Email sent!</h1>
            <p className={styles.sub}>
              We sent a new link to <strong>{email}</strong>.
              Check your inbox and click the link to verify.
            </p>
            <Link href="/signin" className={styles.backLink}>
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}