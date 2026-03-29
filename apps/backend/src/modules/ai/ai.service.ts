// ─── ai.service.ts ───────────────────────────────────────────────────────────

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG, TONE_PROMPTS, CATEGORY_PROMPTS, isAutomatedEmail } from '../../config/ai.config'
import { AppError } from '../../utils/AppError'
import logger from '../../utils/logger'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface AIResult {
  category: string
  priority: number
  draft: string
  skipped?: boolean // NEW: true when we intentionally skip AI (automated/spam)
}

// ─── Groq (Primary) ───────────────────────────────────────────────────────────
const generateWithGroq = async (prompt: string, system: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: AI_CONFIG.groq.model,
    max_tokens: AI_CONFIG.groq.maxTokens,
    temperature: AI_CONFIG.groq.temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  })
  return response.choices[0]?.message?.content?.trim() || ''
}

// ─── Gemini (Fallback) ────────────────────────────────────────────────────────
const generateWithGemini = async (prompt: string, system: string): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: AI_CONFIG.gemini.model,
    // IMPROVEMENT: Pass system instruction properly via Gemini's dedicated field
    systemInstruction: system,
  })
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

// ─── AI Fallback Chain ────────────────────────────────────────────────────────
const generateWithFallback = async (prompt: string, system: string): Promise<string> => {
  try {
    logger.debug('Trying Groq (primary)')
    const result = await generateWithGroq(prompt, system)
    logger.debug('Groq succeeded')
    return result
  } catch (groqError) {
    logger.warn('Groq failed, falling back to Gemini', {
      error: (groqError as Error).message,
    })
  }

  try {
    logger.debug('Trying Gemini (fallback)')
    const result = await generateWithGemini(prompt, system)
    logger.debug('Gemini succeeded')
    return result
  } catch (geminiError) {
    logger.error('Both AI providers failed', {
      error: (geminiError as Error).message,
    })
    throw new AppError('AI service temporarily unavailable', 503)
  }
}

// ─── Strip markdown fences from AI output ────────────────────────────────────
// IMPROVEMENT: Groq/Gemini sometimes wrap JSON in ```json ... ``` even when told not to.
// This strips those fences before parsing so we don't get silent parse failures.
const stripFences = (raw: string): string => {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// ─── Categorize + Draft ───────────────────────────────────────────────────────
export const categorizeAndDraft = async (
  fromName: string,
  fromEmail: string, // IMPROVEMENT: added so we can run auto-reply detection
  subject: string,
  body: string
): Promise<AIResult> => {

  // IMPROVEMENT: Check for automated emails BEFORE hitting the AI.
  // This prevents replying to robots and saves API quota.
  if (isAutomatedEmail(fromEmail, subject, body)) {
    logger.info('Skipping AI — automated email detected', { fromEmail, subject })
    return {
      category: 'automated',
      priority: 10,
      draft: '',
      skipped: true,
    }
  }

  logger.info('Categorizing and drafting reply', { fromName, subject })

  // IMPROVEMENT: Give the AI cleaner, more structured context.
  // The original prompt dumped everything in a paragraph — harder for the model to parse.
  const prompt = `
From: ${fromName} <${fromEmail}>
Subject: ${subject || '(no subject)'}

--- Message ---
${body.trim()}
--- End ---

Analyze this email and respond with JSON only.`.trim()

  let raw: string
  try {
    raw = await generateWithFallback(prompt, CATEGORY_PROMPTS.system)
  } catch {
    return { category: 'faq', priority: 5, draft: '' }
  }

  // IMPROVEMENT: Strip markdown fences, then parse
  try {
    const cleaned = stripFences(raw)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])

    // IMPROVEMENT: Validate + sanitize each field instead of blindly trusting the model
    const validCategories = ['automated', 'spam', 'urgent', 'complaint', 'pricing', 'booking', 'faq']
    const category = validCategories.includes(parsed.category) ? parsed.category : 'faq'
    const priority = typeof parsed.priority === 'number'
      ? Math.min(10, Math.max(1, Math.round(parsed.priority)))
      : 5
    const draft = typeof parsed.draft === 'string' ? parsed.draft.trim() : ''

    return { category, priority, draft }
  } catch (err) {
    logger.warn('Failed to parse AI response', { raw, err })
    // IMPROVEMENT: Return the raw text as the draft instead of losing it completely
    return { category: 'faq', priority: 5, draft: raw }
  }
}

// ─── Generate Tone Variant ────────────────────────────────────────────────────
export const generateToneVariant = async (
  fromName: string,
  fromEmail: string,
  subject: string,
  body: string,
  tone: string
): Promise<string> => {
  logger.info('Generating tone variant', { tone, fromName })

  // IMPROVEMENT: Don't generate tone variants for automated/spam emails
  if (isAutomatedEmail(fromEmail, subject, body)) {
    logger.info('Skipping tone variant — automated email', { fromEmail })
    return ''
  }

  const tonePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional

  // IMPROVEMENT: System prompt is now just the tone instructions (clean separation).
  // Sender name is included so the AI can address them correctly.
  const system = `
You are an AI email reply assistant.
The sender's name is: ${fromName}
${tonePrompt}

Write ONLY the reply body.
Do NOT include a subject line.
Do NOT include "Here's a draft:" or any preamble.
Do NOT include placeholder brackets like [Your Name] — leave a blank line for the signature instead.
`.trim()

  const prompt = `
Subject: ${subject || '(no subject)'}

--- Original message ---
${body.trim()}
--- End ---

Write a reply now.`.trim()

  return generateWithFallback(prompt, system)
}

// ─── Regenerate Draft ─────────────────────────────────────────────────────────
export const regenerateDraft = async (
  fromName: string,
  fromEmail: string,
  subject: string,
  body: string,
  tone: string
): Promise<string> => {
  return generateToneVariant(fromName, fromEmail, subject, body, tone)
}