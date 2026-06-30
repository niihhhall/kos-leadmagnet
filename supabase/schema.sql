-- ═══════════════════════════════════════════════════════════════════════════
-- KineticOS Diagnostic Funnel — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── LEADS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  first_name          TEXT NOT NULL,
  last_name           TEXT,
  email               TEXT NOT NULL,

  -- Funnel context
  profession          TEXT CHECK (profession IN ('designer', 'marketer', 'writer', 'other')),
  client_count        TEXT CHECK (client_count IN ('1-2', '3-4', '5+')),

  -- Scores
  total_score         NUMERIC(4, 1),
  score_band          TEXT,
  foundation_score    NUMERIC(3, 1),
  productivity_score  NUMERIC(3, 1),
  content_score       NUMERIC(3, 1),
  marketing_score     NUMERIC(3, 1),
  client_score        NUMERIC(3, 1),
  finance_score       NUMERIC(3, 1),

  -- LLM Report (full JSON output from Fireworks/Llama)
  report_json         JSONB,

  -- PDF delivery
  pdf_url             TEXT,       -- Supabase Storage URL if we archive PDFs

  -- Analytics cross-reference
  posthog_distinct_id TEXT,

  -- Email delivery status
  email_sent          BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at       TIMESTAMPTZ,

  -- Source tracking
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT
);

-- ─── DELIVERY ERRORS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_errors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,   -- 'modal_pdf' | 'resend_email' | 'llm_generation'
  error       TEXT,
  payload     JSONB,           -- the payload that failed (for retry)
  retried     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_email_idx       ON leads(email);
CREATE INDEX IF NOT EXISTS leads_profession_idx  ON leads(profession);
CREATE INDEX IF NOT EXISTS leads_score_idx       ON leads(total_score);
CREATE INDEX IF NOT EXISTS leads_created_idx     ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_sent_idx  ON leads(email_sent);
CREATE INDEX IF NOT EXISTS errors_lead_id_idx    ON delivery_errors(lead_id);
CREATE INDEX IF NOT EXISTS errors_stage_idx      ON delivery_errors(stage);
CREATE INDEX IF NOT EXISTS errors_resolved_idx   ON delivery_errors(resolved);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- All access via service_role key (used by n8n) — no public access
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_errors ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically in Supabase
-- No explicit policies needed for service_role access

-- ─── USEFUL VIEWS ────────────────────────────────────────────────────────────

-- Daily lead summary
CREATE OR REPLACE VIEW daily_lead_summary AS
SELECT
  DATE(created_at AT TIME ZONE 'UTC') AS date,
  COUNT(*)                             AS total_leads,
  COUNT(*) FILTER (WHERE email_sent)   AS emails_delivered,
  AVG(total_score)::NUMERIC(4,1)       AS avg_score,
  COUNT(*) FILTER (WHERE profession = 'designer')  AS designers,
  COUNT(*) FILTER (WHERE profession = 'marketer')  AS marketers,
  COUNT(*) FILTER (WHERE profession = 'writer')    AS writers,
  COUNT(*) FILTER (WHERE profession = 'other')     AS other
FROM leads
GROUP BY DATE(created_at AT TIME ZONE 'UTC')
ORDER BY date DESC;

-- Undelivered leads (for retry monitoring)
CREATE OR REPLACE VIEW undelivered_leads AS
SELECT id, first_name, email, total_score, created_at
FROM leads
WHERE email_sent = FALSE
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at ASC;

-- ─── SAMPLE DATA (for testing — delete before production) ───────────────────
-- INSERT INTO leads (first_name, last_name, email, profession, client_count, total_score, score_band,
--   foundation_score, productivity_score, content_score, marketing_score, client_score, finance_score)
-- VALUES ('Test', 'User', 'test@example.com', 'designer', '3-4', 31.5, 'Emerging Architecture',
--   4, 6, 5, 3, 7, 6.5);
