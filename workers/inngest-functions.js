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
      const { email } = event.data;
      console.log(`[Inngest] Event received for ${email}. Pipeline processing is bypassed (now handled directly by worker).`);
      return { success: true, bypassed: true };
    }
  );

  return [processDiagnostic];
}
