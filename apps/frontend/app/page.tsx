/* ─────────────────────────────────────────────────────────────
   app/page.tsx
   Root homepage — composes all section components.
   Add / remove sections here without touching any component.
───────────────────────────────────────────────────────────── */


import Hero from "@/features/home/Hero";
import StatsStrip from "@/features/home/StatsStrip";
import Features from "@/features/home/Features";
import HowItWorks from "@/features/home/HowItWorks";
import CtaBanner from "@/features/home/CtaBanner";
import Footer from "@/features/home/Footer";
import Navbar from "@/features/home/Navbar";

export const metadata = {
  title:       "ReplyEngine — AI Inbox Management",
  description: "Reply to 100+ messages in under 10 minutes. AI-powered inbox management for Gmail, Instagram & Facebook.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <Features />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}