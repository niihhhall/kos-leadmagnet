// Auto-extracted and cleaned from n8n Build PDF HTML node

export function getScoreBand(score) {
  if (score <= 20) {
    return { 
      name: 'Reactive Operation', 
      description: 'Your business runs entirely on memory and improvisation. No architecture exists yet. Adding a new client creates immediate overwhelm, and you are carrying the cognitive load of all unresolved details in your head. Every gap between systems is a gap you fill by hand.' 
    };
  }
  if (score <= 30) {
    return { 
      name: 'Partial Infrastructure', 
      description: 'You have several tools in place, but they act as separate silos rather than a connected system. You are responding to events as they happen rather than directing them. You spend significant time switching between tabs and reconstructing context, leaving you one busy week away from details slipping through the cracks.' 
    };
  }
  if (score <= 45) {
    return { 
      name: 'Emerging Architecture', 
      description: 'You are actively trying to systematize your operations, and some areas are functional. However, key connections are still missing or inconsistent, preventing you from reaching a stable, repeatable operating rhythm.' 
    };
  }
  if (score <= 55) {
    return { 
      name: 'Near Operational', 
      description: 'You have built functional setups across multiple areas of your business. Despite this progress, they still don\'t talk to each other. Your business can grow, but your admin overhead grows with it, locking you in a capacity ceiling where you are the bottleneck.' 
    };
  }
  return { 
    name: 'Connected Operation', 
    description: 'Your business is supported by a fully connected, relational system. Every client record holds its files, tasks, invoices, and notes. Profit margins are visible, client onboarding is standardized, and the business could survive your absence. Your operational standards match your premium rates.' 
  };
}

