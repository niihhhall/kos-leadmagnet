export const sections = [
  {
    id: "foundation",
    name: "Business Foundation & Strategy",
    description: "Your strategic baseline: service definitions, ICP profiling, and repeatable onboarding templates.",
    questions: [
      {
        id: "s1q1",
        text: "Do you have a clearly defined list of services and packages that you offer to clients?",
        options: [
          { value: 0, text: "No, I customize every proposal from scratch." },
          { value: 1, text: "I have general packages, but I often improvise the scope." },
          { value: 2, text: "Yes, I have locked-in, documented service packages." }
        ]
      },
      {
        id: "s1q2",
        text: "Do you have a written profile of your ideal client (ICP) that you use to filter incoming leads?",
        options: [
          { value: 0, text: "No, I take on almost any project that comes my way." },
          { value: 1, text: "I have an idea of who I want to work with, but I don't actively filter." },
          { value: 2, text: "Yes, I have clear criteria and refuse clients who don't fit." }
        ]
      },
      {
        id: "s1q3",
        text: "Have you ever worked extra hours for free because the boundaries of your project scope were never documented or agreed upon?",
        variants: {
          designer: "Have you had a project drag on for weeks past its end date because the boundaries of your creative scope were never documented?",
          marketer: "Have you had a client demand extra campaign reports or revision cycles that you had to deliver for free because boundaries weren't set?",
          writer: "Have you had a client ask for 'just one more quick rewrite' that you did for free because there was no documented scope of work?"
        },
        options: [
          { value: 0, text: "Yes, this happens on almost every project." },
          { value: 1, text: "Occasionally, scope creeps because limits are vague." },
          { value: 2, text: "No, project boundaries are locked and enforced." }
        ]
      },
      {
        id: "s1q4",
        text: "Do you have a standardized onboarding sequence (intake form, contract, kickoff checklist) that runs the same way for every new client?",
        options: [
          { value: 0, text: "No, onboarding is a series of casual emails and messages." },
          { value: 1, text: "I have some documents, but I improvise the sequence each time." },
          { value: 2, text: "Yes, onboarding is a documented, structured system." }
        ]
      },
      {
        id: "s1q5",
        text: "Can you look at your current service offers and state their exact delivery capacity (how many you can handle simultaneously before quality drops)?",
        options: [
          { value: 0, text: "No, I just take on work until I feel overwhelmed." },
          { value: 1, text: "I have a vague idea of my limit, but no structured way to measure capacity." },
          { value: 2, text: "Yes, I know my exact client capacity and availability windows." }
        ]
      }
    ]
  },
  {
    id: "productivity",
    name: "Productivity & Tasks",
    description: "Daily execution mechanics: task consolidation, contextual linking, and time estimation.",
    questions: [
      {
        id: "s2q1",
        text: "When you start your workday, is there a single central screen that lists all tasks you need to complete today?",
        options: [
          { value: 0, text: "No, I look through emails, notebook pages, and Slack." },
          { value: 1, text: "I have a task list, but it's rarely up to date." },
          { value: 2, text: "Yes, a single dashboard shows my prioritized tasks for the day." }
        ]
      },
      {
        id: "s2q2",
        text: "Are your daily tasks directly linked to overarching client projects in a structured system?",
        options: [
          { value: 0, text: "No, my tasks are just a flat checklist of items." },
          { value: 1, text: "Some tasks are grouped, but many float independently without context." },
          { value: 2, text: "Yes, every task is relationally linked to a project and client." }
        ]
      },
      {
        id: "s2q3",
        text: "Have you ever missed a crucial task or deadline because the request was buried in a client email thread or chat history?",
        variants: {
          designer: "Have you ever missed a feedback deadline or deliverable because the task was buried in a client's Figma comments or email thread?",
          marketer: "Have you ever missed a campaign launch step because the task was stuck in an email chain or a chat thread?",
          writer: "Have you ever missed a drafting deadline because the task was lost in a shared document comment or Slack message?"
        },
        options: [
          { value: 0, text: "Yes, this is a constant source of anxiety." },
          { value: 1, text: "It has happened once or twice when threads got busy." },
          { value: 2, text: "No, all requests are immediately captured in my task system." }
        ]
      },
      {
        id: "s2q4",
        text: "Do you estimate the hours required for tasks before starting them and track your actual time against those estimates?",
        options: [
          { value: 0, text: "No, I don't track time or estimate task hours." },
          { value: 1, text: "I track my time sometimes, but I don't compare it to estimates." },
          { value: 2, text: "Yes, I estimate and track time for every major project task." }
        ]
      },
      {
        id: "s2q5",
        text: "If you were unable to work for 48 hours, could a peer log in and immediately see exactly what tasks are outstanding and when they are due?",
        options: [
          { value: 0, text: "No, the current status of my work only exists in my head." },
          { value: 1, text: "They could figure it out after digging through my notes and emails." },
          { value: 2, text: "Yes, the live task board is clear enough for anyone to step in." }
        ]
      }
    ]
  },
  {
    id: "content",
    name: "Content & Social Media",
    description: "Marketing asset collection: calendar planning, strategic linking, and client acquisition tracking.",
    questions: [
      {
        id: "s3q1",
        text: "Do you have a single central workspace where you collect content ideas, drafts, and assets?",
        options: [
          { value: 0, text: "No, ideas are scattered across sticky notes, my phone, and documents." },
          { value: 1, text: "I have a document or folder, but it's disorganized." },
          { value: 2, text: "Yes, a structured content pipeline holds everything in one place." }
        ]
      },
      {
        id: "s3q2",
        text: "Do you plan your content calendar at least two weeks in advance?",
        options: [
          { value: 0, text: "No, I post whenever I feel inspired or guilty about not posting." },
          { value: 1, text: "I try to plan ahead, but I often end up writing posts on the day of." },
          { value: 2, text: "Yes, I have a scheduled content calendar that is always filled." }
        ]
      },
      {
        id: "s3q3",
        text: "Have you ever abandoned a piece of self-promotional content because searching for your assets, drafts, or ideas felt too chaotic?",
        variants: {
          designer: "Have you ever sat down to write a post to promote your design work, only to abandon it because you couldn't find your portfolio assets or notes?",
          marketer: "Have you ever skipped a week of sharing marketing insights because drafting posts felt too chaotic without a system?",
          writer: "Have you ever abandoned writing a newsletter or post because you spent 30 minutes searching for a draft or outline?"
        },
        options: [
          { value: 0, text: "Yes, this happens almost every time I try to publish." },
          { value: 1, text: "Sometimes, friction in finding files slows me down." },
          { value: 2, text: "No, my assets and outlines are cataloged and ready." }
        ]
      },
      {
        id: "s3q4",
        text: "Is each piece of content you write relationally linked to a specific service package or business offer you want to promote?",
        options: [
          { value: 0, text: "No, I just write about general topics that interest me." },
          { value: 1, text: "I try to align them, but there is no structured link between posts and offers." },
          { value: 2, text: "Yes, every post is mapped to a campaign and a specific offer." }
        ]
      },
      {
        id: "s3q5",
        text: "Can you see a clear history of which posts or content pieces historically generated your leads or client inquiries?",
        options: [
          { value: 0, text: "No, I have no idea which content drives business." },
          { value: 1, text: "I have a vague sense of which posts did well, but no hard data." },
          { value: 2, text: "Yes, I track lead source attribution directly in my content system." }
        ]
      }
    ]
  },
  {
    id: "marketing",
    name: "Marketing & Pipeline",
    description: "Acquisition engine: pipeline management, systematic follow-ups, and revenue forecasting.",
    questions: [
      {
        id: "s4q1",
        text: "Do you keep a list of active leads and prospective clients in a single, dedicated database?",
        options: [
          { value: 0, text: "No, leads are scattered across my inbox, DMs, and memory." },
          { value: 1, text: "I have a spreadsheet, but I forget to update it regularly." },
          { value: 2, text: "Yes, I have a dedicated lead pipeline that I monitor weekly." }
        ]
      },
      {
        id: "s4q2",
        text: "Do you have a structured pipeline that tracks leads through clear stages (e.g., Contacted, Proposal Sent, Negotiating)?",
        options: [
          { value: 0, text: "No, I just email back and forth until they buy or disappear." },
          { value: 1, text: "I have basic stages, but leads often stall without me noticing." },
          { value: 2, text: "Yes, every lead moves through defined CRM stages with next steps." }
        ]
      },
      {
        id: "s4q3",
        text: "Have you ever let a potential client go cold simply because you forgot to follow up on a proposal or email?",
        variants: {
          designer: "Have you ever realized a prospective client went silent, but you forgot to follow up because their proposal was lost in your sent mail folder?",
          marketer: "Have you ever let a high-value lead go cold because you forgot to follow up on a sent proposal or discovery call?",
          writer: "Have you ever lost a potential writing retainer because you delayed sending a proposal or forgot to check in after a call?"
        },
        options: [
          { value: 0, text: "Yes, I have definitely lost revenue this way." },
          { value: 1, text: "It has happened occasionally during busy stretches." },
          { value: 2, text: "No, my system ensures no lead is left without a follow-up." }
        ]
      },
      {
        id: "s4q4",
        text: "Do you have a documented follow-up schedule (e.g., follow up at 3 days, 7 days, 14 days) that you execute for every single proposal sent?",
        options: [
          { value: 0, text: "No, I follow up when I remember, or not at all." },
          { value: 1, text: "I follow up sometimes, but it's based on gut feel rather than a schedule." },
          { value: 2, text: "Yes, I follow a strict, systematic follow-up sequence." }
        ]
      },
      {
        id: "s4q5",
        text: "Can you accurately predict your business revenue for the next 60 days based on your current active pipeline?",
        options: [
          { value: 0, text: "No, I have no visibility into future revenue until a contract is signed." },
          { value: 1, text: "I can guess, but the numbers change constantly and aren't tracked." },
          { value: 2, text: "Yes, my pipeline auto-calculates weighted revenue projections." }
        ]
      }
    ]
  },
  {
    id: "client",
    name: "Client & Project Management",
    description: "Delivery control: project command centers, relational linking, portals, and unified offboarding.",
    questions: [
      {
        id: "s5q1",
        text: "Do you have a single, unified 'Command Center' dashboard for every active project you run?",
        options: [
          { value: 0, text: "No, project info is split across emails, Slack, and cloud folders." },
          { value: 1, text: "I have project pages, but I still have to dig elsewhere for details." },
          { value: 2, text: "Yes, a central dashboard holds everything related to the project." }
        ]
      },
      {
        id: "s5q2",
        text: "Are your project files, tasks, invoices, and client communication linked together inside that command center?",
        options: [
          { value: 0, text: "No, they live in separate apps (e.g., Google Drive, Gmail, Stripe)." },
          { value: 1, text: "Some are linked, but I still jump between tabs to connect the dots." },
          { value: 2, text: "Yes, all project elements are relationally connected in one database." }
        ]
      },
      {
        id: "s5q3",
        text: "Have you ever spent the first 15 minutes of a client call hunting through folders and threads for a file or project update?",
        variants: {
          designer: "Have you ever spent the first 15 minutes of a client call searching for the latest design version, feedback link, or invoice?",
          marketer: "Have you ever spent the first 15 minutes of a client call hunting for campaign links, reports, or task lists?",
          writer: "Have you ever spent the first 15 minutes of a client call looking for the latest draft version, brief, or feedback document?"
        },
        options: [
          { value: 0, text: "Yes, this happens on almost every client call." },
          { value: 1, text: "Sometimes, and it feels unprofessional to make them wait." },
          { value: 2, text: "No, everything is open and ready in one click." }
        ]
      },
      {
        id: "s5q4",
        text: "Can your client log into a private portal and see the project timeline, active tasks, and deliverables without emailing you?",
        options: [
          { value: 0, text: "No, I send updates manually via email or Slack." },
          { value: 1, text: "I share a static document, but it's rarely updated in real-time." },
          { value: 2, text: "Yes, they have a live client portal synced to my workspace." }
        ]
      },
      {
        id: "s5q5",
        text: "When a project ends, do you have a single button click that archives the project, updates your client history, and surfaces case study data?",
        options: [
          { value: 0, text: "No, closing a project is a messy manual process of cleaning up folders." },
          { value: 1, text: "I archive things eventually, but details get lost in the process." },
          { value: 2, text: "Yes, my workspace handles offboarding and project archiving systematically." }
        ]
      }
    ]
  },
  {
    id: "finance",
    name: "Financial Visibility",
    description: "Financial engine: real-time profit tracking, project margin audits, tax reserve routing, and cash runway calculations.",
    questions: [
      {
        id: "s6q1",
        text: "Can you see your total business revenue and expenses for the current month in real-time, on a single dashboard?",
        options: [
          { value: 0, text: "No, I only see this when I log into my bank account or at tax time." },
          { value: 1, text: "I use a spreadsheet or app, but it is several weeks out of date." },
          { value: 2, text: "Yes, a real-time dashboard shows my monthly financial position." }
        ]
      },
      {
        id: "s6q2",
        text: "Do you track the profit margin of each individual project (revenue minus expenses and hours spent)?",
        options: [
          { value: 0, text: "No, I just look at the total money coming into my bank account." },
          { value: 1, text: "I have a vague sense of which projects are profitable, but no calculations." },
          { value: 2, text: "Yes, project profitability is calculated automatically in my system." }
        ]
      },
      {
        id: "s6q3",
        text: "Have you ever delayed sending an invoice because gathering time logs, files, or payment details felt like a chore?",
        variants: {
          designer: "Have you ever delayed sending a project invoice by more than a week because gathering the deliverables and drafting the bill felt too administrative?",
          marketer: "Have you ever delayed invoicing a client because you had to manually calculate hourly overages or reconcile expenses?",
          writer: "Have you ever delayed sending a retainer invoice because you had to manually count hours or track down delivery approvals?"
        },
        options: [
          { value: 0, text: "Yes, I regularly delay billing because of the setup friction." },
          { value: 1, text: "Occasionally, if I have to compile messy logs." },
          { value: 2, text: "No, invoicing takes less than 60 seconds." }
        ]
      },
      {
        id: "s6q4",
        text: "Do you automatically set aside a percentage of every invoice payment for tax and business reserves in separate accounts?",
        options: [
          { value: 0, text: "No, I pay taxes out of my main checking account and hope I have enough." },
          { value: 1, text: "I try to transfer money, but I often dip into reserves for cash flow." },
          { value: 2, text: "Yes, taxes and reserves are calculated and transferred immediately." }
        ]
      },
      {
        id: "s6q5",
        text: "Do you know your exact 'runway' (how many months your business can survive if all client revenue stopped today)?",
        options: [
          { value: 0, text: "No, I operate month-to-month and don't know how long I would last." },
          { value: 1, text: "I have a rough estimate, but no calculated runway metric." },
          { value: 2, text: "Yes, my financial dashboard auto-computes my exact monthly runway." }
        ]
      }
    ]
  }
];

