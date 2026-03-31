"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import styles from "./signup.module.css";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState("");
  const [verifySent, setVerifySent] = useState(false);

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

  /* ── Email register ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      // Backend sends verification email — show confirmation screen
      setVerifySent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

const handleGoogle = async () => {
  setError("")
  setGoogleLoading(true)
  try {
    await loadGoogleScript()
    const accessToken = await getGoogleAccessToken()
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Invalid token received from Google')
    }

    const payload = { accessToken }
    const data = await apiFetch("/api/auth/login/google", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    saveAuth(
      data.data.tokens.accessToken,
      data.data.tokens.refreshToken,
      data.data.user
    )
    router.push("/dashboard")
  } catch (err) {
    setError((err as Error).message)
  } finally {
    setGoogleLoading(false)
  }
}

  /* ── Verify email sent screen ── */
  if (verifySent) {
    return (
      <div className={styles.root} suppressHydrationWarning>
        <div className={styles.glowTop} aria-hidden="true" />
        <div className={styles.glowBottom} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.card}>
          <div className={styles.cardGlow} aria-hidden="true" />
          <div className={styles.verifyWrap}>
            <div className={styles.verifyIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#00e5b0" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className={styles.verifyTitle}>Check your email</h2>
            <p className={styles.verifySub}>
              We sent a verification link to <strong>{email}</strong>.
              Click it to activate your account.
            </p>
            <Link href="/signin" className={styles.submitBtn}
              style={{ textDecoration: "none", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8 }}>
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} suppressHydrationWarning>
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

        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.sub}>Start replying smarter in minutes</p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <button className={styles.oauthBtn} type="button"
          onClick={handleGoogle} disabled={googleLoading || loading}>
          {googleLoading ? <span className={styles.spinner} /> : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? "Signing up..." : "Continue with Google"}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">Full name</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input id="name" type="text" className={styles.input}
                placeholder="Jane Smith"
                value={name} onChange={(e) => setName(e.target.value)}
                required autoComplete="name" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Work email</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input id="email" type="email" className={styles.input}
                placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.inputWrap}>
              <svg className={styles.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input id="password"
                type={showPass ? "text" : "password"}
                className={styles.input} placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} autoComplete="new-password" />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
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
                      style={{ background: i <= strength ? strengthColor : undefined }} />
                  ))}
                </div>
                <span className={styles.strengthLabel} style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className={styles.submitBtn}
            disabled={loading || googleLoading}>
            {loading ? <span className={styles.spinner} /> : (
              <>Create account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/signin" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>

      <p className={styles.terms}>
        By signing up you agree to our{" "}
        <Link href="/terms" className={styles.termsLink}>Terms</Link>
        {" & "}
        <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
      </p>
    </div>
  );
}

/* ── Google Identity Services helpers ── */
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-gsi")) return resolve();
    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.body.appendChild(script);
  });
};

const getGoogleAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-expect-error Google Identity Services not typed
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: "email profile openid",
      callback: (tokenResponse: { access_token: string; error?: string }) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error))
          return
        }
        if (!tokenResponse.access_token) {
          reject(new Error('No access_token in Google response'))
          return
        }
        resolve(tokenResponse.access_token.trim())
      },
      error_callback: (err: { type: string }) => {
        reject(new Error(
          err.type === "popup_closed"
            ? "Sign-in cancelled"
            : err.type || "Google sign-in failed"
        ))
      },
    })

    client.requestAccessToken({ prompt: "select_account" })
  })
}