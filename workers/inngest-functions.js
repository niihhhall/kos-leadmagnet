/**
 * KineticOS — Inngest Background Functions
 *
 * Triggered by: "diagnostic/submitted"
 * Steps (each isolated + auto-retried independently):
 *   1. save-to-supabase  — INSERT lead row, return leadId
 *   2. generate-pdf      — Call Modal Chromium service, return pdfBase64
 *   3. send-email        — Call Resend with PDF attachment
 *   4. update-db-status  — PATCH email_sent = true in Supabase
 */

import { buildReportHtml, getScoreBand } from './build-html.js';

async function getLatestLeadId(env, email) {
  try {
    const supabaseUrl = `https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/leads?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`;
    const res = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) {
        return rows[0].id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch latest lead ID from Supabase:', err.message);
  }
  return null;
}

export function createInngestFunctions(inngest, env) {
  const processDiagnostic = inngest.createFunction(
    {
      id: 'process-diagnostic',
      name: 'Process Diagnostic Report Pipeline',
      retries: 3,
      onFailure: async ({ error, event, step }) => {
        const origEvent = event.data.event;
        const origData = origEvent?.data || {};
        const { email } = origData;

        let stage = 'unknown';
        const errMsg = error.message || '';
        if (errMsg.includes('Supabase insert failed')) {
          stage = 'database_save';
        } else if (errMsg.includes('PDF') || errMsg.includes('Modal')) {
          stage = 'modal_pdf';
        } else if (errMsg.includes('Resend') || errMsg.includes('email')) {
          stage = 'resend_email';
        } else if (errMsg.includes('PATCH') || errMsg.includes('email_sent')) {
          stage = 'database_update';
        }

        await step.run('log-error-to-supabase', async () => {
          if (!env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Inngest Failure Handler] SUPABASE_SERVICE_ROLE_KEY not set');
            return;
          }

          let leadId = null;
          if (email) {
            leadId = await getLatestLeadId(env, email);
          }

          const supabaseUrl = 'https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/delivery_errors';
          const res = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
              'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lead_id: leadId,
              stage,
              error: errMsg,
              payload: origData,
              retried: true,
              resolved: false,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to log error to Supabase: ${errText}`);
          }
          console.log(`[Inngest Failure Handler] Logged delivery error to Supabase for email: ${email}`);
        });
      },
    },
    { event: 'diagnostic/submitted' },
    async ({ event, step }) => {
      const {
        firstName, lastName, email, profession,
        clientCount, score, sectionScores, reportData,
      } = event.data;

      // ── Step 1: Save Lead to Supabase ─────────────────────────────────────
      const leadId = await step.run('save-to-supabase', async () => {
        const scoreBand = getScoreBand(score);
        const supabaseUrl = 'https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/leads';
        const res = await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName || null,
            email,
            profession,
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
            email_sent: false,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Supabase insert failed: ${errText}`);
        }

        const rows = await res.json();
        if (!rows || rows.length === 0) throw new Error('Supabase returned no row');
        console.log(`[Inngest] Saved lead to Supabase. ID: ${rows[0].id}`);
        return rows[0].id;
      });

      // ── Step 2: Generate PDF via Modal ────────────────────────────────────
      const pdfBase64 = await step.run('generate-pdf', async () => {
        const html = buildReportHtml({
          firstName, lastName, email, profession,
          score, sectionScores, reportJson: reportData,
        });

        const res = await fetch('https://markeye--kos-pdf-endpoint.modal.run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Modal PDF generation failed: ${errText}`);
        }

        const data = await res.json();
        if (!data.success || !data.pdf_base64) {
          throw new Error('Modal returned no PDF data');
        }
        console.log(`[Inngest] Generated PDF. Size: ${data.size_bytes} bytes`);
        return data.pdf_base64;
      });

      // ── Step 3: Send Email via Resend ─────────────────────────────────────
      await step.run('send-email', async () => {
        if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.RESEND_SENDER_EMAIL || 'KineticOS <onboarding@resend.dev>',
            to: [email],
            subject: 'Your KineticOS Business Diagnostic Report',
            html: `<p>Hi ${firstName},</p><p>Thank you for completing the KineticOS Business Diagnostic.</p><p>Please find your customized diagnostic report attached to this email.</p><p>Best regards,<br>The KineticOS Team</p>`,
            attachments: [
              {
                filename: 'KineticOS_Diagnostic_Report.pdf',
                content: pdfBase64,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Resend email failed: ${errText}`);
        }
        console.log(`[Inngest] Emailed report to ${email} via Resend.`);
      });

      // ── Step 4: Update Supabase email_sent status ─────────────────────────
      await step.run('update-db-status', async () => {
        const updateUrl = `https://ddvqrhzcdiezobflrbsq.supabase.co/rest/v1/leads?id=eq.${leadId}`;
        const res = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY.trim(),
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Supabase PATCH failed: ${errText}`);
        }
        console.log(`[Inngest] Updated email_sent for lead ID: ${leadId}`);
      });

      return { leadId, emailSent: true };
    }
  );

  return [processDiagnostic];
}
