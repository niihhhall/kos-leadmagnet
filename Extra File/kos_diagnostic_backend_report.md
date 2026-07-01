# KineticOS Diagnostic Funnel — Backend Technical Report
**CTO Report | Final | 2026-06-29**
**Status: All decisions locked. Ready to build.**

---

## Executive Summary

The KineticOS diagnostic funnel has a production-ready scoring engine and UI. What's missing is everything behind the submit button: no real lead capture, no AI report generation, no PDF, no email delivery, and no analytics. This report defines the complete backend architecture to close all gaps in one coherent build using credits and infrastructure you already own.

**Total infrastructure cost at 500 leads/month: ~$0–6/month.**
**Total credits available: $280 (Fireworks $250 + Modal $30) = covers ~200,000+ reports.**

---

## Finalized Technology Decisions

All decisions are locked based on our conversation. No open questions remain.

| Layer | Tool | Decision Rationale |
|-------|------|-------------------|
| **Frontend** | Vercel + React/Vite | Already deployed |
| **Edge API** | Cloudflare Workers | Free, protects API keys, globally fast |
| **LLM** | Fireworks.ai — Llama 3.3 70B | $250 credits, ~193K reports, OpenAI-compatible API |
| **PDF Engine** | Modal.com — Python Playwright | $30 credits, ~23K PDFs, serverless, zero server maintenance |
| **Orchestration** | n8n | Glues CF Worker → Modal → Supabase → Resend |
| **Email Delivery** | Resend | PDF as binary attachment, plain text body only |
| **Database** | Supabase | Persistent lead DB, free tier covers MVP |
| **Analytics** | PostHog | Anonymous + identified tracking, funnel analysis |
| **PDF Template** | HTML/CSS (yours) | You design once, I wire content slots, Playwright renders |

---

## What's Being Replaced / Upgraded in the Frontend

### Current State (broken in production)
```
src/utils/esp.js  →  writes to localStorage only
                      zero leads captured
                      email only (no name)
```

### Target State
```
src/utils/esp.js  →  replaced entirely
                  →  POST to Cloudflare Worker
                  →  captures firstName, lastName, email
                  →  returns LLM report JSON to display on results page
                  →  PDF + email handled async in background
```

### Email Gate Form: Before → After

**Before:** 1 field — email only

**After:** 3 fields
- `First Name` (required)
- `Last Name` (optional)
- `Email` (required)

CTA changes: `"Unlock My Report"` → **`"Send My Report"`**

Supporting copy under the button:
> "Your full diagnostic report will be sent to this email as a PDF within 60 seconds."

This sets the correct expectation. The lead knows a PDF is coming. No confusion.

---

## Full Architecture — Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│  VERCEL — React/Vite Frontend                                     │
│                                                                   │
│  1. User completes 6-section diagnostic                           │
│  2. Score computed client-side (existing engine, no change)       │
│  3. Reveal stage: animated score + email gate                     │
│  4. Lead submits: firstName, lastName, email                      │
│  5. PostHog.identify(email) called immediately                    │
│  6. POST /generate-report → Cloudflare Worker                     │
│  7. Worker returns report JSON → displayed on results page        │
└─────────────────────────┬─────────────────────────────────────────┘
                          │ POST (sync, ~2-4 seconds)
                          ▼
┌───────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE WORKERS — Edge API Layer                              │
│                                                                   │
│  Receives: { firstName, lastName, email, profession,              │
│             clientCount, score, sectionScores, answers }          │
│                                                                   │
│  1. Validates required fields                                     │
│  2. Builds structured LLM prompt from answers + scores            │
│  3. POST → Fireworks.ai API (Llama 3.3 70B)                      │
│     base_url: api.fireworks.ai/inference/v1                       │
│     response_format: json_object                                  │
│  4. Returns report JSON to browser (sync)                         │
│  5. Fires n8n webhook (async, non-blocking)                       │
└──────────┬────────────────────────────────────────────────────────┘
           │ Async webhook (fire-and-forget)
           ▼
