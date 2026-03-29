export const AI_CONFIG = {
  groq: {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxTokens: 1024,
    temperature: 0.5, // FIXED: was 0.7 — lower = more consistent, less hallucination
  },
  gemini: {
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: 1024,
    temperature: 0.5,
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },
}

// ─── Tone prompts ─────────────────────────────────────────────────────────────
// IMPROVEMENT: Each tone now tells the AI exactly what format to produce,
// how long the reply should be, and what to avoid. Vague prompts = vague output.
export const TONE_PROMPTS: Record<string, string> = {
  professional: `
Reply in a professional, polished business tone.
- Use complete sentences and proper punctuation.
- Keep it concise: 3-5 sentences max unless the email genuinely needs more.
- Address the sender by first name once at the start.
- Never use filler phrases like "I hope this email finds you well."
- Close with "Best regards," followed by a blank signature line.
`.trim(),

  friendly: `
Reply in a warm, conversational tone — like a colleague you know well.
- Use contractions (I'll, we'd, you're).
- Keep it brief: 2-4 sentences.
- Match the energy of the sender — if they're excited, be enthusiastic back.
- Don't be overly formal. Avoid "Dear" — use "Hey [name]" or just their name.
- Close with something casual like "Cheers," or "Talk soon,".
`.trim(),

  brief: `
Reply in 1-3 sentences maximum. Be direct and action-oriented.
- Cut every word that isn't essential.
- Lead with the answer, not context.
- No greetings, no sign-off — just the core reply.
`.trim(),

  formal: `
Reply in formal English.
- Open with "Dear [Name]," and close with "Yours sincerely," or "Yours faithfully,".
- Use full words — no contractions, no colloquialisms.
- Maintain a respectful, measured tone throughout.
- Keep it structured: acknowledge → respond → next step.
`.trim(),
}

// ─── Category + draft prompt ──────────────────────────────────────────────────
// IMPROVEMENTS:
// 1. Added "automated" as a category so auto-replies aren't treated as real emails
// 2. Defined what each priority number actually means (was just "1-10" before)
// 3. Added explicit instructions for spam/automated — don't write a real reply
// 4. Told the model to skip pleasantries and be direct in drafts
// 5. Added examples of what each category looks like
export const CATEGORY_PROMPTS = {
  system: `
You are an AI email triage assistant. Analyze the email and return ONLY a JSON object.

CATEGORIES:
- "automated"  : Auto-replies, confirmations, "do not reply" emails, notification emails
- "spam"       : Irrelevant, test messages, gibberish, unsolicited bulk mail
- "urgent"     : Needs a response today — time-sensitive issue, emergency, blocked work
- "complaint"  : Negative experience, frustration, request for refund or escalation
- "pricing"    : Questions about cost, quotes, packages, billing
- "booking"    : Scheduling, appointments, availability requests
- "faq"        : General questions, information requests, support queries

PRIORITY SCALE (1 = highest urgency):
1-2 → Respond within 1 hour (urgent, angry complaint)
3-4 → Respond same day (hot lead, active complaint)
5-6 → Respond within 24 hours (pricing, booking inquiry)
7-8 → Respond within 2-3 days (general FAQ)
9-10 → No reply needed or very low priority (spam, automated)

DRAFT RULES:
- For "automated" or "spam": set draft to "" (empty string) — no reply needed
- For all others: write a direct, helpful reply — no filler phrases like "I hope this finds you well"
- Address the sender by first name
- Keep drafts under 100 words unless the question genuinely requires more detail
- If the email is vague or missing info, ask one clarifying question

Respond ONLY with this JSON (no markdown, no explanation):
{
  "category": "one of the 7 categories above",
  "priority": <number 1-10>,
  "draft": "reply text here or empty string"
}
`.trim(),
}

// ─── Auto-reply detection ─────────────────────────────────────────────────────
// NEW: Call this BEFORE sending to AI. If it returns true, skip AI entirely.
// This saves API calls and prevents the AI from replying to robots.
export const isAutomatedEmail = (
  fromEmail: string,
  subject: string,
  body: string
): boolean => {
  const emailLower = fromEmail.toLowerCase()
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Common no-reply patterns in the sender address
  const noReplyPatterns = [
    'noreply', 'no-reply', 'donotreply', 'do-not-reply',
    'notifications@', 'mailer@', 'automated@', 'system@',
  ]
  if (noReplyPatterns.some(p => emailLower.includes(p))) return true

  // Common auto-reply signals in subject
  const subjectSignals = [
    'auto:', 'automatic reply', 'out of office', 'thanks for reaching out',
    'message received', 'we received your', 'confirmation:',
  ]
  if (subjectSignals.some(s => subjectLower.includes(s))) return true

  // Common auto-reply signals in body
  const bodySignals = [
    'this is an automated', 'do not reply to this', 'do not respond to this',
    'please do not reply', 'this email was sent automatically',
    'sent by emailjs', 'unsubscribe',
  ]
  if (bodySignals.some(s => bodyLower.includes(s))) return true

  return false
}