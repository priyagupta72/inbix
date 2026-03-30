"use client";

/* ─────────────────────────────────────────────────────────────
   components/home/Navbar.tsx
   Fixed top nav with scroll blur effect + mobile hamburger menu
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoIcon, IconArrowRight, IconMenu, IconClose } from "./icons/Icons";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  /* Scroll → darken nav background */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <LogoIcon size={18} />
          </span>
          ReplyEngine
        </Link>

        {/* Desktop links */}
        <ul className={styles.navLinks}>
          <li><a href="#features" className={styles.navLink}>Features</a></li>
          <li><a href="#how"      className={styles.navLink}>How it works</a></li>
        </ul>

        {/* Desktop CTAs */}
        <div className={styles.navCtas}>
          <Link href="/signin"  className="btn btn--ghost">Sign in</Link>
          <Link href="/signup" className="btn btn--primary">
            Get started <IconArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ""}`}>
        <ul className={styles.mobileLinks}>
          <li><a href="#features" className={styles.mobileLink} onClick={closeMenu}>Features</a></li>
          <li><a href="#how"      className={styles.mobileLink} onClick={closeMenu}>How it works</a></li>
        </ul>
        <div className={styles.mobileCtas}>
          <Link href="/signin"  className="btn btn--ghost"         onClick={closeMenu} style={{ width: "100%", justifyContent: "center" }}>Sign in</Link>
          <Link href="/signup" className="btn btn--primary"       onClick={closeMenu} style={{ width: "100%", justifyContent: "center" }}>
            Get started <IconArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={closeMenu} />
      )}
    </>
  );
}