┌───────────────────────────────────────────────────────────────────┐
│  N8N — Workflow Orchestrator                                      │
│                                                                   │
│  Node 1: Webhook trigger                                          │
│  Node 2: Build HTML from report JSON + PDF template               │
│          (string replace {{variables}} with LLM content)          │
│  Node 3: HTTP POST → Modal.com PDF endpoint                       │
│          → returns base64 PDF bytes                               │
│  Node 4: Supabase INSERT (leads table)                            │
│  Node 5: Resend API → plain text email + PDF attachment           │
│  Node 6: PostHog Server API → capture 'report_delivered'          │
└──────────┬──────────────────────┬────────────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────────────┐
│  MODAL.COM       │   │  SUPABASE                                │
│  Python Service  │   │  leads table (see schema below)          │
│                  │   │  + Storage (optional PDF archive)        │
│  POST /pdf       │   └──────────────────────────────────────────┘
│  body: { html }  │
│  returns: bytes  │   ┌──────────────────────────────────────────┐
│                  │   │  RESEND                                  │
│  Playwright/     │   │  from: reports@kineticos.co              │
│  Chromium        │   │  to: lead email                          │
│  headless render │   │  subject: "Sarah, your report is ready"  │
└──────────────────┘   │  body: plain text (no HTML)              │
                       │  attachment: KineticOS-Report-Sarah.pdf  │
                       └──────────────────────────────────────────┘
                                    │
                                    ▼
                       ┌──────────────────────────────────────────┐
                       │  POSTHOG                                 │
                       │  Anonymous tracking from page load       │
                       │  Identified on email submit              │
                       │  Server-side event: report_delivered     │
                       └──────────────────────────────────────────┘
```

---

## Service 1: Cloudflare Worker

**File:** `workers/generate-report.js`
**Route:** `POST https://kos-api.{your-subdomain}.workers.dev/generate-report`
**Environment Variables:**
```
FIREWORKS_API_KEY=fw_xxxxx
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/kos-diagnostic
ALLOWED_ORIGIN=https://kos-leadmagnet.vercel.app
```

**Responsibilities:**
- Input validation (required fields check)
- Prompt assembly from scores + answers
- Fireworks.ai API call (Llama 3.3 70B, JSON mode)
- Return report JSON synchronously to browser
- Fire n8n webhook asynchronously (does NOT wait for response)
- CORS: restrict to your Vercel domain only

**LLM Call:**
```javascript
const llmResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.FIREWORKS_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    temperature: 0.7
  })
});
```

**LLM Report JSON Schema:**
```json
{
  "headline": "string — punchy 8-word diagnosis",
  "executiveSummary": "string — 2-3 sentences addressing firstName",
  "primaryDiagnosis": {
    "label": "string — e.g. Disconnected Workspace",
    "description": "string — root cause paragraph",
    "evidencePoints": ["string", "string", "string"]
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "string",
      "why": "string",
      "action": "string — specific, actionable",
      "timeToImplement": "string — e.g. 2-3 hours"
    }
  ],
  "quickWin": "string — one thing this week",
  "forwardLook": "string — what changes if they fix this",
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "scoreInterpretation": "string — what their score means in plain language"
}
```

**Timeout handling:** If Fireworks times out (>10s), the Worker returns a fallback rule-based report (derived from existing `questions.js` logic) so the user always sees results. PDF generation is queued regardless.

---

## Service 2: Modal.com PDF Service

**File:** `modal_pdf_service.py`
**Endpoint:** `POST https://your-org--kos-pdf-service-pdf-endpoint.modal.run`
**Credits:** $30 Modal credits → ~23,000 PDFs

**Responsibilities:**
- Accept `{ html: string }` POST body
- Spin up Playwright + Chromium (serverless, cold start ~5-10s)
- Render HTML to PDF (A4, print background enabled)
- Return base64-encoded PDF bytes

```python
import modal

app = modal.App("kos-pdf-service")

image = (
    modal.Image.debian_slim()
    .pip_install("playwright")
    .run_commands(
        "playwright install chromium",
        "playwright install-deps chromium"
    )
)

@app.function(image=image, timeout=60)
def generate_pdf(html_content: str) -> bytes:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 794, "height": 1123})
        page.set_content(html_content, wait_until="networkidle")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
        )
        browser.close()
    return pdf_bytes

@app.web_endpoint(method="POST")
def pdf_endpoint(body: dict):
    import base64
    pdf_bytes = generate_pdf.remote(body["html"])
    return {"pdf_base64": base64.b64encode(pdf_bytes).decode()}
```

