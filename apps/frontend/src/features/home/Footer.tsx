/* ─────────────────────────────────────────────────────────────
   components/home/Footer.tsx
   Simple site footer — logo, nav links, copyright
───────────────────────────────────────────────────────────── */

import Link from "next/link";
import styles from "./Footer.module.css";
import { LogoIcon } from "./icons/Icons"; 

const FOOTER_LINKS = ["Privacy", "Terms", "Docs", "Contact"] as const;

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.footerLogo}>
  <span className={styles.footerLogoIcon}>
    <LogoIcon size={18} />
  </span>
  inbix
</Link>

      <nav className={styles.footerLinks} aria-label="Footer navigation">
        {FOOTER_LINKS.map((label) => (
          <a key={label} href="#" className={styles.footerLink}>
            {label}
          </a>
        ))}
      </nav>

      <span className={styles.footerCopy}>
  © {new Date().getFullYear()} inbix. All rights reserved. Built by Priya Gupta.
</span>
    </footer>
  );
}