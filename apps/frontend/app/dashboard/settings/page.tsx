'use client';

import { useState } from 'react';
import styles from './settings.module.css';
import ChangePassword from './ChangePassword';
import { getUser } from '@/lib/auth';

const TONES = ['Professional', 'Friendly', 'Brief', 'Formal'] as const;

export default function SettingsPage() {
  const [tone, setTone] = useState('Professional');
  const [name, setName] = useState('Jane Smith');
  const [business, setBusiness] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const user = getUser();
  const hasPassword = !!user?.passwordHash;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.sub}>Manage your account and integrations</p>
      </div>

      {/* ── Integrations ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Integrations</h2>
        <p className={styles.sectionSub}>
          Connect your inbox to start receiving messages
        </p>

        {/* Gmail */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationLeft}>
            <div className={styles.integrationIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  fill="rgba(234,67,53,0.15)"
                  stroke="#ea4335"
                  strokeWidth="1.5"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="#ea4335"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div>
              <div className={styles.integrationName}>Gmail</div>
              <div className={styles.integrationDesc}>
                {gmailConnected
                  ? 'Connected — receiving messages in real time'
                  : 'Not connected — connect to start managing your inbox'}
              </div>
            </div>
          </div>

          {gmailConnected ? (
            <div className={styles.integrationRight}>
              <span className={styles.connectedBadge}>
                <span className={styles.connectedDot} />
                Connected
              </span>
              <button
                className={styles.disconnectBtn}
                onClick={() => setGmailConnected(false)}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className={styles.connectBtn}
              onClick={() => setGmailConnected(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  fill="rgba(234,67,53,0.15)"
                  stroke="#ea4335"
                  strokeWidth="1.5"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="#ea4335"
                  strokeWidth="1.5"
                />
              </svg>
              Connect Gmail
            </button>
          )}
        </div>

        {/* Coming soon platforms */}
        {['Instagram DMs', 'Facebook DMs'].map((platform) => (
          <div
            key={platform}
            className={`${styles.integrationCard} ${styles.integrationDisabled}`}
          >
            <div className={styles.integrationLeft}>
              <div className={styles.integrationIcon} style={{ opacity: 0.4 }}>
                {platform === 'Instagram DMs' ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="#a855f7" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1877f2"
                    strokeWidth="1.5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                )}
              </div>
              <div>
                <div
                  className={styles.integrationName}
                  style={{ opacity: 0.5 }}
                >
                  {platform}
                </div>
                <div className={styles.integrationDesc}>Coming soon</div>
              </div>
            </div>
            <span className={styles.comingSoonBadge}>Soon</span>
          </div>
        ))}
      </section>

      {/* ── Profile ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <p className={styles.sectionSub}>
          Your name and business info used in AI replies
        </p>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Full name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Business name <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              placeholder="Acme Inc."
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Tone preference ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Default reply tone</h2>
        <p className={styles.sectionSub}>
          AI will use this tone when drafting replies
        </p>
        <div className={styles.toneGrid}>
          {TONES.map((t) => (
            <button
              key={t}
              className={`${styles.toneCard} ${tone === t ? styles.toneCardActive : ''}`}
              onClick={() => setTone(t)}
            >
              <span className={styles.toneName}>{t}</span>
              <span className={styles.toneDesc}>
                {t === 'Professional' && 'Polished, complete sentences'}
                {t === 'Friendly' && 'Warm and conversational'}
                {t === 'Brief' && '2 sentences max, direct'}
                {t === 'Formal' && 'Dear/Regards format'}
              </span>
              {tone === t && (
                <span className={styles.toneCheck}>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className={styles.saveRow}>
        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Saved!
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>

      {/* ── Change Password ── */}
      {hasPassword && (
        <section className={styles.section}>
          <div className={styles.sectionRow}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h2 className={styles.sectionTitle}>Change Password</h2>
              <p className={styles.sectionSub}>Update your account password</p>
            </div>
            <button
              className={styles.changePassBtn}
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              {showChangePassword ? 'Cancel' : 'Change password'}
            </button>
          </div>

          {showChangePassword && (
            <div className={styles.changePassExpand}>
              <ChangePassword />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