**Cold start note:** ~5-10 seconds for first request after idle period. Acceptable because PDF generation is async — user sees results page immediately, PDF arrives in inbox ~30-60 seconds after submission.

---

## Service 3: PDF Template (Design + Content Separation)

### The Model

```
YOUR HTML/CSS DESIGN (one-time, you own)
     +
LLM CONTENT (dynamic per lead, injected by n8n)
     =
PDF (rendered by Modal/Playwright per submission)
```

### Template Variables (n8n does string replace)

```
{{firstName}}           → "Sarah"
{{lastName}}            → "Chen"
{{date}}                → "June 29, 2026"
{{profession}}          → "Designer"
{{totalScore}}          → "31"
{{scoreBand}}           → "Emerging Architecture"
{{foundationScore}}     → "4"
{{productivityScore}}   → "6"
{{contentScore}}        → "5"
{{marketingScore}}      → "3"
{{clientScore}}         → "7"
{{financeScore}}        → "6"
{{headline}}            → "Your Business Runs on Memory, Not Systems"
{{executiveSummary}}    → "[LLM paragraph]"
{{diagnosisLabel}}      → "Disconnected Workspace"
{{diagnosisDesc}}       → "[LLM paragraph]"
{{rec1Title}}           → "[LLM title]"
{{rec1Why}}             → "[LLM why paragraph]"
{{rec1Action}}          → "[LLM action]"
{{rec2Title}}           → "..."
{{rec3Title}}           → "..."
{{quickWin}}            → "[LLM quick win]"
{{forwardLook}}         → "[LLM closing statement]"
{{riskLevel}}           → "HIGH"
```

### Design Process

1. You design the PDF in any tool (Figma → export HTML, or direct HTML/CSS)
2. You give me the design
3. I slot in the `{{variables}}` in the right places
4. One-time setup. Template never changes unless you rebrand.

---

## Service 4: n8n Workflow

**Workflow Name:** `kos-diagnostic-report-v1`

**Node sequence:**
```
[1] Webhook (POST trigger)
     ↓ payload: { firstName, lastName, email, profession,
                  score, sectionScores, reportJson }
[2] Code Node: Build HTML string
     → Load PDF template
     → Replace all {{variables}} with payload values
     → Return: { html: "<!DOCTYPE html>..." }
[3] HTTP Request → Modal.com /pdf
     → Body: { html }
     → Response: { pdf_base64 }
[4] Supabase Insert → leads table
     → firstName, lastName, email, profession,
       score, sectionScores, reportJson,
       email_sent: false
[5] Code Node: Build Resend payload
     → Decode base64 → binary attachment
[6] HTTP Request → Resend API
     → POST https://api.resend.com/emails
     → Plain text body + PDF attachment
     → On success: get email ID
[7] Supabase Update → leads table
     → email_sent: true, email_sent_at: now()
[8] HTTP Request → PostHog Server API
     → POST https://eu.posthog.com/capture
     → event: 'report_delivered'
     → distinct_id: email
```

**Error handling in n8n:**
- If Modal fails → retry once after 10s → if still fails, log to Supabase `errors` table, send Slack/email alert to you
- If Resend fails → retry once → log failure, alert
- Lead is always inserted to Supabase regardless of PDF/email success

---

## Supabase Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main leads table
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  first_name          TEXT NOT NULL,
  last_name           TEXT,
  email               TEXT NOT NULL,

  -- Funnel context
  profession          TEXT CHECK (profession IN ('designer','marketer','writer','other')),
  client_count        TEXT CHECK (client_count IN ('1-2','3-4','5+')),

  -- Scores
  total_score         NUMERIC(4,1),
  score_band          TEXT,
  foundation_score    NUMERIC(3,1),
  productivity_score  NUMERIC(3,1),
  content_score       NUMERIC(3,1),
  marketing_score     NUMERIC(3,1),
  client_score        NUMERIC(3,1),
  finance_score       NUMERIC(3,1),

  -- LLM Report
  report_json         JSONB,

  -- Analytics cross-reference
  posthog_distinct_id TEXT,

  -- Delivery status
  email_sent          BOOLEAN DEFAULT FALSE,
  email_sent_at       TIMESTAMPTZ,
  pdf_url             TEXT  -- optional, if you archive PDFs to Storage
);

