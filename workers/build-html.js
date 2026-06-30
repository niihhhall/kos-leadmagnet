// Auto-extracted and cleaned from n8n Build PDF HTML node
export function getScoreBand(score) {
  if (score <= 20) return 'Manual & Reactive';
  if (score <= 35) return 'Fragmented Systems';
  if (score <= 45) return 'Standardized Operations';
  return 'Automated & Optimized';
}

export function buildReportHtml({ firstName, lastName, email, profession, score, sectionScores, reportJson }) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
// ─── Build HTML from report JSON + PDF template ───────────────────────────
// This node injects LLM report data into your HTML template




// Score band label
const getHtmlScoreBand = (s) => {
  if (s <= 20) return 'Fragmented Operations';
  if (s <= 35) return 'Reactive Systems';
  if (s <= 45) return 'Emerging Architecture';
  if (s <= 55) return 'Near-Operational';
  return 'Connected Operation';
};

// Risk level color
const riskColors = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed'
};
const riskColor = riskColors[reportJson.riskLevel] || '#ef4444';

// Build recommendations HTML
const recsHtml = (reportJson.recommendations || []).map((rec, i) => `
  <div class="rec-card">
    <div class="rec-priority">${rec.priority}</div>
    <div class="rec-content">
      <h3 class="rec-title">${rec.title}</h3>
      <p class="rec-why">${rec.why}</p>
      <div class="rec-action">
        <strong>Action:</strong> ${rec.action}
      </div>
      <div class="rec-time">⏱ ${rec.timeToImplement}</div>
    </div>
  </div>
`).join('');

// Build evidence points HTML
const evidenceHtml = ((reportJson.primaryDiagnosis || {}).evidencePoints || []).map(p => 
  `<li>${p}</li>`
).join('');

// Section scores rows
const scoresHtml = [
  ['Business Foundation', sectionScores.foundation],
  ['Productivity', sectionScores.productivity],
  ['Content & Social', sectionScores.content],
  ['Marketing & Pipeline', sectionScores.marketing],
  ['Client Management', sectionScores.client],
  ['Financial Visibility', sectionScores.finance],
].map(([name, val]) => {
  const pct = (val / 10) * 100;
  const color = val <= 4 ? '#ef4444' : val <= 7 ? '#f59e0b' : '#22c55e';
  return `
    <div class="score-row">
      <span class="score-label">${name}</span>
      <div class="score-bar-wrap">
        <div class="score-bar" style="width:${pct}%; background:${color}"></div>
      </div>
      <span class="score-val" style="color:${color}">${val}/10</span>
    </div>
  `;
}).join('');

