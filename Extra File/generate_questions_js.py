import json

# Read parsed questions from src/questions_new.json
with open("src/questions_new.json", "r", encoding="utf-8") as f:
    sections = json.load(f)

# Define Score Bands (the new 5-tier classification)
score_bands = [
  {
    "min": 0,
    "max": 15,
    "name": "Reactive Operation",
    "description": "Your business runs entirely on memory and improvisation. No architecture exists yet. Adding a new client creates immediate overwhelm, and you are carrying the cognitive load of all unresolved details in your head. Every gap between systems is a gap you fill by hand."
  },
  {
    "min": 16,
    "max": 30,
    "name": "Partial Infrastructure",
    "description": "You have several tools in place, but they act as separate silos rather than a connected system. You are responding to events as they happen rather than directing them. You spend significant time switching between tabs and reconstructing context, leaving you one busy week away from details slipping through the cracks."
  },
  {
    "min": 31,
    "max": 45,
    "name": "Emerging Architecture",
    "description": "You are actively trying to systematize your operations, and some areas are functional. However, key connections are still missing or inconsistent, preventing you from reaching a stable, repeatable operating rhythm."
  },
  {
    "min": 46,
    "max": 55,
    "name": "Near Operational",
    "description": "You have built functional setups across multiple areas of your business. Despite this progress, they still don't talk to each other. Your business can grow, but your admin overhead grows with it, locking you in a capacity ceiling where you are the bottleneck."
  },
  {
    "min": 56,
    "max": 60,
    "name": "Connected Operation",
    "description": "Your business is supported by a fully connected, relational system. Every client record holds its files, tasks, invoices, and notes. Profit margins are visible, client onboarding is standardized, and the business could survive your absence. Your operational standards match your premium rates."
  }
]

# Define Serious Operator Benchmarks
serious_operator_benchmarks = {
  "foundation": {
    "general": "A Serious Operator has pre-defined, standardized packages with explicit scope boundaries and a repeatable onboarding pipeline that takes less than 5 minutes to trigger.",
    "designer": "A Serious Operator has predefined Figma assets, standard design packages with locked revision counts, and a repeatable onboarding flow that takes under 5 minutes to trigger.",
    "marketer": "A Serious Operator has defined campaign packages, standardized report formats, and an onboarding intake checklist that runs exactly the same way for every new brand.",
    "writer": "A Serious Operator has locked editing and drafting packages, standardized content brief templates, and an onboarding intake form that automatically collects style guides."
  },
  "productivity": {
    "general": "A Serious Operator starts their day with a single dashboard showing only prioritized tasks that are relationally linked to active client projects. They never guess what to do next.",
    "designer": "A Serious Operator views a unified task list where creative assets and client feedback are linked directly to each design ticket. They never search through Slack for client specs.",
    "marketer": "A Serious Operator tracks execution tasks linked directly to campaign milestones and launch dates. They never skip a tracking parameter or setup step.",
    "writer": "A Serious Operator operates from a unified writing queue where outlines, drafts, and approval deadlines are bound to active project cards."
  },
  "content": {
    "general": "A Serious Operator writes from a centralized content calendar, planning at least two weeks out, and links every post relationally to the service package they want to fill.",
    "designer": "A Serious Operator plans their design case studies in advance, maintains a library of design assets, and links self-promotion directly to open design slots.",
    "marketer": "A Serious Operator plans their social insights 14 days out, drafts content systematically, and links every piece to the specific service or audit package they are running.",
    "writer": "A Serious Operator maintains a structured content library, drafts newsletter topics ahead of schedule, and maps content to their current editorial or retainer focus."
  },
  "marketing": {
    "general": "A Serious Operator maintains a CRM showing the exact value and stage of every lead, and follows a strict, pre-scheduled follow-up cadence for every proposal sent.",
    "designer": "A Serious Operator tracks prospective clients in a pipeline, sees active design proposals, and systematically follows up at 3, 7, and 14 days without relying on memory.",
    "marketer": "A Serious Operator tracks brand inquiries in a CRM and runs a strict, scheduled follow-up sequence on all proposals, ensuring no high-value contract drifts away.",
    "writer": "A Serious Operator monitors their retainer pipeline and executes a documented follow-up sequence for every pitch sent, keeping their pipeline predictable."
  },
  "client": {
    "general": "A Serious Operator opens a single client record containing tasks, files, invoices, and notes. Clients log into a live portal, and project archiving happens in one click.",
    "designer": "A Serious Operator has one record per client containing design briefs, active tasks, invoices, and Figma links. Clients access a portal to check progress, and offboarding is automated.",
    "marketer": "A Serious Operator accesses a central client record holding campaign plans, active tasks, reports, and invoices. Clients view real-time task boards in a synced portal.",
    "writer": "A Serious Operator manages work via a client command center linking content briefs, drafts, tasks, and retainer invoices. Clients review draft links in a secure portal."
  },
  "finance": {
    "general": "A Serious Operator views real-time monthly profit margins, tracks project-specific profitability, sets aside taxes automatically, and knows their exact monthly cash runway.",
    "designer": "A Serious Operator checks real-time margins, tracks design project margins based on hours spent, invoices in 60 seconds, and maintains a distinct tax routing reserve.",
    "marketer": "A Serious Operator views campaign ROI alongside client retainer profitability, handles invoicing instantly, and calculates business cash runway in real-time.",
    "writer": "A Serious Operator tracks retainer margins, auto-calculates hours spent vs billable values, sends invoices immediately, and maintains a calculated runway metric."
  }
}

