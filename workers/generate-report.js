/**
 * KineticOS Diagnostic Funnel — Cloudflare Worker
 * Routes:
 *   POST /generate-report  — LLM report generation (sync) + Inngest event publish
 *   POST /api/inngest       — Inngest orchestration callback endpoint
 *
 * Environment Variables:
 *   FIREWORKS_API_KEY        — Fireworks.ai API key
 *   ALLOWED_ORIGIN           — Vercel domain
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
 *   RESEND_API_KEY           — Resend API key
 *   INNGEST_EVENT_KEY        — Inngest event key (sde_...)
 *   INNGEST_SIGNING_KEY      — Inngest signing key (signkey-prod-...)
 */

import { buildReportHtml, getScoreBand } from './build-html.js';
import { serve } from 'inngest/cloudflare';
import { createInngestClient } from './inngest-client.js';
import { createInngestFunctions } from './inngest-functions.js';

// ─── CORS Headers ────────────────────────────────────────────────────────────
function getCorsHeaders(origin, allowedOrigin) {
  const isAllowed =
    origin === allowedOrigin ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:4173';

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildLLMPrompt({ firstName, lastName, profession, clientCount, score, sectionScores, answers }) {
  const professionLabel = {
    designer: 'Graphic / UI Designer',
    marketer: 'Marketing Consultant',
    writer: 'Freelance Writer / Editor',
    other: 'Independent Service Professional',
  }[profession] || 'Independent Service Professional';

  // Extract the most diagnostic answers for the prompt
  const keyAnswers = [
    answers.s1q1 && `Client intake process: ${answers.s1q1}`,
    answers.s1q2 && `Pricing source: ${answers.s1q2}`,
    answers.s2q1 && `Task management: ${answers.s2q1}`,
    answers.s3q1 && `Content publishing: ${answers.s3q1}`,
    answers.s4q1 && `Pipeline tracking: ${answers.s4q1}`,
    answers.s5q1 && `Client record location: ${answers.s5q1}`,
    answers.s5q4 && `Status update speed: ${answers.s5q4}`,
    answers.s6q2 && `Invoice tracking: ${answers.s6q2}`,
    answers.s6q3 && `Project profitability: ${answers.s6q3}`,
  ].filter(Boolean).join('\n- ');

  const scoreBandLabel =
    score <= 20 ? 'Fragmented Operations (0–20)' :
    score <= 35 ? 'Reactive Systems (21–35)' :
    score <= 45 ? 'Emerging Architecture (36–45)' :
    score <= 55 ? 'Near Operational (46–55)' :
    'Connected Operation (56–60)';

  return `You are a senior business operations analyst for KineticOS, a systems consulting firm for freelancers and independent service professionals.

A ${professionLabel} named ${firstName}${lastName ? ' ' + lastName : ''} has just completed a 60-point operational diagnostic assessment covering 6 areas of their business. Generate a personalized, precise, and honest operational audit report based on their responses.

IMPORTANT: Output ONLY valid JSON. No markdown, no explanation, just the JSON object.

=== DIAGNOSTIC DATA ===
Name: ${firstName}${lastName ? ' ' + lastName : ''}
Profession: ${professionLabel}
Active Clients: ${clientCount || 'Not specified'}
Total Score: ${score}/60 (${scoreBandLabel})

Section Scores (each out of 10):
- Business Foundation & Strategy: ${sectionScores.foundation}/10
- Productivity & Task Management: ${sectionScores.productivity}/10
- Content & Social Media: ${sectionScores.content}/10
- Marketing & Pipeline: ${sectionScores.marketing}/10
- Client & Project Management: ${sectionScores.client}/10
- Financial Visibility: ${sectionScores.finance}/10

Key Diagnostic Answers (A = least systematized, C = most systematized):
- ${keyAnswers}

=== REPORT REQUIREMENTS ===
Generate a JSON report with exactly this structure:
{
  "headline": "A punchy 6-10 word diagnosis title that names their core operational problem",
  "executiveSummary": "2-3 sentences addressing ${firstName} by first name. Be direct and specific about what their score pattern reveals. Reference actual section scores.",
  "primaryDiagnosis": {
    "label": "3-5 word name for their root operational pattern (e.g. 'Memory-Based Operations', 'Disconnected Tool Stack')",
    "description": "2-3 sentences explaining the root cause pattern that connects their lowest-scoring sections. Be specific to their score profile.",
    "evidencePoints": ["specific observation from their answers", "second specific observation", "third specific observation"]
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "Action-oriented title for their #1 highest-leverage fix",
      "why": "1-2 sentences explaining why this is the highest leverage point for their specific situation",
      "action": "Specific, concrete action they can take. Reference tools or systems appropriate for a ${professionLabel}.",
      "timeToImplement": "Realistic time estimate e.g. '2-3 hours'"
    },
    {
      "priority": 2,
      "title": "Second priority fix title",
      "why": "1-2 sentences",
      "action": "Specific action",
      "timeToImplement": "Time estimate"
    },
    {
      "priority": 3,
      "title": "Third priority fix title",
      "why": "1-2 sentences",
      "action": "Specific action",
      "timeToImplement": "Time estimate"
    }
  ],
  "quickWin": "One specific action ${firstName} can take THIS WEEK that will have immediate visible impact. Should take under 60 minutes.",
  "forwardLook": "1-2 sentences describing what their business looks and feels like 90 days after fixing their primary gap. Be concrete and aspirational.",
  "riskLevel": "LOW or MEDIUM or HIGH or CRITICAL",
  "scoreInterpretation": "1 sentence explaining what ${score}/60 means in practical terms for their business right now."
}`;
}

// ─── Fallback Report (if LLM fails) ──────────────────────────────────────────
function buildFallbackReport({ firstName, score, sectionScores }) {
  const lowest = Object.entries(sectionScores).sort((a, b) => a[1] - b[1])[0];
  const lowestName = {
    foundation: 'Business Foundation',
    productivity: 'Productivity',
    content: 'Content',
    marketing: 'Marketing Pipeline',
    client: 'Client Management',
    finance: 'Financial Visibility',
  }[lowest[0]] || 'Operations';

  return {
    headline: `${lowestName} Is Your Highest-Leverage Gap`,
    executiveSummary: `${firstName}, your score of ${score}/60 reveals a business that has grown faster than the systems supporting it. Your ${lowestName} section (${lowest[1]}/10) is the primary area pulling your overall operational score down.`,
    primaryDiagnosis: {
      label: 'Disconnected Operations',
      description: `Your business systems are not speaking to each other. Information that should flow automatically between your ${lowestName} and client delivery layers is being bridged manually — by you, every day.`,
      evidencePoints: [
        `${lowestName} scored ${lowest[1]}/10 — your lowest section`,
        `Total score of ${score}/60 indicates systemic gaps rather than isolated issues`,
        'Multiple sections below 5/10 suggest a foundational architecture problem',
      ],
    },
    recommendations: [
      {
        priority: 1,
        title: `Fix Your ${lowestName} Foundation First`,
        why: `At ${lowest[1]}/10, ${lowestName} has the highest headroom and the most downstream dependencies. Fixing it unblocks everything else.`,
        action: `Audit your current ${lowestName} process this week. Document every manual step you take. Each manual step is a candidate for systematization.`,
        timeToImplement: '3-4 hours',
      },
      {
        priority: 2,
        title: 'Connect Your Client Records to Your Invoicing',
        why: 'Disconnected client files and invoice tracking is the most common cash flow leak for service professionals.',
        action: 'Build or buy a single client record system where tasks, files, and invoice status live in the same place.',
        timeToImplement: '4-6 hours',
      },
      {
        priority: 3,
        title: 'Document Your Service Packages',
        why: 'Without locked service tiers, every project starts from scratch — consuming proposal time and compressing your margins.',
        action: 'Define 3 service packages with fixed scope, fixed pricing, and a one-page description you can send without editing.',
        timeToImplement: '2-3 hours',
      },
    ],
    quickWin: `This week: pick your single lowest-scoring section and write down every manual process you do within it. This awareness audit alone will show you where to start.`,
    forwardLook: `In 90 days with a connected operational system, ${firstName}, you will spend 6+ fewer hours per week on administrative overhead — hours that go back into billable work or rest.`,
    riskLevel: score <= 20 ? 'CRITICAL' : score <= 35 ? 'HIGH' : score <= 45 ? 'MEDIUM' : 'LOW',
    scoreInterpretation: `A score of ${score}/60 means your business is operational but running significantly on manual effort and memory rather than documented, repeatable systems.`,
  };
}

// ─── Direct Background Orchestration Pipeline ─────────────────────────────────
async function processLeadPipeline(env, payload) {
  const { firstName, lastName, email, profession, clientCount, score, sectionScores, reportData } = payload;
  const scoreBand = getScoreBand(score);

  // 1. Save Lead to Supabase
  let leadId = null;
  try {
    const supabaseUrl = 'https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/leads';
    const supabaseResponse = await fetch(supabaseUrl, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName || null,
        email: email,
        profession: profession,
        client_count: clientCount,
        total_score: score,
        score_band: scoreBand,
        foundation_score: sectionScores.foundation,
        productivity_score: sectionScores.productivity,
        content_score: sectionScores.content,
        marketing_score: sectionScores.marketing,
        client_score: sectionScores.client,
        finance_score: sectionScores.finance,
        report_json: reportData,
        email_sent: false
      })
    });
    
    if (supabaseResponse.ok) {
      const insertedRows = await supabaseResponse.json();
      if (insertedRows && insertedRows.length > 0) {
        leadId = insertedRows[0].id;
        console.log(`Saved lead to Supabase. ID: ${leadId}`);
      }
    } else {
      const errText = await supabaseResponse.text();
      console.error('Failed to save lead to Supabase:', errText);
    }
  } catch (err) {
    console.error('Supabase error:', err.message);
  }

  // 2. Generate PDF using Modal
  let pdfBase64 = null;
  try {
    const html = buildReportHtml({ firstName, lastName, email, profession, score, sectionScores, reportJson: reportData });
    const modalUrl = 'https://markeye--kos-pdf-endpoint.modal.run';
    const modalResponse = await fetch(modalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ html })
    });
    
    if (modalResponse.ok) {
      const modalData = await modalResponse.json();
      if (modalData && modalData.success) {
        pdfBase64 = modalData.pdf_base64;
        console.log(`Generated PDF from Modal. Size: ${modalData.size_bytes} bytes`);
      }
    } else {
      const errText = await modalResponse.text();
      console.error('Failed to generate PDF from Modal:', errText);
    }
  } catch (err) {
    console.error('Modal PDF error:', err.message);
  }

  // 3. Send Email via Resend
  let emailSent = false;
  if (pdfBase64 && env.RESEND_API_KEY) {
    try {
      const resendUrl = 'https://api.resend.com/emails';
      const resendResponse = await fetch(resendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.RESEND_SENDER_EMAIL || 'KineticOS <onboarding@resend.dev>',
          to: [email],
          subject: 'Your KineticOS Business Diagnostic Report',
          html: `<p>Hi ${firstName},</p><p>Thank you for completing the KineticOS Business Diagnostic.</p><p>Please find your customized diagnostic report attached to this email.</p><p>Best regards,<br>The KineticOS Team</p>`,
          attachments: [
            {
              filename: 'KineticOS_Diagnostic_Report.pdf',
              content: pdfBase64
            }
          ]
        })
      });
      
      if (resendResponse.ok) {
        emailSent = true;
        console.log(`Emailed report to ${email} via Resend.`);
      } else {
        const errText = await resendResponse.text();
        console.error('Failed to send email via Resend:', errText);
      }
    } catch (err) {
      console.error('Resend error:', err.message);
    }
  }

  // 4. Update Supabase with Email Sent Status
  if (leadId && emailSent) {
    try {
      const updateUrl = `https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/leads?id=eq.${leadId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
      });
      if (updateResponse.ok) {
        console.log(`Updated email_sent status for lead ID: ${leadId}`);
      } else {
        const errText = await updateResponse.text();
        console.error('Failed to update email_sent status in Supabase:', errText);
      }
    } catch (err) {
      console.error('Failed to update Supabase status:', err.message);
    }
  }
}

// ─── Main Diagnostic Handler (named, not exported) ──────────────────────────
const mainHandler = {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGIN || '*');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Diagnostic endpoint to check Fireworks models
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/list-models') {
      try {
        const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${env.FIREWORKS_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return new Response(JSON.stringify({ status: response.status, data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    // ── Parse + Validate Input ─────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { firstName, lastName, email, profession, clientCount, score, sectionScores, answers } = body;

    if (!firstName || !email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'firstName and valid email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build LLM Prompt ───────────────────────────────────────────────────
    const prompt = buildLLMPrompt({ firstName, lastName, profession, clientCount, score, sectionScores, answers: answers || {} });

    // ── Call Fireworks.ai ──────────────────────────────────────────────────
    let reportData;
    try {
      const llmResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FIREWORKS_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/deepseek-v4-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a senior business operations analyst. Output strictly valid JSON conforming to the requested schema. No conversational text, no markdown code blocks, no thoughts, just the raw JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1800,
          temperature: 0.72,
        }),
      });

      if (!llmResponse.ok) {
        throw new Error(`Fireworks API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      const rawContent = llmData.choices?.[0]?.message?.content;

      if (!rawContent) throw new Error('No content in LLM response');

      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
      }
      reportData = JSON.parse(cleanContent);

    } catch (err) {
      // Fallback to rule-based report — user always gets a result
      console.error('LLM failed, using fallback:', err.message);
      reportData = buildFallbackReport({ firstName, score, sectionScores });
    }

    // ── Publish event to Inngest (non-blocking, replaces ctx.waitUntil) ─────
    const inngest = createInngestClient(env);
    const inngestSend = inngest.send({
      name: 'diagnostic/submitted',
      data: {
        firstName,
        lastName,
        email,
        profession,
        clientCount,
        score,
        sectionScores,
        reportData,
        answers: answers || {},
      },
    });
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(inngestSend);
    } else {
      inngestSend.catch((err) => console.error('[Inngest] send failed:', err.message));
    }

    // ── Return Report JSON to Browser ──────────────────────────────────────
    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  },
};

// routes in a unified fetch handler below.
const workerHandler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route Inngest callbacks to the serve() handler
    if (url.pathname === '/api/inngest') {
      const inngest = createInngestClient(env);
      const functions = createInngestFunctions(inngest, env);
      const inngestHandler = serve({
        client: inngest,
        functions,
        signingKey: env.INNGEST_SIGNING_KEY,
      });
      return inngestHandler(request, env, ctx);
    }

    // All other routes go to the main diagnostic handler
    return mainHandler.fetch(request, env, ctx);
  },
};

export default workerHandler;
