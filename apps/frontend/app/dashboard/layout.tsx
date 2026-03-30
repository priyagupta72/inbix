'use client';

/* ─────────────────────────────────────────────────────────────
   app/dashboard/layout.tsx
   Persistent sidebar layout for all dashboard routes
───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isLoggedIn, getUser, logout } from '@/lib/auth';
import styles from './layout.module.css';

const NAV = [
  {
    href: '/dashboard',
    label: 'Inbox',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/dashboard/templates',
    label: 'Templates',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
 const [user, setUser] = useState<{ name?: string; plan?: string } | null>(null);

// WITH THIS:
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  if (!isLoggedIn()) {
    router.replace("/signin");
  } else {
    setUser(getUser());
  }
}, []);

if (!mounted) return null;
  return (
    <div className={styles.root}>
      {/* Mobile overlay */}
      {mobile && (
        <div className={styles.overlay} onClick={() => setMobile(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${mobile ? styles.sidebarOpen : ''}`}
      >
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.logoText}>ReplyEngine</span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          <span className={styles.navSection}>Workspace</span>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={() => setMobile(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
                {item.label === 'Inbox' && (
                  <span className={styles.navBadge}>12</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user */}
        {/* <div className={styles.sidebarBottom}>
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userPlan}>
                {user?.plan || 'Free plan'}
              </span>
            </div>
          </div>
        </div> */}

        {/* Bottom: user + logout */}
<div className={styles.sidebarBottom}>
  <div className={styles.userRow}>
    <div className={styles.userAvatar}>
      {user?.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
    <div className={styles.userInfo}>
      <span className={styles.userName}>{user?.name || 'User'}</span>
      <span className={styles.userPlan}>
        {user?.plan || 'Free plan'}
      </span>
    </div>
  </div>
  <button
    className={styles.logoutBtn}
    onClick={() => {
      logout();
      router.replace('/signin');
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
    Log out
  </button>
</div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar (mobile) */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setMobile(!mobile)}
            aria-label="Menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className={styles.topbarLogo}>ReplyEngine</span>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