export const scoreBands = [
  {
    min: 0,
    max: 10,
    name: "Informal Foundation",
    description: "Your business runs entirely on memory and improvisation. While you're delivering work, you have no structured systems to support you. Adding a new client creates immediate overwhelm, and you're carrying the cognitive load of all unresolved details in your head."
  },
  {
    min: 11,
    max: 20,
    name: "Reactive Operator",
    description: "You have several tools in place, but they act as separate silos rather than a connected system. You are responding to events as they happen rather than directing them. You spend significant time switching between tabs and reconstructing context, leaving you one busy week away from details slipping through the cracks."
  },
  {
    min: 21,
    max: 32,
    name: "Emerging System",
    description: "You are actively trying to systematize your operations, and some areas are functional. However, execution remains inconsistent. You still experience scope drift, administrative friction before billing, or amnesia regarding lead acquisition, preventing you from reaching a stable operating rhythm."
  },
  {
    min: 33,
    max: 44,
    name: "Building Operator",
    description: "You have built functional setups across multiple areas of your business. Despite this progress, they still don't talk to each other. Your business can grow, but your admin overhead grows with it, locking you in a capacity ceiling where you are the bottleneck."
  },
  {
    min: 45,
    max: 54,
    name: "Connected Operator",
    description: "You have achieved a solid, deliberate operational architecture. Most key areas of your business run smoothly. The main hurdles left are connecting your deliverables directly to invoice statuses, automating onboarding, and gaining absolute real-time visibility into project profitability."
  },
  {
    min: 55,
    max: 60,
    name: "Serious Operator",
    description: "Your business is supported by a fully connected, relational system. Every client record holds its files, tasks, invoices, and notes. Profit margins are visible, client onboarding is standardized, and the business could survive your absence. Your operational standards match your premium rates."
  }
];