// ── HTML Template ────────────────────────────────────────────────────────────
// REPLACE THIS ENTIRE STRING with your custom HTML once you have the design.
// The {{variables}} have been converted to JS template literals below.
// When you have your final HTML design, replace the body of this string.

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KineticOS Diagnostic Report — ${firstName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      color: #f5f5f0;
      width: 794px;
      min-height: 1123px;
    }

    /* ── Page Layout ── */
    .page { padding: 48px; }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 32px;
      border-bottom: 2px solid #ff751f;
      margin-bottom: 40px;
    }
    .logo { font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 700; color: #ff751f; letter-spacing: 0.05em; }
    .report-meta { text-align: right; font-size: 11px; color: #888; font-family: 'Space Mono', monospace; line-height: 1.6; }
    .report-meta strong { color: #f5f5f0; }

    /* ── Score Hero ── */
    .score-hero {
      display: flex;
      gap: 32px;
      align-items: center;
      margin-bottom: 40px;
      padding: 32px;
      background: #141414;
      border: 2px solid #2a2a2a;
      border-radius: 8px;
    }
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid #ff751f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .score-number { font-size: 40px; font-weight: 900; color: #ff751f; font-family: 'Space Mono', monospace; line-height: 1; }
    .score-denom  { font-size: 12px; color: #888; font-family: 'Space Mono', monospace; }
    .score-info h1 { font-size: 22px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
    .score-band   { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #ff751f; font-family: 'Space Mono', monospace; margin-bottom: 12px; }
    .exec-summary { font-size: 13px; line-height: 1.6; color: #ccc; }

    /* ── Risk Badge ── */
    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-family: 'Space Mono', monospace;
      border: 1px solid ${riskColor};
      color: ${riskColor};
      margin-top: 12px;
    }

    /* ── Section Scores ── */
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #ff751f;
      font-family: 'Space Mono', monospace;
      margin-bottom: 16px;
    }
    .scores-block { margin-bottom: 40px; }
    .score-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .score-label { font-size: 11px; font-weight: 600; width: 160px; flex-shrink: 0; color: #ccc; }
    .score-bar-wrap { flex: 1; height: 6px; background: #1e1e1e; border-radius: 3px; overflow: hidden; }
    .score-bar { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .score-val { font-size: 11px; font-weight: 700; font-family: 'Space Mono', monospace; width: 36px; text-align: right; }

    /* ── Diagnosis ── */
    .diagnosis-block {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-left: 3px solid #ff751f;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 40px;
    }
    .diagnosis-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #888;
      font-family: 'Space Mono', monospace;
      margin-bottom: 8px;
    }
    .diagnosis-name { font-size: 18px; font-weight: 800; color: #ff751f; margin-bottom: 12px; }
    .diagnosis-desc { font-size: 12px; line-height: 1.7; color: #ccc; margin-bottom: 16px; }
    .evidence-list { list-style: none; }
    .evidence-list li {
      font-size: 11px;
      color: #aaa;
      padding: 6px 0 6px 16px;
      border-bottom: 1px solid #1e1e1e;
      position: relative;
      line-height: 1.5;
    }
    .evidence-list li:before { content: '→'; position: absolute; left: 0; color: #ff751f; }
    .evidence-list li:last-child { border-bottom: none; }

    /* ── Recommendations ── */
    .recs-block { margin-bottom: 40px; }
    .rec-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .rec-priority {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ff751f;
      color: #0a0a0a;
      font-size: 13px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-family: 'Space Mono', monospace;
    }
    .rec-title { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .rec-why   { font-size: 11px; color: #aaa; line-height: 1.5; margin-bottom: 10px; }
    .rec-action { font-size: 11px; color: #ccc; line-height: 1.5; margin-bottom: 8px; padding: 10px; background: #0a0a0a; border-radius: 4px; }
    .rec-time  { font-size: 10px; color: #ff751f; font-family: 'Space Mono', monospace; }

    /* ── Quick Win ── */
    .quickwin-block {
      padding: 20px 24px;
      background: #0f1a0a;
      border: 1px solid #22c55e44;
      border-left: 3px solid #22c55e;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    .quickwin-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #22c55e;
      font-family: 'Space Mono', monospace;
      margin-bottom: 8px;
    }
    .quickwin-text { font-size: 12px; line-height: 1.6; color: #ccc; }

    /* ── Forward Look ── */
    .forward-block {
      padding: 20px 24px;
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      margin-bottom: 40px;
      font-style: italic;
      font-size: 12px;
      line-height: 1.7;
      color: #aaa;
    }

    /* ── Footer ── */
    .footer {
      padding-top: 24px;
      border-top: 1px solid #2a2a2a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #555;
      font-family: 'Space Mono', monospace;
    }
    .footer-brand { color: #ff751f; font-weight: 700; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="logo">KINETIC<span style="color:#f5f5f0">OS</span></div>
      <div class="report-meta">
        <strong>${firstName}${lastName ? ' ' + lastName : ''}</strong><br>
        ${profession ? profession.charAt(0).toUpperCase() + profession.slice(1) : 'Professional'}<br>
        Diagnosed: ${date}
      </div>
    </div>

    <!-- Score Hero -->
    <div class="score-hero">
      <div class="score-circle">
        <div class="score-number">${score}</div>
        <div class="score-denom">/ 60</div>
      </div>
      <div class="score-info">
        <div class="score-band">${getHtmlScoreBand(score)}</div>
        <h1>${reportJson.headline || 'Your Operational Diagnostic'}</h1>
        <p class="exec-summary">${reportJson.executiveSummary || ''}</p>
        <div class="risk-badge">⚠ Risk Level: ${reportJson.riskLevel || 'HIGH'}</div>
      </div>
    </div>

    <!-- Section Scores -->
    <div class="scores-block">
      <div class="section-title">[ Section Breakdown ]</div>
      ${scoresHtml}
    </div>

    <!-- Primary Diagnosis -->
    <div class="diagnosis-block">
      <div class="diagnosis-label">[ Primary Diagnosis ]</div>
      <div class="diagnosis-name">${(reportJson.primaryDiagnosis || {}).label || 'Disconnected Operations'}</div>
      <p class="diagnosis-desc">${(reportJson.primaryDiagnosis || {}).description || ''}</p>
      <ul class="evidence-list">${evidenceHtml}</ul>
    </div>

    <!-- Recommendations -->
    <div class="recs-block">
      <div class="section-title">[ Prioritized Recommendations ]</div>
      ${recsHtml}
    </div>

    <!-- Quick Win -->
    <div class="quickwin-block">
      <div class="quickwin-label">✓ Quick Win This Week</div>
      <p class="quickwin-text">${reportJson.quickWin || ''}</p>
    </div>

    <!-- Forward Look -->
    <div class="forward-block">
      "${reportJson.forwardLook || ''}"
    </div>

    <!-- Footer -->
    <div class="footer">
      <div><span class="footer-brand">KineticOS</span> — Operational Diagnostic Report</div>
      <div>kineticos.co</div>
    </div>

  </div>
</body>
</html>
`;




  return html;
}