-- Error log table
CREATE TABLE delivery_errors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id     UUID REFERENCES leads(id),
  stage       TEXT,   -- 'modal_pdf' | 'resend_email'
  error       TEXT,
  retried     BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX leads_email_idx    ON leads(email);
CREATE INDEX leads_profession_idx ON leads(profession);
CREATE INDEX leads_score_idx    ON leads(total_score);
CREATE INDEX leads_created_idx  ON leads(created_at DESC);

-- Row Level Security (public writes via service role key only)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON leads
  USING (auth.role() = 'service_role');
```

---

## PostHog Analytics

### SDK Setup

```javascript
// src/main.jsx
import posthog from 'posthog-js';

posthog.init('phc_YOUR_KEY', {
  api_host: 'https://eu.posthog.com',
  capture_pageview: false,
  persistence: 'localStorage',
  autocapture: false  // manual control only
});
```

### Event Map

| Event | Where Fired | Key Properties |
|-------|-------------|----------------|
| `funnel_started` | User clicks "Find My Score" | — |
| `profession_selected` | Selector → Next | `profession`, `clientCount` |
| `section_completed` | Each section Next | `sectionId`, `sectionScore`, `sectionIndex` |
| `diagnostic_completed` | Section 6 → Compute | `totalScore`, all `sectionScores` |
| `email_gate_viewed` | Reveal stage loads | `score`, `scoreBand` |
| `email_gate_skipped` | Skip link clicked | `score`, `scoreBand` |
| `lead_submitted` | Form submit | `score`, `profession`, `hasLastName` |
| `report_generated` | CF Worker returns | `score`, `riskLevel`, `diagnosisLabel` |
| `report_delivered` | n8n → PostHog server | `score`, `profession` (server-side) |

### Anonymous → Identified Merge

This is the most important PostHog feature for your use case:

```javascript
// At page load — PostHog auto-assigns anonymous UUID
// User completes diagnostic, drops off, never submits email
// → PostHog still has their full funnel path under anonymous ID