export const seriousOperatorBenchmarks = {
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

const causalConnections = {
  "foundation-client": "Without documented service packages, every client engagement is improvised from scratch. You cannot build a repeatable project command center when the deliverables themselves are a moving target.",
  "foundation-finance": "Without defined pricing architecture, your financial visibility remains retrospective rather than predictive. You are forced to react to past bank balances rather than forecasting project profitability.",
  "foundation-marketing": "Without a documented ICP, your content and outreach cannot target high-value clients. You waste time creating generic content that fails to feed a qualified pipeline.",
  "client-finance": "Without a connected project record, invoice status lives separately from deliverable status. You delay billing because compiling deliverables feels like a chore, creating unnecessary cash flow gaps.",
  "client-productivity": "Without a project record that houses all tasks, task management is detached from client context. You spend your day jumping between email and notes to figure out what actually needs to be delivered.",
  "content-marketing": "Without tracing content to client lead sources, you cannot know which self-promotional activities generate revenue. You treat content as a cost to be paid rather than an asset that builds your pipeline.",
  "marketing-foundation": "Without a structured acquisition pipeline, your business depends entirely on word-of-mouth that you cannot scale. You cannot project capacity because you cannot predict when the next client will arrive."
};

export const getCausalCopy = (section1, section2) => {
  const key1 = `${section1}-${section2}`;
  const key2 = `${section2}-${section1}`;
  return causalConnections[key1] || causalConnections[key2] || null;
};

export const generatePatternParagraph = (lowestSections, profession) => {
  if (!lowestSections || lowestSections.length < 2) {
    return "Your business operations are functional, but you are still operating in silos. Without a unified system, you spend unnecessary time switching between tools and manually connecting the dots.";
  }

  const s1 = lowestSections[0];
  const s2 = lowestSections[1];
  
  const causalCopy = getCausalCopy(s1.id, s2.id);

  if (causalCopy) {
    return `Your two lowest sections — ${s1.name} and ${s2.name} — are not separate failures. They are the same failure at two different surfaces. ${causalCopy} The root is one gap, not two: your business lacks a connected, relational workspace where these functions share a single data layer. Patching each tool separately will not resolve this.`;
  }

  return `Your lowest-scoring sections — ${s1.name} and ${s2.name} — are causing significant drag on your operations. Because these areas are disconnected, information gets lost in transition, requiring you to manually rebuild context and bridge the gaps between tools. The root cause is a lack of connected, relational architecture in your workspace.`;
};
