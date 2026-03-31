"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import styles from "./templates.module.css";

type Template = {
  id: string;
  category: string;
  trigger: string;
  content: string;
  useCount: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  FAQ:       "#93b4ff",
  Booking:   "#00e5b0",
  Pricing:   "#fbbf24",
  Urgent:    "#f87171",
  Complaint: "#f87171",
  Spam:      "#6b7280",
};

const fetcher = (url: string) => apiFetch(url).then((r) => r.data);

export default function TemplatesPage() {
  const [showNew, setShowNew]       = useState(false);
  const [newCat, setNewCat]         = useState("FAQ");
  const [newTrigger, setNewTrigger] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving]         = useState(false);

  const { data, mutate } = useSWR("/api/templates", fetcher);
  const templates: Template[] = data?.templates ?? [];

  const handleAdd = async () => {
    if (!newTrigger || !newContent) return;
    setSaving(true);
    try {
      await apiFetch("/api/templates", {
        method: "POST",
        body: JSON.stringify({ category: newCat, trigger: newTrigger, content: newContent }),
      });
      await mutate();
      setNewTrigger(""); setNewContent(""); setShowNew(false);
    } catch (err) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/templates/${id}`, { method: "DELETE" });
    await mutate();
  };

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
            <button className={styles.saveBtn} onClick={handleAdd} disabled={saving}>
              {saving ? "Saving..." : "Save template"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {templates.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>
            No templates yet — create your first one!
          </div>
        ) : templates.map((t) => (
          <div key={t.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.cardCategory}
                style={{ color: CATEGORY_COLORS[t.category] ?? "#93b4ff",
                         background: `${CATEGORY_COLORS[t.category] ?? "#93b4ff"}26` }}>
                {t.category}
              </span>
              <span className={styles.cardTrigger}>keyword: <b>{t.trigger}</b></span>
              {t.useCount > 0 && (
                <span className={styles.useCount}>used {t.useCount}×</span>
              )}
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