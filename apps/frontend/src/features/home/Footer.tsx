/* ─────────────────────────────────────────────────────────────
   components/home/Footer.tsx
   Simple site footer — logo, nav links, copyright
───────────────────────────────────────────────────────────── */

import Link from "next/link";
import styles from "./Footer.module.css";

const FOOTER_LINKS = ["Privacy", "Terms", "Docs", "Contact"] as const;

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.footerLogo}>
        ReplyEngine
      </Link>

      <nav className={styles.footerLinks} aria-label="Footer navigation">
        {FOOTER_LINKS.map((label) => (
          <a key={label} href="#" className={styles.footerLink}>
            {label}
          </a>
        ))}
      </nav>

      <span className={styles.footerCopy}>
        © 2026 ReplyEngine. Built with Next.js
      </span>
    </footer>
  );
}