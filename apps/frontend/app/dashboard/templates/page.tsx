"use client";

/* app/dashboard/templates/page.tsx */

import { useState } from "react";
import styles from "./templates.module.css";

type Template = {
  id: string;
  category: string;
  trigger: string;
  content: string;
};

const DEFAULT_TEMPLATES: Template[] = [
  { id: "1", category: "FAQ",     trigger: "hours",    content: "Thanks for reaching out! Our support hours are Monday–Friday, 9am–6pm EST. We'll get back to you as soon as possible." },
  { id: "2", category: "Booking", trigger: "schedule", content: "I'd love to connect! You can book a time directly on my calendar here: [CALENDLY_LINK]. Looking forward to speaking with you." },
  { id: "3", category: "Pricing", trigger: "rates",    content: "Great question! Here's a link to our pricing page: [PRICING_LINK]. Happy to walk you through options on a quick call too." },
];

const CATEGORY_COLORS: Record<string, string> = {
  FAQ:       "#93b4ff",
  Booking:   "#00e5b0",
  Pricing:   "#fbbf24",
  Urgent:    "#f87171",
  Complaint: "#f87171",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([...DEFAULT_TEMPLATES]);
  const [showNew, setShowNew]     = useState(false);
  const [newCat, setNewCat]       = useState("FAQ");
  const [newTrigger, setNewTrigger] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleAdd = () => {
    if (!newTrigger || !newContent) return;
    setTemplates((prev) => [
      ...prev,
      { id: Date.now().toString(), category: newCat, trigger: newTrigger, content: newContent },
    ]);
    setNewTrigger(""); setNewContent(""); setShowNew(false);
  };

  const handleDelete = (id: string) =>
    setTemplates((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Templates</h1>
          <p className={styles.sub}>Reusable reply templates for common messages</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowNew(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New template
        </button>
      </div>

      {/* New template form */}
      {showNew && (
        <div className={styles.newCard}>
          <div className={styles.newCardHeader}>
            <span className={styles.newCardTitle}>New template</span>
            <button className={styles.closeBtn} onClick={() => setShowNew(false)}>✕</button>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                {["FAQ", "Pricing", "Booking", "Urgent", "Complaint"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Trigger keyword</label>
              <input className={styles.input} placeholder="e.g. hours, price, schedule"
                value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)} />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Reply content</label>
            <textarea className={styles.textarea} rows={4} placeholder="Write your template reply..."
              value={newContent} onChange={(e) => setNewContent(e.target.value)} />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowNew(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleAdd}>Save template</button>
          </div>
        </div>
      )}

      {/* Template list */}
      <div className={styles.list}>
        {templates.map((t) => (
          <div key={t.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardCategory}
                style={{ color: CATEGORY_COLORS[t.category] ?? "#93b4ff",
                         background: `${CATEGORY_COLORS[t.category] ?? "#93b4ff"}18` }}>
                {t.category}
              </span>
              <span className={styles.cardTrigger}>keyword: <b>{t.trigger}</b></span>
              <button className={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Delete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
            <p className={styles.cardContent}>{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}