// When they DO submit:
posthog.identify(email, {
  firstName,
  lastName,
  profession,
  clientCount,
  totalScore: calculateTotalScore()
});
// → All previous anonymous events are NOW linked to this email
// → You get the complete picture retroactively
```

**What this gives you:** You can see that "sarah@example.com" visited 3 times before converting, scored a Foundation section 3/10 on her first visit, and submitted on the third visit. Full journey, no blind spots.

---

## Frontend Changes Required (App.jsx)

### New state variables
```javascript
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [generatedReport, setGeneratedReport] = useState(null);
// email, isSubmittingEmail already exist — keep them
```

### Replace handleEmailSubmit
The mock `submitLeadToESP` call is replaced with a real `fetch()` to the Cloudflare Worker. The function:
1. Calls PostHog identify
2. POSTs to CF Worker
3. Sets `generatedReport` state from response
4. Transitions to results stage

### Results page upgrade
When `generatedReport` is set, display `generatedReport.headline` and `generatedReport.executiveSummary` at the top of results instead of the static score band description.

### Replace src/utils/esp.js
File is deprecated entirely. Replaced by inline fetch in `handleEmailSubmit`.

---

## Environment Variables Manifest

**Cloudflare Worker (set in Workers dashboard):**
```
FIREWORKS_API_KEY         = fw_xxxxxxxxxxxxx
N8N_WEBHOOK_URL           = https://n8n.yourdomain.com/webhook/kos-report
ALLOWED_ORIGIN            = https://kos-leadmagnet.vercel.app
```

**Vercel (set in project settings → Environment Variables):**
```
VITE_CF_WORKER_URL        = https://kos-api.yourname.workers.dev
VITE_POSTHOG_KEY          = phc_xxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST         = https://eu.posthog.com
```

**n8n (set as credentials):**
```
SUPABASE_URL              = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY      = eyJxxx...
RESEND_API_KEY            = re_xxxxxxxx
MODAL_PDF_URL             = https://your-org--kos-pdf-service.modal.run
POSTHOG_API_KEY           = phc_xxxxxxxx (server-side key)
```

**Modal (set via modal secrets):**
```
# No secrets needed — Modal endpoint is called from n8n
# Modal app itself has no external API calls
```

---

## Cost Breakdown

### Credits Available (already owned)
| Credit | Amount | Coverage |
|--------|--------|----------|
| Fireworks.ai | $250 | ~193,000 LLM reports |
| Modal.com | $30 | ~23,000 PDFs |
| **Total pre-paid** | **$280** | **Covers full MVP to scale** |

### Ongoing Monthly Cost (500 leads/month)
| Service | Cost |
|---------|------|
| Cloudflare Workers | **Free** (100K req/day) |
| Fireworks.ai | **~$0.65** (from credits) |
| Modal.com | **~$0.65** (from credits) |
| n8n | **Free** (self-hosted) or $20 (cloud) |
| Supabase | **Free** tier |
| Resend | **Free** tier (3K emails/month) |
| PostHog | **Free** tier (1M events/month) |
| Vercel | **Free** tier |
| **Monthly total** | **~$0 (credits) or $20 (if n8n cloud)** |

### When credits exhaust (at scale)
| Volume | Fireworks cost | Modal cost |
|--------|---------------|------------|
| 1,000 leads/month | $1.30 | $1.30 |
| 10,000 leads/month | $13 | $13 |
| 50,000 leads/month | $65 | $65 |

At 50K leads/month, your LLM + PDF costs are $130/month. That's the scale where this becomes a real business, not a cost problem.

---

## Sprint Plan — 4 Days to Production

### Day 1 — Backend Skeleton
- [ ] Create Cloudflare Worker project, deploy skeleton
- [ ] Set up Fireworks.ai account, get API key, test Llama 3.3 70B with a sample prompt
- [ ] Create Supabase project, run schema SQL
- [ ] Deploy Modal PDF service, test with sample HTML

### Day 2 — Orchestration Layer
- [ ] Set up n8n workflow (webhook → Modal → Supabase → Resend)
- [ ] Test full pipeline: hardcoded payload → PDF in inbox
- [ ] Write final LLM prompt, validate JSON output format
- [ ] Wire CF Worker → Fireworks + n8n webhook

### Day 3 — Frontend Wiring
- [ ] Install PostHog SDK, instrument all events
- [ ] Rebuild email gate (3 fields: firstName, lastName, email)
- [ ] Replace esp.js with real CF Worker fetch call
- [ ] Add `generatedReport` state, display LLM headline on results page
- [ ] Test: submit form → see LLM headline → check inbox

### Day 4 — PDF Template + Launch
- [ ] You deliver PDF design (Figma or HTML/CSS)
- [ ] I wire in `{{variables}}`, test render in Playwright
- [ ] E2E smoke test: full funnel → PDF in inbox (correct name, correct content)
- [ ] Deploy to Vercel production
- [ ] PostHog funnel dashboard setup
- [ ] Go live ✅

---

## What Is Explicitly NOT Being Built

| Excluded | Why |
|----------|-----|
| Mixpanel | PostHog covers 100% of the use case, open-source |
| Airtable | Supabase is strictly superior (SQL, RLS, Storage, real-time) |
| Dify | Unnecessary orchestration layer — Cloudflare Worker → Fireworks directly is simpler |
| HTML email | You said no. PDF only. ✅ |
| jsPDF / PDFKit | Output quality is garbage. Modal + Playwright renders pixel-perfect. |
| Separate analytics DB | PostHog + Supabase together cover all needs |

---

## How to Proceed

The build sequence above is the execution order. To start:

1. **You do first:** Design the PDF template (or describe the style and I'll generate the HTML)
2. **I do next:** Day 1 backend skeleton — Cloudflare Worker + Fireworks test
3. **Parallel:** n8n workflow skeleton, Supabase schema, Modal deployment

The PDF template is the only external dependency. Everything else I build independently and you review.

**Say "start Day 1" and I begin immediately.**
