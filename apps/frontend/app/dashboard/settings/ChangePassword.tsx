"use client";

/* ─────────────────────────────────────────────────────────────
   app/dashboard/settings/ChangePassword.tsx
   Drop this component into your settings page.
   Usage: <ChangePassword />
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import styles from "./ChangePassword.module.css";

export default function ChangePassword() {
  const [current,  setCurrent]  = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (password !== confirm) { setError("New passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: password }),
      });
      setSuccess(true);
      setCurrent(""); setPassword(""); setConfirm("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError((err as Error).message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Change Password</h2>
        <p className={styles.sub}>Update your account password.</p>
      </div>

      {error   && <div className={styles.errorBanner}>{error}</div>}
      {success && (
        <div className={styles.successBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Password updated successfully!
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Current password */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="current">Current password</label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input id="current"
              type={showPass ? "text" : "password"}
              className={styles.input} placeholder="Enter current password"
              value={current} onChange={(e) => setCurrent(e.target.value)}
              required autoComplete="current-password"/>
            <button type="button" className={styles.eyeBtn}
              onClick={() => setShowPass(!showPass)}>
              {showPass ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="newpass">New password</label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input id="newpass"
              type={showPass ? "text" : "password"}
              className={styles.input} placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} autoComplete="new-password"/>
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

        {/* Confirm password */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirm">Confirm new password</label>
          <div className={styles.inputWrap}>
            <svg className={styles.inputIcon} width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input id="confirm"
              type={showPass ? "text" : "password"}
              className={styles.input} placeholder="Re-enter new password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password"/>
          </div>
          {confirm && password && confirm !== password && (
            <span className={styles.mismatch}>Passwords don't match</span>
          )}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinner}/> : "Update password"}
        </button>
      </form>
    </div>
  );
}