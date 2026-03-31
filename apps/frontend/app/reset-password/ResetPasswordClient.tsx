"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import styles from "./reset-password.module.css";

type Status = "idle" | "validating" | "invalid" | "loading" | "success";

export default function ResetPasswordClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [status,   setStatus]   = useState<Status>("validating");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#f87171", "#fbbf24", "#00e5b0", "#4f7cff"][strength];

  /* ── Validate token on mount ── */
  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    apiFetch(`/api/auth/reset-password/${token}`, { method: "GET" })
      .then(() => setStatus("idle"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setStatus("loading");
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setStatus("success");
      setTimeout(() => router.push("/signin"), 2500);
    } catch (err) {
      setError((err as Error).message || "Reset failed. Try again.");
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

        {/* Validating */}
        {status === "validating" && (
          <div className={styles.stateWrap}>
            <span className={styles.spinner} />
            <p className={styles.sub}>Validating your reset link…</p>
          </div>
        )}

        {/* Invalid token */}
        {status === "invalid" && (
          <div className={styles.stateWrap}>
            <div className={`${styles.iconRing} ${styles.iconRingError}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className={styles.title}>Link expired</h1>
            <p className={styles.sub}>This reset link is invalid or has expired.</p>
            <Link href="/forgot-password" className={styles.submitBtn}
              style={{ textDecoration: "none", marginTop: 8 }}>
              Request a new link
            </Link>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className={styles.stateWrap}>
            <div className={`${styles.iconRing} ${styles.iconRingSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#00e5b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className={styles.title}>Password updated!</h1>
            <p className={styles.sub}>Redirecting you to sign in…</p>
            <Link href="/signin" className={styles.backLink}>Go to sign in →</Link>
          </div>
        )}

        {/* Form */}
        {(status === "idle" || status === "loading") && (
          <>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Set new password</h1>
              <p className={styles.sub}>Choose a strong password for your account.</p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">New password</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="15" height="15"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input id="password"
                    type={showPass ? "text" : "password"}
                    className={styles.input} placeholder="Min. 8 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={8} autoComplete="new-password"/>
                  <button type="button" className={styles.eyeBtn}
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {password && (
                  <div className={styles.strengthWrap}>
                    <div className={styles.strengthBars}>
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={styles.strengthBar}
                          style={{ background: i <= strength ? strengthColor : undefined }}/>
                      ))}
                    </div>
                    <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirm">Confirm password</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="15" height="15"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input id="confirm"
                    type={showPass ? "text" : "password"}
                    className={styles.input} placeholder="Re-enter password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    required autoComplete="new-password"/>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}
                disabled={status === "loading"}>
                {status === "loading" ? <span className={styles.spinnerSm}/> : (
                  <>Update password
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}