export function buildReportHtml({ firstName, lastName, email, profession, score, sectionScores, reportJson, answers }) {
  const safeAnswers = answers || {};
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const professionLabel = {
    designer: 'Freelance Designer',
    marketer: 'Freelance Marketer',
    writer: 'Freelance Writer',
    other: 'Independent Professional',
  }[profession] || 'Independent Professional';

  // ─── Replicated Core Calculations ──────────────────────────────────────────

  // 1. Sections list
  const sectionsList = [
    { id: 'foundation', name: 'Business Foundation & Strategy', description: 'Predefined packages, locked revision counts, onboarding pipeline' },
    { id: 'productivity', name: 'Productivity & Task Management', description: 'Unified task lists, design tickets, prioritized execution flow' },
    { id: 'content', name: 'Content & Social Media', description: 'Centralized content calendar, pre-planned visual case studies' },
    { id: 'marketing', name: 'Marketing & Pipeline', description: 'Lead pipeline tracking, proposal follow-up cadences' },
    { id: 'client', name: 'Client & Project Management', description: 'Relational project hubs, client-facing dashboards, onboarding portals' },
    { id: 'finance', name: 'Financial Visibility', description: 'Invoicing controls, per-project profitability, routing tax reserves' }
  ];

  // 2. Score Band details
  const scoreBandInfo = getScoreBand(score);

  // 3. Section status helper
  const getScoreStatus = (val) => {
    if (val <= 4.0) return { text: "Critical Gap", class: "critical" };
    if (val <= 7.0) return { text: "Needs Attention", class: "warning" };
    return { text: "Systematized", class: "healthy" };
  };

  // 4. Composites
  const mindAsOsQs = ['s2q1', 's2q2', 's2q3', 's2q4', 's2q5', 's5q1', 's5q3_5'];
  const mindAsOsCount = mindAsOsQs.reduce((count, id) => {
    return count + (safeAnswers[id] === 'A' ? 1 : 0);
  }, 0);
  const financialIntelligence = sectionScores.finance;
  const attribQs = ['s3q3', 's3q4', 's4q3', 's4q4'];
  const attributionCapability = attribQs.reduce((sum, id) => {
    const val = safeAnswers[id];
    return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
  }, 0);
  const relQs1 = ['s5q1', 's5q3_5', 's5q6'];
  const relQs2 = ['s5q2b', 's5q4'];
  const relSum1 = relQs1.reduce((sum, id) => {
    const val = safeAnswers[id];
    return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
  }, 0);
  const relSum2 = relQs2.reduce((sum, id) => {
    const val = safeAnswers[id];
    return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
  }, 0);
  const ociClient = (safeAnswers['s5q5'] || []).length;
  const relationalArchRaw = relSum1 + relSum2 + (ociClient / 6 * 4);
  const relationalArchScaled = parseFloat((relationalArchRaw * (10 / 14)).toFixed(1));
  const ociTotal = (safeAnswers['s5q5'] || []).length + (safeAnswers['s6q5'] || []).length;
  const aiReadiness = (ociTotal / 12 * 5) + (attributionCapability / 8 * 3) + (financialIntelligence / 10 * 2);
  const riskScore = (mindAsOsCount / 7 * 3) + ((10 - financialIntelligence) / 10 * 4) + ((10 - relationalArchScaled) / 10 * 3);
  const crgmScore = safeAnswers['s5q2a'] || 1;

  const composites = {
    mindAsOs: mindAsOsCount,
    financialIntelligence,
    attributionCapability,
    relationalArchRaw,
    relationalArchScaled,
    ociTotal,
    aiReadiness: parseFloat(aiReadiness.toFixed(1)),
    riskScore: parseFloat(riskScore.toFixed(1)),
    crgmScore
  };

  // 5. Lowest & Highest sections
  const lowestSections = [...sectionsList]
    .map(s => ({ id: s.id, name: s.name, score: sectionScores[s.id] || 0 }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return sectionsList.findIndex(s => s.id === a.id) - sectionsList.findIndex(s => s.id === b.id);
    })
    .slice(0, 2);

  const highestSection = [...sectionsList]
    .map(s => ({ id: s.id, name: s.name, score: sectionScores[s.id] || 0 }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return sectionsList.findIndex(s => s.id === a.id) - sectionsList.findIndex(s => s.id === b.id);
    })[0];

  // 6. Leverage Analysis
  const leverageWeights = { foundation: 4, client: 3, content: 2, marketing: 2, productivity: 1, finance: 1 };
  const sectionLeverages = sectionsList.map(s => {
    const score = sectionScores[s.id] || 0;
    const weight = leverageWeights[s.id] || 1;
    const headroom = 10 - score;
    return {
      id: s.id,
      name: s.name,
      score,
      leverageScore: headroom * weight,
      weight
    };
  });
  const leverageAnalysis = sectionLeverages.sort((a, b) => b.leverageScore - a.leverageScore)[0];

  // 7. Contradictions List
  const contradictions = [];
  if (safeAnswers.s5q6 === 'C' && safeAnswers.s5q1 === 'A') {
    contradictions.push({
      title: 'Aspirational Record vs. Email Reality',
      description: 'You indicated that you have a connected client record page (S5Q6=C), but also stated that client records primarily live in email threads (S5Q1=A). This suggests the connected record exists as an aspiration rather than a daily reality.',
      evidence: 'S5Q6 = "C" vs. S5Q1 = "A"'
    });
  }
  if (safeAnswers.s5q4 === 'A' && safeAnswers.s6q2 === 'A') {
    contradictions.push({
      title: 'Instant Status vs. Memory-Based Invoicing',
      description: 'You indicated that you can produce a full project rundown in minutes (S5Q4=A), but also that you track outstanding invoices from memory (S6Q2=A). A complete rundown requires current payment status, which cannot be reliably pulled from memory.',
      evidence: 'S5Q4 = "A" vs. S6Q2 = "A"'
    });
  }
  if (crgmScore >= 4 && (safeAnswers.s5q1 === 'A' || safeAnswers.s5q1 === 'B')) {
    contradictions.push({
      title: 'High Confidence vs. Scattered Workspace',
      description: 'You feel highly confident in giving a status update in 10 minutes (S5Q2a>=4), yet your client records are scattered in email threads or separate files (S5Q1=A/B). Your update speed comes from temporary cognitive effort, not workspace infrastructure.',
      evidence: `S5Q2a = ${crgmScore}/5 vs. S5Q1 = "${safeAnswers.s5q1}"`
    });
  }
  if (safeAnswers.s2q1 === 'C' && composites.ociTotal <= 2 && safeAnswers.s5q1 === 'B') {
    contradictions.push({
      title: 'Central Task System vs. Disconnected Client Info',
      description: 'You use a central task manager (S2Q1=C), yet you have fewer than 2 client record components in one place (S5Q5<=2) and your records are scattered (S5Q1=B). Your task manager is disconnected from client context.',
      evidence: `S2Q1 = "C" vs. S5Q5 = ${(safeAnswers.s5q5 || []).length}/6 vs. S5Q1 = "B"`
    });
  }
  if (crgmScore >= 4 && (safeAnswers.s5q1 === 'B' || safeAnswers.s5q4 === 'B')) {
    contradictions.push({
      title: 'Perceived Update Speed vs. Structural Delay',
      description: 'You report high confidence in status updates (S5Q2a>=4), but also note that project records are scattered (S5Q1=B) and/or that updates take 10-15 minutes (S5Q4=B).',
      evidence: `S5Q2a = ${crgmScore}/5 vs. S5Q1 = "${safeAnswers.s5q1}" and S5Q4 = "${safeAnswers.s5q4}"`
    });
  }

  // 8. Blind Spots
  const blindSpots = [];
  if (composites.crgmScore >= 4 && safeAnswers.s5q1 !== 'C') {
    blindSpots.push({
      id: 'BLIND_SPOT_SOLO_HUBRIS',
      title: 'Solo Hubris (Confidence/Infrastructure Gap)',
      description: 'You have high confidence in your ability to retrieve status updates quickly, but lack the structural records to back it up. Your business relies on your personal working memory, creating a critical single point of failure.',
      remedy: 'Build a unified client project record so records maintain themselves relationally, rather than requiring you to pull status details from memory.',
      showChart: true
    });
  }
  if (safeAnswers.s2q1 === 'C' && composites.ociTotal <= 5) {
    blindSpots.push({
      id: 'BLIND_SPOT_SHADOW_SYSTEM',
      title: 'Shadow System (Task/Record Disconnection)',
      description: 'You have invested time in building or using a task manager (high Productivity focus), but it is disconnected from your client project records and financial status. You are maintaining a personal workflow silo rather than business infrastructure.',
      remedy: 'Link task lists directly to client project cards and scopes of work, so task tracking updates client records automatically.'
    });
  }
  if (sectionScores.foundation >= 7 && ((sectionScores.client || 0) <= 4 || (sectionScores.finance || 0) <= 4)) {
    blindSpots.push({
      id: 'BLIND_SPOT_DOCUMENTED_FOUNDATION',
      title: 'Documented Foundation (Positioning/Execution Mismatch)',
      description: 'Your business foundation (strategy and positioning) is emerging or operational, but your client delivery and financial controls are dragging behind. You are winning premium clients but executing with amateur backend mechanics.',
      remedy: 'Standardize client intake pipelines and establish per-project profitability tracking so that your back-office matches your premium front-end positioning.'
    });
  }
  if (composites.mindAsOs >= 4) {
    blindSpots.push({
      id: 'BLIND_SPOT_MANUAL_BRIDGE',
      title: 'The Manual Bridge (Mind-as-OS)',
      description: 'You are operating as the connective tissue of your business. Communication, tasks, invoices, and deliverables are bridged by your working memory rather than automated or relational databases. This is the primary driver of operational fatigue.',
      remedy: 'Build a relational client project hub to automatically associate deliverables with files, tasks, and billing status, removing yourself as the manual linker.'
    });
  }

  // 9. Prior Failure Wedge
  const getPriorFailureWedge = () => {
    const priorSignal = safeAnswers.s5q6_5;
    const textReason = safeAnswers.s5q6_5_text || '';

    if (priorSignal === 'A') {
      return {
        title: 'The Maintenance Trap (Failed Attempt)',
        text: `You mentioned you've tried organizing your workspace before, but it stopped working after a few weeks. This is not a personal failure. It is a structural one. Most templates require constant manual maintenance to keep up-to-date. If a system requires a fresh hour of your evening to update task statuses, it competes with your rest. It will always lose. The solution is building relational databases where daily work (e.g. checking off a task) automatically updates client status and invoices without separate data entry.`,
        reason: textReason ? `You noted: "${textReason}"` : null
      };
    } else if (priorSignal === 'B') {
      return {
        title: 'The Builder Paradox (Started & Stopped)',
        text: `You indicated you've started building client and project trackers before but never finished them. Building operations from scratch is a massive task, typically requiring 40 to 80 hours of design, testing, and debugging. When you are busy delivering client work, you cannot afford that time, so the build gets abandoned. A pre-built, relational workspace blueprint removes this friction entirely, letting you launch in a few hours instead of weeks.`,
        reason: textReason ? `You noted: "${textReason}"` : null
      };
    } else {
      return {
        title: 'Relational Workspace (New Territory)',
        text: `This kind of connected operational record is new territory for you. Right now, your business exists in your head and your email threads. A relational system represents a shift from cognitive maintenance to structural maintenance: the system maintains itself through your daily work (checking off tasks, logging hours, uploading assets). The immediate result is a dramatic drop in background cognitive load.`,
        reason: null
      };
    }
  };
  const priorFailureWedge = getPriorFailureWedge();

  // 10. Causal copy & Pattern Paragraph
  const causalConnections = {
    "foundation-client": "Without documented service packages, every client engagement is improvised from scratch. You cannot build a repeatable project command center when the deliverables themselves are a moving target.",
    "foundation-finance": "Without defined pricing architecture, your financial visibility remains retrospective rather than predictive. You are forced to react to past bank balances rather than forecasting project profitability.",
    "foundation-marketing": "Without a documented ICP, your content and outreach cannot target high-value clients. You waste time creating generic content that fails to feed a qualified pipeline.",
    "client-finance": "Without a connected project record, invoice status lives separately from deliverable status. You delay billing because compiling deliverables feels like a chore, creating unnecessary cash flow gaps.",
    "client-productivity": "Without a project record that houses all tasks, task management is detached from client context. You spend your day jumping between email and notes to figure out what actually needs to be delivered.",
    "content-marketing": "Without tracing content to client lead sources, you cannot know which self-promotional activities generate revenue. You treat content as a cost to be paid rather than an asset that builds your pipeline.",
    "marketing-foundation": "Without a structured acquisition pipeline, your business depends entirely on word-of-mouth that you cannot scale. You cannot project capacity because you cannot predict when the next client will arrive."
  };
  const getCausalCopy = (section1, section2) => {
    const key1 = `${section1}-${section2}`;
    const key2 = `${section2}-${section1}`;
    return causalConnections[key1] || causalConnections[key2] || null;
  };
  const generatePatternParagraph = () => {
    if (lowestSections.length < 2) {
      return "Your business operations are functional, but you are still operating in silos. Without a unified system, you spend unnecessary time switching between tools and manually connecting the dots.";
    }
    const s1 = lowestSections[0];
    const s2 = lowestSections[1];
    const causalCopy = getCausalCopy(s1.id, s2.id);
    if (causalCopy) {
      return `Your two lowest sections - ${s1.name} and ${s2.name} - are not separate failures. They are the same failure at two different surfaces. ${causalCopy} The root is one gap, not two: your business lacks a connected, relational workspace where these functions share a single data layer. Patching each tool separately will not resolve this.`;
    }
    return `Your lowest-scoring sections - ${s1.name} and ${s2.name} - are causing significant drag on your operations. Because these areas are disconnected, information gets lost in transition, requiring you to manually rebuild context and bridge the gaps between tools. The root cause is a lack of connected, relational architecture in your workspace.`;
  };
  const patternParagraph = generatePatternParagraph();

  // 11. Recommendations builder
  const getRecommendations = () => {
    const list = [];
    const recCatalog = {
      foundation: {
        title: 'Lock Standardized Service Packages & Qualification Intake',
        addresses: 'Business Foundation & Strategy',
        revealed: `You indicated that pricing is defined in conversation (S1Q2=${safeAnswers.s1q2 || 'A'}) and proposal building takes significant time (S1Q3=${safeAnswers.s1q3 || 'A'}).`,
        why: 'Pricing and scoping case-by-case creates a massive upstream bottleneck. It forces you to write custom proposals and makes it impossible to automate onboarding or calculate baseline project profitability.',
        what: {
          designer: 'Document 3 standardized design service tiers (e.g., Brand Identity, UI Package, retainer) with locked scopes and Figma assets. Create a Typeform intake form to filter leads before booking calls.',
          marketer: 'Establish 3 predefined campaign and audit retainer packages with explicit channel boundaries. Build a brief intake qualifying form to eliminate low-budget leads early.',
          writer: 'Standardize retainer editing and content bundles with fixed word counts. Use a simple qualification page to automate intake requirements before proposals.',
          general: 'Define 3 standardized productized service packages with locked scopes. Create a repeatable, pre-call intake form to qualify client budgets and requirements.'
        }
      },
      productivity: {
        title: 'Establish a Unified Task & Execution Command Center',
        addresses: 'Productivity & Task Management',
        revealed: `You indicated that tasks go into a mental queue (S2Q1=${safeAnswers.s2q1 || 'A'}) and you switch between multiple tabs to reconstruct context (S2Q3=${safeAnswers.s2q3 || 'A'}).`,
        why: 'Relying on mental bandwidth to track daily priorities drains your creative energy. Detaching task execution from the client project record creates context-switching delay and leads to missed deadlines.',
        what: {
          designer: 'Build a single task database in Notion. Link design tickets directly to project cards and Figma workboards. Limit your daily active queue to 3 priority items.',
          marketer: 'Build a unified campaign execution board. Link analytics tracking, asset collection, and copy approvals to campaign cards so everything is accessible in one view.',
          writer: 'Establish a central drafting queue. Group writing tasks by research, draft, and client review stages. Link reference folders and client edits to each content card.',
          general: 'Build a central dashboard in Notion. Create a relation between tasks and active projects so that checking off a task automatically updates the project milestone status.'
        }
      },
      content: {
        title: 'Build a Centralized 14-Day Content and Topic Pipeline',
        addresses: 'Content & Social Media',
        revealed: `You indicated that you publish reactively (S3Q1=${safeAnswers.s3q1 || 'A'}) and store files in disconnected folders (S3Q4=${safeAnswers.s3q4 || 'A'}).`,
        why: 'Publishing reactively makes self-promotion feel like an emergency. Maintaining a content calendar in a separate silo means writing is detached from your actual service availability.',
        what: {
          designer: 'Create a Notion portfolio asset vault. Set up a content calendar where design case studies and visual tips are scheduled 14 days out, mapped to your booking calendar.',
          marketer: 'Establish a centralized topic cluster board. Schedule marketing teardowns and operational insights 14 days in advance, directly promoting your retainer packages.',
          writer: 'Set up an editorial dashboard. Maintain a rolling bank of 10 newsletter ideas and pre-schedule social insights, linking posts to active service retaking slots.',
          general: 'Build a centralized content library. Schedule self-promotions and business lessons in advance, ensuring your publishing volume remains steady during busy client weeks.'
        }
      },
      marketing: {
        title: 'Implement a CRM Pipeline and Standardized Follow-up Cadence',
        addresses: 'Marketing & Pipeline',
        revealed: `You indicated that pipeline tracking lives in memory or email (S4Q1=${safeAnswers.s4q1 || 'A'}) and proposal follow-up is case-by-case (S4Q3=${safeAnswers.s4q3 || 'A'}).`,
        why: 'A memory-based pipeline creates the "feast-or-famine" cycle. When you are busy delivering client work, sales drop off because you lack a visible pipeline reminding you to follow up.',
        what: {
          designer: 'Set up a visual Kanban board for your design pipeline. Establish a strict rule: follow up on sent proposals at 3, 7, and 14 days. Never let a design lead fade out.',
          marketer: 'Build a brand pipeline tracker. Standardize proposal follow-up emails, and track every brand inquiry stage from first touch to signed contract.',
          writer: 'Implement a retainer lead pipeline. Maintain active contacts and schedule pitches in advance, using predefined templates for follow-up emails.',
          general: 'Create a simple CRM board. Track leads from qualification to negotiation, and automate follow-up reminders to protect your closing rate.'
        }
      },
      client: {
        title: 'Build a Connected Client Project Hub (Relational Workspace)',
        addresses: 'Client & Project Management',
        revealed: `You indicated that project records live in email threads (S5Q1=${safeAnswers.s5q1 || 'A'}) and compiling status updates takes time (S5Q4=${safeAnswers.s5q4 || 'A'}).`,
        why: 'Using email threads as client records is the most expensive operational gap. It forces you to act as the manual link between briefs, deliverables, and invoices, producing constant cognitive drag.',
        what: {
          designer: 'Build one record template per client. In this record, embed project briefs, Figma workspace links, revision trackers, task databases, and invoice statuses. Share a clean client-facing dashboard.',
          marketer: 'Build a client hub that links campaign briefs, active ad account tasks, report links, and billing histories. Give clients a view-only link to review live campaign status.',
          writer: 'Create a writer dashboard for each client. Link content briefs, draft links, edit requests, and billing records in one card. Share this card with the client to eliminate draft-tracking emails.',
          general: 'Establish a relational client portal. Connect active deliverable lists, invoice statuses, call notes, and assets in one master Notion database so client info updates in real-time.'
        }
      },
      finance: {
        title: 'Establish Daily Billing Controls and Margin Tracking',
        addresses: 'Financial Visibility',
        revealed: `You indicated that you track invoices from memory (S6Q2=${safeAnswers.s6q2 || 'A'}) and per-project profitability is not calculated (S6Q3=${safeAnswers.s6q3 || 'A'}).`,
        why: 'Tracking financials from memory creates cash flow risks and lets unprofitable projects drain your margins. You cannot build a healthy business if you cannot verify which clients are profitable.',
        what: {
          designer: 'Build an invoice log linked to client projects. Automatically deduct estimated taxes (e.g., 25-30%) into a routing reserve. Calculate project margins based on creative hours spent vs project fees.',
          marketer: 'Link client retainer accounts to monthly invoicing cards. Log tracking expenses and hourly metrics to calculate the true margin on each client retainer.',
          writer: 'Set up a client billing dashboard. Track project-by-project margins based on writing time spent, and automate monthly recurring retainer billing.',
          general: 'Establish a central finance tracker. View revenue history, outstanding invoices, and projected pipeline in one dashboard. Track margins to avoid taking unprofitable projects.'
        }
      }
    };

    const ranked = sectionsList
      .map(s => {
        const score = sectionScores[s.id] || 0;
        const weight = leverageWeights[s.id] || 1;
        const leverageScore = (10 - score) * weight;
        return { id: s.id, name: s.name, leverageScore };
      })
      .sort((a, b) => b.leverageScore - a.leverageScore);

    const listRecs = [];
    ranked.slice(0, 3).forEach((sec, idx) => {
      const template = recCatalog[sec.id];
      if (template) {
        const pKey = ['designer', 'marketer', 'writer'].includes(profession) ? profession : 'general';
        const professionAction = template.what[pKey] || template.what['general'] || '';
        listRecs.push({
          priority: idx + 1,
          title: template.title,
          addresses: template.addresses,
          revealed: template.revealed,
          why: template.why,
          action: professionAction
        });
      }
    });
    return listRecs;
  };
  const recommendationsList = getRecommendations();

  // 12. Serious Operator Standards
  const seriousOperatorBenchmarks = {
    foundation: {
      general: "A Serious Operator has pre-defined, standardized packages with explicit scope boundaries and a repeatable onboarding pipeline that takes less than 5 minutes to trigger.",
      designer: "A Serious Operator has predefined Figma assets, standard design packages with locked revision counts, and a repeatable onboarding flow that takes under 5 minutes to trigger.",
      marketer: "A Serious Operator has defined campaign packages, standardized report formats, and an onboarding intake checklist that runs exactly the same way for every new brand.",
      writer: "A Serious Operator has locked editing and drafting packages, standardized content brief templates, and an onboarding intake form that automatically collects style guides."
    },
    productivity: {
      general: "A Serious Operator starts their day with a single dashboard showing only prioritized tasks that are relationally linked to active client projects. They never guess what to do next.",
      designer: "A Serious Operator views a unified task list where creative assets and client feedback are linked directly to each design ticket. They never search through Slack for client specs.",
      marketer: "A Serious Operator tracks execution tasks linked directly to campaign milestones and launch dates. They never skip a tracking parameter or setup step.",
      writer: "A Serious Operator operates from a unified writing queue where outlines, drafts, and approval deadlines are bound to active project cards."
    },
    content: {
      general: "A Serious Operator writes from a centralized content calendar, planning at least two weeks out, and links every post relationally to the service package they want to fill.",
      designer: "A Serious Operator plans their design case studies in advance, maintains a library of design assets, and links self-promotion directly to open design slots.",
      marketer: "A Serious Operator plans their social insights 14 days out, drafts content systematically, and links every piece to the specific service or audit package they are running.",
      writer: "A Serious Operator maintains a structured content library, drafts newsletter topics ahead of schedule, and maps content to their current editorial or retainer focus."
    },
    marketing: {
      general: "A Serious Operator maintains a CRM showing the exact value and stage of every lead, and follows a strict, pre-scheduled follow-up cadence for every proposal sent.",
      designer: "A Serious Operator tracks prospective clients in a pipeline, sees active design proposals, and systematically follows up at 3, 7, and 14 days without relying on memory.",
      marketer: "A Serious Operator tracks brand inquiries in a CRM and runs a strict, scheduled follow-up sequence on all proposals, ensuring no high-value contract drifts away.",
      writer: "A Serious Operator monitors their retainer pipeline and executes a documented follow-up sequence for every pitch sent, keeping their pipeline predictable."
    },
    client: {
      general: "A Serious Operator opens a single client record containing tasks, files, invoices, and notes. Clients log into a live portal, and project archiving happens in one click.",
      designer: "A Serious Operator has one record per client containing design briefs, active tasks, invoices, and Figma links. Clients access a portal to check progress, and offboarding is automated.",
      marketer: "A Serious Operator accesses a central client record holding campaign plans, active tasks, reports, and invoices. Clients view real-time task boards in a synced portal.",
      writer: "A Serious Operator manages work via a client command center linking content briefs, drafts, tasks, and retainer invoices. Clients review draft links in a secure portal."
    },
    finance: {
      general: "A Serious Operator views real-time monthly profit margins, tracks project-specific profitability, sets aside taxes automatically, and knows their exact monthly cash runway.",
      designer: "A Serious Operator checks real-time margins, tracks design project margins based on hours spent, invoices in 60 seconds, and maintains a distinct tax routing reserve.",
      marketer: "A Serious Operator views campaign ROI alongside client retainer profitability, handles invoicing instantly, and calculates business cash runway in real-time.",
      writer: "A Serious Operator tracks retainer margins, auto-calculates hours spent vs billable values, sends invoices immediately, and maintains a calculated runway metric."
    }
  };

  // ─── Build HTML Parts ──────────────────────────────────────────────────────

  // Section Breakdown HTML
  const scoresHtml = sectionsList.map(s => {
    const val = sectionScores[s.id] || 0;
    const pct = (val / 10) * 100;
    const status = getScoreStatus(val);
    const color = val <= 4 ? '#EF4444' : val <= 7 ? '#D97706' : '#059669';

    // SVG icons matching the design system
    let svgPath = '';
    if (s.id === 'foundation') {
      svgPath = `<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>`;
    } else if (s.id === 'productivity') {
      svgPath = `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`;
    } else if (s.id === 'content') {
      svgPath = `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`;
    } else if (s.id === 'marketing') {
      svgPath = `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>`;
    } else if (s.id === 'client') {
      svgPath = `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"></path>`;
    } else { // finance
      svgPath = `<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`;
    }

    return `
      <div class="score-row-item">
        <div class="score-row-header">
          <div class="score-row-label">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${svgPath}
            </svg>
            <span>${s.name}</span>
            <span class="score-badge-inline ${status.class}">${status.text}</span>
          </div>
          <span class="score-val" style="color: ${color}; font-weight: 800; font-family: 'Space Mono', monospace;">${val}/10</span>
        </div>
        <div class="score-bar-container">
          <div class="score-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join('');

  // Contradictions HTML
  let contradictionsHtml = '';
  if (contradictions.length > 0) {
    const items = contradictions.map(c => `
      <li>
        <strong>${c.title}:</strong> ${c.description} <span class="evidence-tag">(${c.evidence})</span>
      </li>
    `).join('');
    contradictionsHtml = `
      <div class="contradictions-box">
        <div class="contradictions-header">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Workspace Inconsistencies Detected (${contradictions.length})</span>
        </div>
        <p class="contradictions-sub">Our Relational Intelligence Engine detected inconsistent signals across different sections:</p>
        <ul class="contradictions-list">${items}</ul>
      </div>
    `;
  }

  // Blind Spots HTML
  let blindSpotsHtml = '';
  if (blindSpots.length > 0) {
    blindSpotsHtml = blindSpots.map(spot => {
      let chartHtml = '';
      if (spot.id === 'BLIND_SPOT_SOLO_HUBRIS') {
        chartHtml = `
          <div class="confidence-chart">
            <div class="chart-title">Confidence vs. Infrastructure Gap:</div>
            <div class="chart-row">
              <span class="chart-label">Self-Reported Confidence (S5Q2a):</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar-fill orange-bg" style="width: ${(composites.crgmScore / 5) * 100}%;"></div>
                <span class="chart-score">${(composites.crgmScore / 5 * 10).toFixed(0)}/10</span>
              </div>
            </div>
            <div class="chart-row">
              <span class="chart-label">Client Record Infrastructure (S5):</span>
              <div class="chart-bar-wrap">
                <div class="chart-bar-fill dark-bg" style="width: ${(sectionScores.client / 10) * 100}%;"></div>
                <span class="chart-score">${sectionScores.client}/10</span>
              </div>
            </div>
            <p class="chart-footnote">The gap between these bars indicates how much you rely on personal cognitive effort rather than workspace systems.</p>
          </div>
        `;
      }

      return `
        <div class="blind-spot-card">
          <div class="blind-spot-title">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${spot.title}</span>
          </div>
          <p class="blind-spot-desc">${spot.description}</p>
          ${chartHtml}
          <div class="blind-spot-remedy">
            <strong>Operational Remedy:</strong> ${spot.remedy}
          </div>
        </div>
      `;
    }).join('');
  } else {
    blindSpotsHtml = `
      <div class="empty-state">
        No significant blind spots detected. Your self-reports align with your current infrastructure.
      </div>
    `;
  }

  // Recommendations Roadmap HTML
  const recsHtml = recommendationsList.map(rec => `
    <div class="recommendation-card">
      <div class="rec-priority-tag">PRIORITY 0${rec.priority}</div>
      <h3 class="rec-card-title">${rec.title}</h3>
      <div class="rec-card-meta">Addresses: ${rec.addresses}</div>
      <div class="rec-card-revealed"><strong>Your answers revealed:</strong> ${rec.revealed}</div>
      <div class="rec-card-why"><strong>Why this matters:</strong> ${rec.why}</div>
      <div class="rec-card-action">
        <div class="action-tag">What this looks like:</div>
        <p class="action-text">${rec.action}</p>
      </div>
    </div>
  `).join('');

  // Serious Operator Standards HTML
  const benchmarksHtml = sectionsList.map(s => {
    const profKey = ['designer', 'marketer', 'writer'].includes(profession) ? profession : 'general';
    const desc = seriousOperatorBenchmarks[s.id][profKey] || seriousOperatorBenchmarks[s.id]['general'];
    return `
      <div class="benchmark-card-item">
        <strong>${s.name}:</strong> ${desc}
      </div>
    `;
  }).join('');


  // ── HTML Template output ───────────────────────────────────────────────────

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KineticOS Diagnostic Report — ${firstName} ${lastName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@700;800;900&family=Space+Mono:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #FFFFF5;
      color: #292929;
      width: 794px;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }

    /* ─── Page Containers ─── */
    .pdf-page {
      width: 794px;
      height: 1123px;
      padding: 54px;
      box-sizing: border-box;
      position: relative;
      background-color: #FFFFF5;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .pdf-page:last-child {
      page-break-after: avoid;
    }

    /* ─── Header ─── */
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #292929;
      margin-bottom: 24px;
    }
    
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 2px solid #292929;
      padding: 6px 14px;
      border-radius: 50px;
      box-shadow: 2px 2px 0px 0px #292929;
      font-family: 'Poppins', sans-serif;
      font-weight: 900;
      color: #FF751F;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .logo-star {
      width: 10px;
      height: 10px;
      fill: #FF751F;
    }

    .header-meta {
      text-align: right;
      font-size: 10px;
      color: #4A4A4A;
      font-family: 'Space Mono', monospace;
      line-height: 1.5;
    }
    .header-meta strong {
      color: #292929;
    }

    /* ─── Footer ─── */
    .pdf-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px dashed rgba(41, 41, 41, 0.15);
      font-size: 9px;
      color: rgba(41, 41, 41, 0.5);
      font-family: 'Space Mono', monospace;
    }
    .footer-brand {
      color: #FF751F;
      font-weight: 700;
    }

    /* ─── Page 1 Elements ─── */
    .p1-title-block {
      margin-bottom: 20px;
    }
    .p1-subtitle {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: rgba(41, 41, 41, 0.5);
      letter-spacing: 0.15em;
      margin-bottom: 4px;
      display: block;
    }
    .p1-main-title {
      font-family: 'Poppins', sans-serif;
      font-size: 26px;
      font-weight: 900;
      line-height: 1.1;
      color: #292929;
    }

    .p1-score-split {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 28px;
    }

    .p1-score-ring-card {
      width: 160px;
      height: 160px;
      background-color: #FFFFFF;
      border: 2px solid #292929;
      border-radius: 2px;
      box-shadow: 4px 4px 0px 0px #292929;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }
    .p1-score-num {
      font-family: 'Poppins', sans-serif;
      font-size: 38px;
      font-weight: 900;
      color: #FF751F;
      line-height: 1;
    }
    .p1-score-denom {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      color: rgba(41, 41, 41, 0.5);
      font-weight: 700;
      margin-top: 4px;
    }
    .p1-score-meta {
      flex: 1;
    }
    .p1-score-band {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      font-weight: 900;
      color: #292929;
      margin-bottom: 6px;
    }
    .p1-score-desc {
      font-size: 12px;
      line-height: 1.5;
      color: #4A4A4A;
    }

    .section-heading-muted {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(41, 41, 41, 0.45);
      margin-bottom: 12px;
      font-family: 'Space Mono', monospace;
    }

    .exec-assessment-box {
      background-color: rgba(255, 117, 31, 0.03);
      border: 2px solid #292929;
      border-left: 5px solid #FF751F;
      padding: 16px 20px;
      border-radius: 2px;
      box-shadow: 3px 3px 0px 0px #292929;
      margin-bottom: 28px;
    }
    .exec-assessment-box p {
      font-size: 11.5px;
      line-height: 1.6;
      color: #292929;
    }

    .scores-grid-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .score-row-item {
      background-color: #FFFFFF;
      border: 1px solid rgba(41, 41, 41, 0.12);
      border-radius: 2px;
      padding: 10px 16px;
    }
    .score-row-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .score-row-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      color: #292929;
    }
    .score-badge-inline {
      font-size: 8px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 2px;
      margin-left: 6px;
    }
    .score-badge-inline.critical {
      background-color: rgba(239, 68, 68, 0.08);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .score-badge-inline.warning {
      background-color: rgba(245, 158, 11, 0.08);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .score-badge-inline.healthy {
      background-color: rgba(16, 185, 129, 0.08);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .score-bar-container {
      width: 100%;
      height: 5px;
      background-color: rgba(41, 41, 41, 0.05);
      border-radius: 2px;
      overflow: hidden;
    }
    .score-bar-fill {
      height: 100%;
      border-radius: 2px;
    }

    .oci-badge-box {
      border: 1px solid #292929;
      background: #FFFFFF;
      padding: 12px 16px;
      border-radius: 2px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 2px 2px 0px 0px #292929;
    }
    .oci-badge-box h4 {
      font-size: 11px;
      margin-bottom: 2px;
      color: #292929;
      font-weight: 800;
    }
    .oci-badge-box p {
      font-size: 10px;
      color: #4A4A4A;
      margin: 0;
    }

    /* ─── Page 2 Elements ─── */
    .pattern-analysis-card {
      background: rgba(255, 117, 31, 0.01);
      border: 2px solid #FF751F;
      padding: 20px;
      border-radius: 2px;
      margin-bottom: 20px;
      box-shadow: 3px 3px 0px 0px #FF751F;
    }
    .pattern-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 900;
      color: #292929;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .pattern-text-main {
      font-size: 11px;
      line-height: 1.55;
      color: #4A4A4A;
    }

    .wedge-subcard {
      border: 1px solid rgba(41, 41, 41, 0.12);
      padding: 12px 14px;
      border-radius: 2px;
      background-color: rgba(255, 117, 31, 0.03);
      margin-top: 12px;
    }
    .wedge-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      font-size: 11px;
      color: #292929;
      margin-bottom: 4px;
    }
    .wedge-desc {
      font-size: 10px;
      line-height: 1.5;
      color: #4A4A4A;
    }

    .blind-spots-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .blind-spot-card {
      background: #FFFFFF;
      border: 2px solid #292929;
      padding: 16px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
    }
    .blind-spot-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 11px;
      color: #292929;
      margin-bottom: 6px;
    }
    .blind-spot-desc {
      font-size: 10px;
      line-height: 1.5;
      color: #4A4A4A;
      margin-bottom: 10px;
    }
    .blind-spot-remedy {
      background-color: rgba(255, 117, 31, 0.04);
      border: 1px solid rgba(255, 117, 31, 0.15);
      padding: 10px 12px;
      border-radius: 2px;
      font-size: 10px;
      line-height: 1.45;
      color: #292929;
    }
    .empty-state {
      font-size: 11px;
      color: rgba(41, 41, 41, 0.5);
      text-align: center;
      padding: 20px;
      background: #FFFFFF;
      border: 1px dashed rgba(41, 41, 41, 0.2);
    }

    .confidence-chart {
      background-color: rgba(255, 117, 31, 0.03);
      border: 1px solid rgba(255, 117, 31, 0.12);
      padding: 12px;
      border-radius: 2px;
      margin-bottom: 10px;
    }
    .chart-title {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      color: rgba(41, 41, 41, 0.6);
      margin-bottom: 8px;
    }
    .chart-row {
      margin-bottom: 6px;
    }
    .chart-label {
      font-size: 9px;
      color: #4A4A4A;
      display: block;
      margin-bottom: 2px;
    }
    .chart-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chart-bar-fill {
      height: 8px;
      border-radius: 2px;
    }
    .chart-bar-fill.orange-bg {
      background-color: #FF751F;
    }
    .chart-bar-fill.dark-bg {
      background-color: #292929;
    }
    .chart-score {
      font-family: 'Space Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
    }
    .chart-footnote {
      font-size: 8.5px;
      font-style: italic;
      color: rgba(41, 41, 41, 0.5);
      margin-top: 6px;
    }

    .contradictions-box {
      border: 2px solid #292929;
      background-color: rgba(255, 117, 31, 0.03);
      padding: 16px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
      margin-bottom: 20px;
    }
    .contradictions-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 11.5px;
      color: #292929;
      margin-bottom: 6px;
    }
    .contradictions-sub {
      font-size: 10px;
      color: #4A4A4A;
      margin-bottom: 8px;
    }
    .contradictions-list {
      list-style-type: square;
      padding-left: 16px;
    }
    .contradictions-list li {
      font-size: 9.5px;
      line-height: 1.5;
      color: #4A4A4A;
      margin-bottom: 4px;
    }
    .evidence-tag {
      color: rgba(41, 41, 41, 0.5);
      font-family: 'Space Mono', monospace;
    }

    .split-middle-row {
      display: flex;
      gap: 20px;
    }
    .split-middle-col {
      flex: 1;
    }

    .strengths-card {
      background: #FFFFFF;
      border: 2px solid #292929;
      padding: 14px 16px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
      height: 100%;
    }
    .strength-title {
      font-family: 'Poppins', sans-serif;
      font-size: 12.5px;
      font-weight: 900;
      color: #292929;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .strength-desc {
      font-size: 10px;
      line-height: 1.5;
      color: #4A4A4A;
    }

    .leverage-card {
      background: rgba(255, 117, 31, 0.03);
      border: 2px solid #292929;
      border-left: 4px solid #FF751F;
      padding: 14px 16px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
      height: 100%;
    }
    .leverage-badge-inline {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #FF751F;
      margin-bottom: 4px;
      display: block;
    }
    .leverage-title {
      font-family: 'Poppins', sans-serif;
      font-size: 12.5px;
      font-weight: 900;
      color: #292929;
      margin-bottom: 4px;
    }
    .leverage-desc {
      font-size: 9.5px;
      line-height: 1.5;
      color: #4A4A4A;
      margin-bottom: 8px;
    }
    .leverage-math {
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
      color: rgba(41, 41, 41, 0.5);
    }

    /* ─── Page 3 Elements ─── */
    .recs-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .recommendation-card {
      background: #FFFFFF;
      border: 2px solid #292929;
      padding: 14px 18px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
    }
    .rec-priority-tag {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      color: #FF751F;
      margin-bottom: 4px;
    }
    .rec-card-title {
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 900;
      color: #292929;
      margin-bottom: 2px;
    }
    .rec-card-meta {
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: rgba(41, 41, 41, 0.45);
      margin-bottom: 8px;
      font-family: 'Space Mono', monospace;
    }
    .rec-card-revealed {
      font-size: 9.5px;
      font-style: italic;
      color: #4A4A4A;
      margin-bottom: 4px;
    }
    .rec-card-why {
      font-size: 10px;
      line-height: 1.45;
      color: #4A4A4A;
      margin-bottom: 10px;
    }
    .rec-card-action {
      background-color: rgba(255, 117, 31, 0.03);
      border: 1px solid rgba(255, 117, 31, 0.12);
      padding: 8px 12px;
      border-radius: 2px;
    }
    .action-tag {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #FF751F;
      margin-bottom: 2px;
      letter-spacing: 0.05em;
    }
    .action-text {
      font-size: 9.5px;
      line-height: 1.45;
      color: #292929;
      margin: 0;
    }

    .ai-readiness-box {
      border: 2px solid #292929;
      background: #FFFFFF;
      padding: 12px 16px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
      margin-bottom: 20px;
    }
    .ai-readiness-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .ai-readiness-title {
      font-family: 'Poppins', sans-serif;
      font-size: 11.5px;
      font-weight: 900;
      color: #292929;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ai-readiness-bar-track {
      width: 100px;
      height: 6px;
      background-color: rgba(41, 41, 41, 0.05);
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid rgba(41, 41, 41, 0.12);
      display: inline-block;
    }
    .ai-readiness-desc {
      font-size: 9.5px;
      line-height: 1.5;
      color: #4A4A4A;
      margin: 0;
    }

    .bottom-split-row {
      display: flex;
      gap: 20px;
    }
    .bottom-split-col-left {
      flex: 1.3;
    }
    .bottom-split-col-right {
      flex: 1;
    }

    .benchmarks-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #FFFFFF;
      border: 2px solid #292929;
      padding: 14px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
    }
    .benchmark-card-item {
      font-size: 8.8px;
      line-height: 1.45;
      color: #4A4A4A;
      border-bottom: 1px dashed rgba(41, 41, 41, 0.1);
      padding-bottom: 6px;
      margin-bottom: 4px;
    }
    .benchmark-card-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }

    .roadmap-timeline-box {
      background-color: #FFFFFF;
      border: 2px solid #292929;
      padding: 14px;
      border-radius: 2px;
      box-shadow: 2px 2px 0px 0px #292929;
      height: 100%;
    }
    .roadmap-phases-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .roadmap-phase-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .phase-badge {
      font-family: 'Space Mono', monospace;
      font-size: 8px;
      font-weight: 700;
      background-color: #292929;
      color: #FFFFFF;
      padding: 2px 6px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .phase-content h4 {
      font-size: 9.5px;
      font-weight: 800;
      color: #292929;
      margin: 0 0 2px 0;
    }
    .phase-content p {
      font-size: 8.5px;
      line-height: 1.4;
      color: rgba(41, 41, 41, 0.65);
      margin: 0;
    }

  </style>
</head>
<body>
  
  <!-- ──────────────────────── PAGE 1 ──────────────────────── -->
  <div class="pdf-page">
    
    <div>
      <!-- Header -->
      <div class="pdf-header">
        <div class="logo-badge">
          <svg class="logo-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.22 451">
            <polygon points="444.22 294.59 390.95 380.92 317.41 345.33 277.69 326.11 277.69 451 166.69 451 166.69 326.11 126.97 345.33 53.42 380.92 0 294.63 76.51 243.82 104.09 225.51 62.43 199.85 62.36 199.82 .83 161.93 48.88 62.46 117.77 98.97 166.69 124.9 166.69 0 277.69 0 277.69 124.9 346.56 88.37 395.47 62.44 443.58 161.95 361.53 211.71 348.16 219.82 333.26 228.86 444.22 294.59"/>
          </svg>
          <span>KineticOS</span>
        </div>
        <div class="header-meta">
          <strong>${firstName} ${lastName}</strong><br>
          ${professionLabel}<br>
          Diagnosed: ${date}
        </div>
      </div>

      <!-- Title -->
      <div class="p1-title-block">
        <span class="p1-subtitle">Freelancer Diagnostic Results</span>
        <h1 class="p1-main-title">${scoreBandInfo.name}</h1>
      </div>

      <!-- Score Ring & Band Meta -->
      <div class="p1-score-split">
        <div class="p1-score-ring-card">
          <span class="p1-score-num">${score}</span>
          <span class="p1-score-denom">OUT OF 60</span>
        </div>
        <div class="p1-score-meta">
          <div class="p1-score-band">Operational Diagnosis</div>
          <p class="p1-score-desc">${scoreBandInfo.description}</p>
        </div>
      </div>

      <!-- Executive Assessment Paragraph -->
      <div class="exec-assessment-box">
        <p>
          <strong>Executive Assessment:</strong> Based on your answers as a Freelance ${profession ? profession.charAt(0).toUpperCase() + profession.slice(1) : 'Professional'} with ${composites.crgmScore}+ active clients: your lowest performance centers in <strong>${lowestSections.map(s => s.name).join(' & ')}</strong>. This indicates your business is facing a capacity or trackability bottleneck. Your calculated workspace consistency index is <strong>${(composites.crgmScore >= 4 && safeAnswers.s5q1 !== 'C' ? 'Low' : 'Aligned')}</strong>, and you are running a single-point-of-failure risk level of <strong>${composites.riskScore >= 7 ? 'High' : (composites.riskScore >= 4 ? 'Moderate' : 'Low')}</strong>.
        </p>
      </div>

      <!-- Functional Area Breakdown -->
      <div class="section-heading-muted">Functional Area Breakdown</div>
      <div class="scores-grid-container">
        ${scoresHtml}
      </div>

    </div>

    <!-- OCI Badge and Page Footer -->
    <div>
      <div class="oci-badge-box" style="margin-bottom: 20px;">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#FF751F" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <div>
          <h4>Operational Component Inventory (OCI)</h4>
          <p>You have verified that <strong>${composites.ociTotal} of 12</strong> key relational documents/trackers currently exist in one connected location in your business.</p>
        </div>
      </div>

      <div class="pdf-footer">
        <div><span class="footer-brand">KineticOS</span> — Operational Architecture Report</div>
        <div>Page 1 of 3</div>
      </div>
    </div>

  </div>


  <!-- ──────────────────────── PAGE 2 ──────────────────────── -->
  <div class="pdf-page">
    
    <div>
      <!-- Header -->
      <div class="pdf-header">
        <div class="logo-badge">
          <svg class="logo-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.22 451">
            <polygon points="444.22 294.59 390.95 380.92 317.41 345.33 277.69 326.11 277.69 451 166.69 451 166.69 326.11 126.97 345.33 53.42 380.92 0 294.63 76.51 243.82 104.09 225.51 62.43 199.85 62.36 199.82 .83 161.93 48.88 62.46 117.77 98.97 166.69 124.9 166.69 0 277.69 0 277.69 124.9 346.56 88.37 395.47 62.44 443.58 161.95 361.53 211.71 348.16 219.82 333.26 228.86 444.22 294.59"/>
          </svg>
          <span>KineticOS</span>
        </div>
        <div class="header-meta">
          <strong>${firstName} ${lastName}</strong><br>
          ${professionLabel}<br>
          Diagnosed: ${date}
        </div>
      </div>

      <!-- Pattern Analysis -->
      <div class="section-heading-muted">Pattern Analysis</div>
      <div class="pattern-analysis-card">
        <div class="pattern-card-header">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
          </svg>
          <span>Operational Root Cause</span>
        </div>
        <p class="pattern-text-main">
          ${patternParagraph}
        </p>

        <div class="wedge-subcard">
          <div class="wedge-title-row">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>${priorFailureWedge.title}</span>
          </div>
          <p class="wedge-desc">${priorFailureWedge.text}</p>
        </div>
      </div>

      <!-- Critical Blind Spots -->
      <div class="section-heading-muted">Critical Blind Spots</div>
      <div class="blind-spots-wrapper">
        ${blindSpotsHtml}
      </div>

      <!-- Contradictions box if active -->
      ${contradictionsHtml}

    </div>

    <!-- Strengths & Leverage Row + Page Footer -->
    <div>
      <div class="split-middle-row" style="margin-bottom: 20px;">
        <div class="split-middle-col">
          <div class="strengths-card">
            <div class="strength-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Operational Strength</span>
            </div>
            <h4 style="font-size: 11px; margin-bottom: 4px;">${highestSection.name} (${highestSection.score}/10)</h4>
            <p class="strength-desc">This is your highest-scoring operational dimension. Leverage this functioning infrastructure as a model for patching other sections rather than rewriting everything at once.</p>
          </div>
        </div>
        <div class="split-middle-col">
          <div class="leverage-card">
            <span class="leverage-badge-inline">Priority 1 Focus Area</span>
            <div class="leverage-title">${leverageAnalysis.name}</div>
            <p class="leverage-desc">Improving this section first will yield the largest cascade effect across your operations because downstream areas depend directly on this foundation.</p>
            <div class="leverage-math">LEVERAGE RATIO: ${leverageAnalysis.leverageScore} (Headroom: ${10 - leverageAnalysis.score} &times; Weight: ${leverageAnalysis.weight})</div>
          </div>
        </div>
      </div>

      <div class="pdf-footer">
        <div><span class="footer-brand">KineticOS</span> — Operational Architecture Report</div>
        <div>Page 2 of 3</div>
      </div>
    </div>

  </div>


  <!-- ──────────────────────── PAGE 3 ──────────────────────── -->
  <div class="pdf-page">
    
    <div>
      <!-- Header -->
      <div class="pdf-header">
        <div class="logo-badge">
          <svg class="logo-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.22 451">
            <polygon points="444.22 294.59 390.95 380.92 317.41 345.33 277.69 326.11 277.69 451 166.69 451 166.69 326.11 126.97 345.33 53.42 380.92 0 294.63 76.51 243.82 104.09 225.51 62.43 199.85 62.36 199.82 .83 161.93 48.88 62.46 117.77 98.97 166.69 124.9 166.69 0 277.69 0 277.69 124.9 346.56 88.37 395.47 62.44 443.58 161.95 361.53 211.71 348.16 219.82 333.26 228.86 444.22 294.59"/>
          </svg>
          <span>KineticOS</span>
        </div>
        <div class="header-meta">
          <strong>${firstName} ${lastName}</strong><br>
          ${professionLabel}<br>
          Diagnosed: ${date}
        </div>
      </div>

      <!-- Action Roadmap -->
      <div class="section-heading-muted">Action Roadmap</div>
      <div class="recs-stack">
        ${recsHtml}
      </div>

      <!-- AI Readiness Score -->
      <div class="ai-readiness-box">
        <div class="ai-readiness-header">
          <div class="ai-readiness-title">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="#FF751F" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>AI Readiness Score: ${composites.aiReadiness}/10</span>
          </div>
          <div class="ai-readiness-bar-track">
            <div style="height: 100%; background-color: #FF751F; width: ${composites.aiReadiness * 10}%;"></div>
          </div>
        </div>
        <p class="ai-readiness-desc">
          ${composites.aiReadiness >= 7.0 
            ? 'Your operational data is structured enough to leverage AI tools immediately. You can feed your relational records into AI interfaces to analyze client metrics.' 
            : composites.aiReadiness >= 4.0 
            ? 'You have partial data structure. AI can analyze individual spreadsheets, but cannot automate client context because the data points do not share a common record.'
            : 'Your business is not AI-ready. AI cannot optimize what is not documented. Building a connected record is the prerequisite for AI delegation.'}
        </p>
      </div>

    </div>

    <!-- Standards, Growth Phase and Footer -->
    <div>
      <div class="bottom-split-row" style="margin-bottom: 20px;">
        <div class="bottom-split-col-left">
          <div class="section-heading-muted" style="margin-bottom: 8px;">Serious Operator Standards</div>
          <div class="benchmarks-grid">
            ${benchmarksHtml}
          </div>
        </div>
        
        <div class="bottom-split-col-right">
          <div class="section-heading-muted" style="margin-bottom: 8px;">Operational Growth Roadmap</div>
          <div class="roadmap-timeline-box">
            <div class="roadmap-phases-stack">
              <div class="roadmap-phase-row">
                <span class="phase-badge">P1</span>
                <div class="phase-content">
                  <h4>Standardize</h4>
                  <p>Lock packages, questionnaires, templates.</p>
                </div>
              </div>
              <div class="roadmap-phase-row">
                <span class="phase-badge">P2</span>
                <div class="phase-content">
                  <h4>Connect</h4>
                  <p>Client records portal & task lists.</p>
                </div>
              </div>
              <div class="roadmap-phase-row">
                <span class="phase-badge">P3</span>
                <div class="phase-content">
                  <h4>Automate</h4>
                  <p>Margins, tax reserves, pipeline.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-footer">
        <div><span class="footer-brand">KineticOS</span> — Operational Architecture Report</div>
        <div>Page 3 of 3</div>
      </div>
    </div>

  </div>

</body>
</html>
  `;
}