# Define Causal Connections
causal_connections = {
  "foundation-client": "Without documented service packages, every client engagement is improvised from scratch. You cannot build a repeatable project command center when the deliverables themselves are a moving target.",
  "foundation-finance": "Without defined pricing architecture, your financial visibility remains retrospective rather than predictive. You are forced to react to past bank balances rather than forecasting project profitability.",
  "foundation-marketing": "Without a documented ICP, your content and outreach cannot target high-value clients. You waste time creating generic content that fails to feed a qualified pipeline.",
  "client-finance": "Without a connected project record, invoice status lives separately from deliverable status. You delay billing because compiling deliverables feels like a chore, creating unnecessary cash flow gaps.",
  "client-productivity": "Without a project record that houses all tasks, task management is detached from client context. You spend your day jumping between email and notes to figure out what actually needs to be delivered.",
  "content-marketing": "Without tracing content to client lead sources, you cannot know which self-promotional activities generate revenue. You treat content as a cost to be paid rather than an asset that builds your pipeline.",
  "marketing-foundation": "Without a structured acquisition pipeline, your business depends entirely on word-of-mouth that you cannot scale. You cannot project capacity because you cannot predict when the next client will arrive."
}

# Write JS file
js_content = f"""export const sections = {json.dumps(sections, indent=2, ensure_ascii=False)};

export const scoreBands = {json.dumps(score_bands, indent=2, ensure_ascii=False)};

export const seriousOperatorBenchmarks = {json.dumps(serious_operator_benchmarks, indent=2, ensure_ascii=False)};

export const causalConnections = {json.dumps(causal_connections, indent=2, ensure_ascii=False)};

export const getCausalCopy = (section1, section2) => {{
  const key1 = `${{section1}}-${{section2}}`;
  const key2 = `${{section2}}-${{section1}}`;
  return causalConnections[key1] || causalConnections[key2] || null;
}};

export const generatePatternParagraph = (lowestSections, profession) => {{
  if (!lowestSections || lowestSections.length < 2) {{
    return "Your business operations are functional, but you are still operating in silos. Without a unified system, you spend unnecessary time switching between tools and manually connecting the dots.";
  }}

  const s1 = lowestSections[0];
  const s2 = lowestSections[1];
  
  const causalCopy = getCausalCopy(s1.id, s2.id);

  if (causalCopy) {{
    return `Your two lowest sections — ${{s1.name}} and ${{s2.name}} — are not separate failures. They are the same failure at two different surfaces. ${{causalCopy}} The root is one gap, not two: your business lacks a connected, relational workspace where these functions share a single data layer. Patching each tool separately will not resolve this.`;
  }}

  return `Your lowest-scoring sections — ${{s1.name}} and ${{s2.name}} — are causing significant drag on your operations. Because these areas are disconnected, information gets lost in transition, requiring you to manually rebuild context and bridge the gaps between tools. The root cause is a lack of connected, relational architecture in your workspace.`;
}};
"""

with open("src/questions.js", "w", encoding="utf-8") as out:
    out.write(js_content)

print("Generated src/questions.js successfully!")
