import React, { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { 
  sections, 
  scoreBands, 
  seriousOperatorBenchmarks, 
  generatePatternParagraph,
  getCausalCopy
} from './questions';
// esp.js mock retired — real submission in handleEmailSubmit below
import { 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Mail, 
  Lock, 
  Calculator, 
  AlertCircle, 
  Layers, 
  Briefcase, 
  Clock, 
  Calendar, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  Eye,
  ChevronDown,
  TrendingUp,
  ShieldAlert,
  Zap,
  CheckSquare,
  X
} from 'lucide-react';

// Animated score ticker for landing page hero
function ScoreTeaseTicker() {
  const scores = [12, 38, 51, 29, 44, 57, 33, 48, 22, 55];
  const [idx, setIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % scores.length);
        setVisible(true);
      }, 200);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="score-tease-num"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      {scores[idx]}
    </span>
  );
}

// Animated number ticker for stats bar
function AnimatedNumber({ value, duration = 900 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) {
      setCount(end);
      return;
    }

    const incrementTime = Math.max(Math.floor(duration / end), 20);

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
}

// Helpers to extract and format question labels dynamically from their IDs
const getQuestionShortLabel = (qId) => {
  const match = qId.match(/q(.+)$/);
  if (!match) return '';
  return match[1].replace('_', '.');
};

const getQuestionFullLabel = (qId) => {
  return 'Q' + getQuestionShortLabel(qId);
};

const getQuestionContainerLabel = (qId) => {
  const short = getQuestionShortLabel(qId);
  return short.match(/^\d/) ? `0${short}` : short;
};

export default function App() {
  // Navigation & funnel states
  const [stage, setStage] = useState(() => localStorage.getItem('kos_stage') || 'landing');
  const [profession, setProfession] = useState(() => localStorage.getItem('kos_profession') || null);
  const [clientCount, setClientCount] = useState(() => localStorage.getItem('kos_clientCount') || null);
  
  // Answers state: { qId: answer_value }
  // Standard choice: 'A' | 'B' | 'C'
  // Scale (s5q2a): 1 | 2 | 3 | 4 | 5
  // Checklist (s5q5, s6q5): array of indices e.g. [0, 2]
  // Open text (s5q6_5_text): string
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('kos_answers');
      return saved ? JSON.parse(saved) : { s5q5: [], s6q5: [] };
    } catch {
      return { s5q5: [], s6q5: [] };
    }
  });
  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
    const saved = localStorage.getItem('kos_currentSectionIndex');
    return saved ? Number(saved) : 0;
  });
  
  // Lead info
  const [firstName, setFirstName] = useState(() => localStorage.getItem('kos_firstName') || '');
  const [lastName, setLastName] = useState(() => localStorage.getItem('kos_lastName') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('kos_email') || '');
  const [emailSubmitted, setEmailSubmitted] = useState(() => localStorage.getItem('kos_emailSubmitted') === 'true');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [emailFormFocus, setEmailFormFocus] = useState(false);
  const [emailError, setEmailError] = useState('');

  // LLM-generated report (returned from CF Worker on submission)
  const [generatedReport, setGeneratedReport] = useState(() => {
    try {
      const saved = localStorage.getItem('kos_generatedReport');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Results calculator states (Cost of Chaos)
  const [avgFee, setAvgFee] = useState(() => {
    const saved = localStorage.getItem('kos_avgFee');
    return saved ? Number(saved) : 2500;
  });
  const [activeClientsNum, setActiveClientsNum] = useState(() => {
    const saved = localStorage.getItem('kos_activeClientsNum');
    return saved ? Number(saved) : 4;
  });
  const [scopeCreepPercent, setScopeCreepPercent] = useState(() => {
    const saved = localStorage.getItem('kos_scopeCreepPercent');
    return saved ? Number(saved) : 20;
  });

  // Score reveal animation states
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showBand, setShowBand] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Expand/collapse logic for "View Reasoning" in results
  const [expandedReasoning, setExpandedReasoning] = useState({});

  // ── PostHog: track funnel stage transitions ──────────────────────────────
  useEffect(() => {
    if (stage === 'selector') {
      posthog.capture('funnel_started');
    } else if (stage === 'diagnostic') {
      posthog.capture('diagnostic_started', {
        profession,
        clientCount
      });
    } else if (stage === 'reveal') {
      const score = calculateTotalScore();
      posthog.capture('email_gate_viewed', {
        score,
        scoreBand: getScoreBand(score)?.name,
        profession,
        clientCount,
        answers,
        sectionScores: {
          foundation:   calculateSectionScore('foundation'),
          productivity: calculateSectionScore('productivity'),
          content:      calculateSectionScore('content'),
          marketing:    calculateSectionScore('marketing'),
          client:       calculateSectionScore('client'),
          finance:      calculateSectionScore('finance'),
        }
      });
    } else if (stage === 'results') {
      posthog.capture('results_viewed', {
        score: calculateTotalScore(),
        emailSubmitted,
        profession,
        clientCount,
        answers
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ── LocalStorage: Sync State on Changes ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem('kos_stage', stage);
    if (profession) {
      localStorage.setItem('kos_profession', profession);
    } else {
      localStorage.removeItem('kos_profession');
    }
    if (clientCount) {
      localStorage.setItem('kos_clientCount', clientCount);
    } else {
      localStorage.removeItem('kos_clientCount');
    }
    localStorage.setItem('kos_answers', JSON.stringify(answers));
    localStorage.setItem('kos_currentSectionIndex', String(currentSectionIndex));
    localStorage.setItem('kos_firstName', firstName);
    localStorage.setItem('kos_lastName', lastName);
    localStorage.setItem('kos_email', email);
    localStorage.setItem('kos_emailSubmitted', String(emailSubmitted));
    localStorage.setItem('kos_avgFee', String(avgFee));
    localStorage.setItem('kos_activeClientsNum', String(activeClientsNum));
    localStorage.setItem('kos_scopeCreepPercent', String(scopeCreepPercent));
    if (generatedReport) {
      localStorage.setItem('kos_generatedReport', JSON.stringify(generatedReport));
    } else {
      localStorage.removeItem('kos_generatedReport');
    }
  }, [
    stage, profession, clientCount, answers, currentSectionIndex,
    firstName, lastName, email, emailSubmitted, avgFee,
    activeClientsNum, scopeCreepPercent, generatedReport
  ]);


  // Scroll to top on stage change or section transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, currentSectionIndex]);

  // Track which question is currently visible in the center of the viewport (Scroll Spy)
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  useEffect(() => {
    if (stage !== 'diagnostic') return;
    
    const handleScroll = () => {
      const currentSection = sections[currentSectionIndex];
      let closestQuestionId = null;
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;
      
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
      
      if (isAtBottom && currentSection.questions.length > 0) {
        closestQuestionId = currentSection.questions[currentSection.questions.length - 1].id;
      } else {
        for (let i = 0; i < currentSection.questions.length; i++) {
          const q = currentSection.questions[i];
          const el = document.getElementById(`q-container-${q.id}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          // Calculate distance of container's center from viewport center
          const containerCenter = rect.top + rect.height / 2;
          const distance = Math.abs(containerCenter - viewportCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestQuestionId = q.id;
          }
        }
      }
      
      // Default to first question if no elements found/measured
      if (!closestQuestionId && currentSection.questions.length > 0) {
        closestQuestionId = currentSection.questions[0].id;
      }
      
      if (closestQuestionId) {
        setActiveQuestionId(closestQuestionId);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial run with a small delay to let content render/settle
    const initialTimeout = setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(initialTimeout);
    };
  }, [stage, currentSectionIndex, answers]);

  // Sync state to URL hash
  useEffect(() => {
    let expectedHash = '';
    if (stage === 'landing') expectedHash = '#/';
    else if (stage === 'selector') expectedHash = '#/selector';
    else if (stage === 'diagnostic') expectedHash = `#/diagnostic/${currentSectionIndex + 1}`;
    else if (stage === 'reveal') expectedHash = '#/reveal';
    else if (stage === 'results') expectedHash = '#/results';

    if (window.location.hash !== expectedHash) {
      window.location.hash = expectedHash;
    }
  }, [stage, currentSectionIndex]);

  // Sync body class to current stage for styling
  useEffect(() => {
    document.body.className = `stage-${stage}`;
    return () => {
      document.body.className = '';
    };
  }, [stage]);

  // Listen for browser back/forward (hash changes)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === '#/' || hash === '#') {
        setStage('landing');
      } else if (hash === '#/selector') {
        setStage('selector');
      } else if (hash.startsWith('#/diagnostic/')) {
        if (!profession || !clientCount) {
          setStage('selector');
          window.location.hash = '#/selector';
        } else {
          const secNum = parseInt(hash.replace('#/diagnostic/', ''), 10);
          if (secNum >= 1 && secNum <= 6) {
            setStage('diagnostic');
            setCurrentSectionIndex(secNum - 1);
          }
        }
      } else if (hash === '#/reveal') {
        if (!profession || !clientCount) {
          setStage('selector');
          window.location.hash = '#/selector';
        } else {
          setStage('reveal');
        }
      } else if (hash === '#/results') {
        if (!profession || !clientCount) {
          setStage('selector');
          window.location.hash = '#/selector';
        } else {
          setStage('results');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Run on initial load to handle deep links correctly (only if hash is present)
    if (window.location.hash && window.location.hash !== '#/') {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [profession, clientCount]);

  // Score counter animation in reveal stage
  useEffect(() => {
    if (stage === 'reveal') {
      const finalScore = Math.round(calculateTotalScore());
      if (finalScore === 0) {
        setAnimatedScore(0);
        setShowBand(true);
        setTimeout(() => setShowEmailGate(true), 500);
        return;
      }
      
      let start = 0;
      const duration = 3200; // 3.2 seconds
      const stepTime = Math.max(Math.floor(duration / finalScore), 25);
      
      const timer = setInterval(() => {
        start += 1;
        setAnimatedScore(start);
        if (start >= finalScore) {
          clearInterval(timer);
          setTimeout(() => setShowBand(true), 300);
          setTimeout(() => setShowEmailGate(true), 1500); // 1.5 seconds hold
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [stage]);

  // Initialize checklist answers when selector starts
  useEffect(() => {
    if (stage === 'selector') {
      setAnswers({
        s5q5: [],
        s6q5: []
      });
    }
  }, [stage]);

  // Score calculation logic
  const calculateSectionScore = (sectionId) => {
    if (sectionId === 'foundation' || sectionId === 'productivity' || sectionId === 'content' || sectionId === 'marketing') {
      // Sections 1-4: each question choice has A=0, B=1, C=2 points. Sum of 5 questions = max 10.
      const section = sections.find(s => s.id === sectionId);
      if (!section) return 0;
      return section.questions.reduce((sum, q) => {
        const val = answers[q.id];
        const points = val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0));
        return sum + points;
      }, 0);
    } else if (sectionId === 'client') {
      // Section 5: custom composite.
      // Scored multiple choice questions: Q1, Q2b, Q3, Q3.5, Q4, Q6. (6 Qs, max 12 raw points).
      // Checklist Q5: max 6 checked items.
      // S5 Score = (choices_sum / 12) * 8 + (checked_count / 6) * 2. (max 10).
      const mcqIds = ['s5q1', 's5q2b', 's5q3', 's5q3_5', 's5q4', 's5q6'];
      const choicesSum = mcqIds.reduce((sum, id) => {
        const val = answers[id];
        const points = val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0));
        return sum + points;
      }, 0);
      const checkedCount = (answers['s5q5'] || []).length;
      const score = (choicesSum / 12) * 8 + (checkedCount / 6) * 2;
      return parseFloat(score.toFixed(1));
    } else if (sectionId === 'finance') {
      // Section 6: custom composite.
      // Scored multiple choice questions: Q1, Q2, Q3, Q4. (4 Qs, max 8 raw points).
      // Checklist Q5: max 6 checked items.
      // S6 Score = (choices_sum / 8) * 8 + (checked_count / 6) * 2 = choices_sum + (checked_count / 6) * 2. (max 10).
      const mcqIds = ['s6q1', 's6q2', 's6q3', 's6q4'];
      const choicesSum = mcqIds.reduce((sum, id) => {
        const val = answers[id];
        const points = val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0));
        return sum + points;
      }, 0);
      const checkedCount = (answers['s6q5'] || []).length;
      const score = choicesSum + (checkedCount / 6) * 2;
      return parseFloat(score.toFixed(1));
    }
    return 0;
  };

  const calculateTotalScore = () => {
    const s1 = calculateSectionScore('foundation');
    const s2 = calculateSectionScore('productivity');
    const s3 = calculateSectionScore('content');
    const s4 = calculateSectionScore('marketing');
    const s5 = calculateSectionScore('client');
    const s6 = calculateSectionScore('finance');
    return parseFloat((s1 + s2 + s3 + s4 + s5 + s6).toFixed(1));
  };

  // Composites calculations
  const calculateComposites = () => {
    // 1. MIND_AS_OS: count of 'A' across S2Q1-Q5, S5Q1, S5Q3.5
    const mindAsOsQs = ['s2q1', 's2q2', 's2q3', 's2q4', 's2q5', 's5q1', 's5q3_5'];
    const mindAsOsCount = mindAsOsQs.reduce((count, id) => {
      return count + (answers[id] === 'A' ? 1 : 0);
    }, 0);

    // 2. FINANCIAL_INTELLIGENCE: S6 Score (0-10)
    const financialIntelligence = calculateSectionScore('finance');

    // 3. ATTRIBUTION_CAPABILITY: S3Q3 + S3Q4 + S4Q3 + S4Q4. (choices sum: A=0, B=1, C=2; max 8).
    const attribQs = ['s3q3', 's3q4', 's4q3', 's4q4'];
    const attributionCapability = attribQs.reduce((sum, id) => {
      const val = answers[id];
      return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
    }, 0);

    // 4. RELATIONAL_ARCH: (S5Q1 + S5Q3.5 + S5Q6) + (S5Q2b + S5Q4) + (OCI_CLIENT / 6 * 4). (max 14).
    const relQs1 = ['s5q1', 's5q3_5', 's5q6'];
    const relQs2 = ['s5q2b', 's5q4'];
    const relSum1 = relQs1.reduce((sum, id) => {
      const val = answers[id];
      return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
    }, 0);
    const relSum2 = relQs2.reduce((sum, id) => {
      const val = answers[id];
      return sum + (val === 'A' ? 0 : (val === 'B' ? 1 : (val === 'C' ? 2 : 0)));
    }, 0);
    const ociClient = (answers['s5q5'] || []).length;
    const relationalArchRaw = relSum1 + relSum2 + (ociClient / 6 * 4);
    // Scaled relational architecture score (0-10)
    const relationalArchScaled = parseFloat((relationalArchRaw * (10 / 14)).toFixed(1));

    // 5. OCI_TOTAL: count of checked items across s5q5 and s6q5 (max 12)
    const ociTotal = (answers['s5q5'] || []).length + (answers['s6q5'] || []).length;

    // 6. AI_READINESS: (OCI_TOTAL / 12 * 5) + (ATTRIBUTION_CAPABILITY / 8 * 3) + (FINANCIAL_INTELLIGENCE / 10 * 2). (max 10)
    const aiReadiness = (ociTotal / 12 * 5) + (attributionCapability / 8 * 3) + (financialIntelligence / 10 * 2);

    // 7. RISK_SCORE: (MIND_AS_OS / 7 * 3) + ((10 - FINANCIAL_INTELLIGENCE) / 10 * 4) + ((10 - relationalArchScaled) / 10 * 3). (max 10)
    const riskScore = (mindAsOsCount / 7 * 3) + ((10 - financialIntelligence) / 10 * 4) + ((10 - relationalArchScaled) / 10 * 3);

    // 8. CRGM: S5Q2a value (1-5)
    const crgmScore = answers['s5q2a'] || 1;

    return {
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
  };

  // Contradiction engine
  const getContradictionsList = () => {
    const list = [];
    const crgm = answers.s5q2a || 1;
    const s5q5_count = (answers.s5q5 || []).length;

    // Rule 1: Aspirational Record
    if (answers.s5q6 === 'C' && answers.s5q1 === 'A') {
      list.push({
        id: 'CONTRADICTION_001',
        title: 'Aspirational Record vs. Email Reality',
        description: 'You indicated that you have a connected client record page (S5Q6=C), but also stated that client records primarily live in email threads (S5Q1=A). This suggests the connected record exists as an aspiration rather than a daily reality.',
        evidence: 'S5Q6 = "C" (I have that record) vs. S5Q1 = "A" (Primary location is email)'
      });
    }
    // Rule 2: Double-Entry Leak
    if (answers.s5q4 === 'A' && answers.s6q2 === 'A') {
      list.push({
        id: 'CONTRADICTION_002',
        title: 'Instant Status vs. Memory-Based Invoicing',
        description: 'You indicated that you can produce a full project rundown in minutes (S5Q4=A), but also that you track outstanding invoices from memory (S6Q2=A). A complete rundown requires current payment status, which cannot be reliably pulled from memory.',
        evidence: 'S5Q4 = "A" (Under 5 mins from knowledge) vs. S6Q2 = "A" (Track invoices from memory)'
      });
    }
    // Rule 3: Solo Hubris (confidence vs record)
    if (crgm >= 4 && (answers.s5q1 === 'A' || answers.s5q1 === 'B')) {
      list.push({
        id: 'CONTRADICTION_003',
        title: 'High Confidence vs. Scattered Workspace',
        description: 'You feel highly confident in giving a status update in 10 minutes (S5Q2a>=4), yet your client records are scattered in email threads or separate files (S5Q1=A/B). Your update speed comes from temporary cognitive effort, not workspace infrastructure.',
        evidence: `S5Q2a = ${crgm}/5 (High confidence) vs. S5Q1 = "${answers.s5q1}" (Scattered/email records)`
      });
    }
    // Rule 4: Task system disconnect
    if (answers.s2q1 === 'C' && s5q5_count <= 2 && answers.s5q1 === 'B') {
      list.push({
        id: 'CONTRADICTION_004',
        title: 'Central Task System vs. Disconnected Client Info',
        description: 'You use a central task manager (S2Q1=C), yet you have fewer than 2 client record components in one place (S5Q5<=2) and your records are scattered (S5Q1=B). Your task manager is disconnected from client context.',
        evidence: `S2Q1 = "C" (Centralized tasks) vs. S5Q5 = ${s5q5_count}/6 components vs. S5Q1 = "B" (Scattered files)`
      });
    }
    // Rule 5: Behavioral confidence mismatch
    if (crgm >= 4 && (answers.s5q1 === 'B' || answers.s5q4 === 'B')) {
      list.push({
        id: 'CONTRADICTION_005',
        title: 'Perceived Update Speed vs. Structural Delay',
        description: 'You report high confidence in status updates (S5Q2a>=4), but also note that project records are scattered (S5Q1=B) and/or that updates take 10-15 minutes (S5Q4=B).',
        evidence: `S5Q2a = ${crgm}/5 (High confidence) vs. S5Q1 = "${answers.s5q1}" and S5Q4 = "${answers.s5q4}"`
      });
    }
    return list;
  };

  // Blind spots calculation
  const getBlindSpots = () => {
    const list = [];
    const comps = calculateComposites();
    const s5Score = calculateSectionScore('client');
    const s1Score = calculateSectionScore('foundation');
    const s6Score = calculateSectionScore('finance');
    const s2Score = calculateSectionScore('productivity');

    // 1. Solo Hubris (Confidence vs. Infrastructure Gap)
    if (comps.crgmScore >= 4 && answers.s5q1 !== 'C') {
      list.push({
        id: 'BLIND_SPOT_SOLO_HUBRIS',
        title: 'Solo Hubris (Confidence/Infrastructure Gap)',
        description: 'You have high confidence in your ability to retrieve status updates quickly, but lack the structural records to back it up. Your business relies on your personal working memory, creating a critical single point of failure.',
        remedy: 'Build a unified client project record so records maintain themselves relationally, rather than requiring you to pull status details from memory.',
        showChart: true
      });
    }

    // 2. Shadow System
    if (answers.s2q1 === 'C' && comps.ociTotal <= 5) {
      list.push({
        id: 'BLIND_SPOT_SHADOW_SYSTEM',
        title: 'Shadow System (Task/Record Disconnection)',
        description: 'You have invested time in building or using a task manager (high Productivity focus), but it is disconnected from your client project records and financial status. You are maintaining a personal workflow silo rather than business infrastructure.',
        remedy: 'Link task lists directly to client project cards and scopes of work, so task tracking updates client records automatically.'
      });
    }

    // 3. Documented Foundation Gap
    if (s1Score >= 7 && (s5Score <= 4 || s6Score <= 4)) {
      list.push({
        id: 'BLIND_SPOT_DOCUMENTED_FOUNDATION',
        title: 'Documented Foundation (Positioning/Execution Mismatch)',
        description: 'Your business foundation (strategy and positioning) is emerging or operational, but your client delivery and financial controls are dragging behind. You are winning premium clients but executing with amateur backend mechanics.',
        remedy: 'Standardize client intake pipelines and establish per-project profitability tracking so that your back-office matches your premium front-end positioning.'
      });
    }

    // 4. Manual Bridge
    if (comps.mindAsOs >= 4) {
      list.push({
        id: 'BLIND_SPOT_MANUAL_BRIDGE',
        title: 'The Manual Bridge (Mind-as-OS)',
        description: 'You are operating as the connective tissue of your business. Communication, tasks, invoices, and deliverables are bridged by your working memory rather than automated or relational databases. This is the primary driver of operational fatigue.',
        remedy: 'Build a relational client project hub to automatically associate deliverables with files, tasks, and billing status, removing yourself as the manual linker.'
      });
    }

    return list;
  };

  // Lowest sections for pattern and leverage
  const getLowestSections = () => {
    return sections
      .map(s => ({
        id: s.id,
        name: s.name,
        score: calculateSectionScore(s.id)
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return sections.findIndex(s => s.id === a.id) - sections.findIndex(s => s.id === b.id);
      })
      .slice(0, 2);
  };

  // Highest section for strengths
  const getHighestSection = () => {
    return sections
      .map(s => ({
        id: s.id,
        name: s.name,
        score: calculateSectionScore(s.id)
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return sections.findIndex(s => s.id === a.id) - sections.findIndex(s => s.id === b.id);
      })[0];
  };

  // Leverage Analysis
  const getLeverageAnalysis = () => {
    // Weights based on downstream dependents + 1
    const leverageWeights = {
      foundation: 4,
      client: 3,
      content: 2,
      marketing: 2,
      productivity: 1,
      finance: 1
    };

    const sectionLeverages = sections.map(s => {
      const score = calculateSectionScore(s.id);
      const weight = leverageWeights[s.id] || 1;
      const headroom = 10 - score;
      const leverageScore = headroom * weight;
      return {
        id: s.id,
        name: s.name,
        score,
        leverageScore: parseFloat(leverageScore.toFixed(1)),
        weight
      };
    });

    return sectionLeverages.sort((a, b) => b.leverageScore - a.leverageScore)[0];
  };

  // Recommendation builder
  const getRecommendations = () => {
    const list = [];
    const comps = calculateComposites();

    const recCatalog = {
      foundation: {
        title: 'Lock Standardized Service Packages & Qualification Intake',
        addresses: 'Business Foundation & Strategy',
        revealed: `You indicated that pricing is defined in conversation (S1Q2=${answers.s1q2 || 'A'}) and proposal building takes significant time (S1Q3=${answers.s1q3 || 'A'}).`,
        why: 'Pricing and scoping case-by-case creates a massive upstream bottleneck. It forces you to write custom proposals and makes it impossible to automate onboarding or calculate baseline project profitability.',
        what: {
          designer: 'Document 3 standardized design service tiers (e.g., Brand Identity, UI Package, retainer) with locked scopes and Figma assets. Create a Typeform intake form to filter leads before booking calls.',
          marketer: 'Establish 3 predefined campaign and audit retainer packages with explicit channel boundaries. Build a brief intake qualifying form to eliminate low-budget leads early.',
          writer: 'Standardize retainer editing and content bundles with fixed word counts. Use a simple qualification page to automate intake requirements before proposals.',
          other: 'Define 3 standardized productized service packages with locked scopes. Create a repeatable, pre-call intake form to qualify client budgets and requirements.'
        }
      },
      productivity: {
        title: 'Establish a Unified Task & Execution Command Center',
        addresses: 'Productivity & Task Management',
        revealed: `You indicated that tasks go into a mental queue (S2Q1=${answers.s2q1 || 'A'}) and you switch between multiple tabs to reconstruct context (S2Q3=${answers.s2q3 || 'A'}).`,
        why: 'Relying on mental bandwidth to track daily priorities drains your creative energy. Detaching task execution from the client project record creates context-switching delay and leads to missed deadlines.',
        what: {
          designer: 'Build a single task database in Notion. Link design tickets directly to project cards and Figma workboards. Limit your daily active queue to 3 priority items.',
          marketer: 'Build a unified campaign execution board. Link analytics tracking, asset collection, and copy approvals to campaign cards so everything is accessible in one view.',
          writer: 'Establish a central drafting queue. Group writing tasks by research, draft, and client review stages. Link reference folders and client edits to each content card.',
          other: 'Build a central dashboard in Notion. Create a relation between tasks and active projects so that checking off a task automatically updates the project milestone status.'
        }
      },
      content: {
        title: 'Build a Centralized 14-Day Content and Topic Pipeline',
        addresses: 'Content & Social Media',
        revealed: `You indicated that you publish reactively (S3Q1=${answers.s3q1 || 'A'}) and store files in disconnected folders (S3Q4=${answers.s3q4 || 'A'}).`,
        why: 'Publishing reactively makes self-promotion feel like an emergency. Maintaining a content calendar in a separate silo means writing is detached from your actual service availability.',
        what: {
          designer: 'Create a Notion portfolio asset vault. Set up a content calendar where design case studies and visual tips are scheduled 14 days out, mapped to your booking calendar.',
          marketer: 'Establish a centralized topic cluster board. Schedule marketing teardowns and operational insights 14 days in advance, directly promoting your retainer packages.',
          writer: 'Set up an editorial dashboard. Maintain a rolling bank of 10 newsletter ideas and pre-schedule social insights, linking posts to active service retaking slots.',
          other: 'Build a centralized content library. Schedule self-promotions and business lessons in advance, ensuring your publishing volume remains steady during busy client weeks.'
        }
      },
      marketing: {
        title: 'Implement a CRM Pipeline and Standardized Follow-up Cadence',
        addresses: 'Marketing & Pipeline',
        revealed: `You indicated that pipeline tracking lives in memory or email (S4Q1=${answers.s4q1 || 'A'}) and proposal follow-up is case-by-case (S4Q3=${answers.s4q3 || 'A'}).`,
        why: 'A memory-based pipeline creates the "feast-or-famine" cycle. When you are busy delivering client work, sales drop off because you lack a visible pipeline reminding you to follow up.',
        what: {
          designer: 'Set up a visual Kanban board for your design pipeline. Establish a strict rule: follow up on sent proposals at 3, 7, and 14 days. Never let a design lead fade out.',
          marketer: 'Build a brand pipeline tracker. Standardize proposal follow-up emails, and track every brand inquiry stage from first touch to signed contract.',
          writer: 'Implement a retainer lead pipeline. Maintain active contacts and schedule pitches in advance, using predefined templates for follow-up emails.',
          other: 'Create a simple CRM board. Track leads from qualification to negotiation, and automate follow-up reminders to protect your closing rate.'
        }
      },
      client: {
        title: 'Build a Connected Client Project Hub (Relational Workspace)',
        addresses: 'Client & Project Management',
        revealed: `You indicated that project records live in email threads (S5Q1=${answers.s5q1 || 'A'}) and compiling status updates takes time (S5Q4=${answers.s5q4 || 'A'}).`,
        why: 'Using email threads as client records is the most expensive operational gap. It forces you to act as the manual link between briefs, deliverables, and invoices, producing constant cognitive drag.',
        what: {
          designer: 'Build one record template per client. In this record, embed project briefs, Figma workspace links, revision trackers, task databases, and invoice statuses. Share a clean client-facing dashboard.',
          marketer: 'Build a client hub that links campaign briefs, active ad account tasks, report links, and billing histories. Give clients a view-only link to review live campaign status.',
          writer: 'Create a writer dashboard for each client. Link content briefs, draft links, edit requests, and billing records in one card. Share this card with the client to eliminate draft-tracking emails.',
          other: 'Establish a relational client portal. Connect active deliverable lists, invoice statuses, call notes, and assets in one master Notion database so client info updates in real-time.'
        }
      },
      finance: {
        title: 'Establish Daily Billing Controls and Margin Tracking',
        addresses: 'Financial Visibility',
        revealed: `You indicated that you track invoices from memory (S6Q2=${answers.s6q2 || 'A'}) and per-project profitability is not calculated (S6Q3=${answers.s6q3 || 'A'}).`,
        why: 'Tracking financials from memory creates cash flow risks and lets unprofitable projects drain your margins. You cannot build a healthy business if you cannot verify which clients are profitable.',
        what: {
          designer: 'Build an invoice log linked to client projects. Automatically deduct estimated taxes (e.g., 25-30%) into a routing reserve. Calculate project margins based on creative hours spent vs project fees.',
          marketer: 'Link client retainer accounts to monthly invoicing cards. Log tracking expenses and hourly metrics to calculate the true margin on each client retainer.',
          writer: 'Set up a client billing dashboard. Track project-by-project margins based on writing time spent, and automate monthly recurring retainer billing.',
          other: 'Establish a central finance tracker. View revenue history, outstanding invoices, and projected pipeline in one dashboard. Track margins to avoid taking unprofitable projects.'
        }
      }
    };

    const leverageWeights = { foundation: 4, client: 3, content: 2, marketing: 2, productivity: 1, finance: 1 };
    const rankedSections = sections
      .map(s => {
        const score = calculateSectionScore(s.id);
        const weight = leverageWeights[s.id] || 1;
        const leverageScore = (10 - score) * weight;
        return { id: s.id, name: s.name, leverageScore };
      })
      .sort((a, b) => b.leverageScore - a.leverageScore);

    rankedSections.slice(0, 3).forEach((sec, idx) => {
      const template = recCatalog[sec.id];
      if (template) {
        const professionAction = template.what[profession] || template.what['general'] || '';
        list.push({
          priority: idx + 1,
          title: template.title,
          addresses: template.addresses,
          revealed: template.revealed,
          why: template.why,
          action: professionAction
        });
      }
    });

    return list;
  };

  // Prior attempt helper (Prior-Failure Wedge)
  const getPriorFailureWedge = () => {
    const priorSignal = answers.s5q6_5;
    const textReason = answers.s5q6_5_text || '';

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

  const getScoreBand = (score) => {
    return scoreBands.find(band => score >= band.min && score <= band.max) || scoreBands[1];
  };

  const getScoreStatus = (val) => {
    if (val <= 4.0) return { text: "Critical Gap", class: "critical" };
    if (val <= 7.0) return { text: "Needs Attention", class: "warning" };
    return { text: "Systematized", class: "healthy" };
  };

  const handleSelectChoice = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    posthog.capture('question_answered', {
      questionId,
      answerValue: value,
      profession,
      clientCount
    });
  };

  const handleSelectChecklist = (questionId, optionIndex) => {
    const currentList = answers[questionId] || [];
    let newList;
    if (currentList.includes(optionIndex)) {
      newList = currentList.filter(item => item !== optionIndex);
    } else {
      newList = [...currentList, optionIndex];
    }
    setAnswers(prev => ({
      ...prev,
      [questionId]: newList
    }));
    posthog.capture('question_answered', {
      questionId,
      answerValue: newList,
      profession,
      clientCount
    });
  };

  const isSectionComplete = (section) => {
    return section.questions.every(q => {
      if (q.type === 'checklist') return true; 
      if (q.id === 's5q6_5') return answers[q.id] !== undefined; 
      return answers[q.id] !== undefined;
    });
  };

  const handleNextSection = () => {
    const currentSection = sections[currentSectionIndex];
    const sectionScore = calculateSectionScore(currentSection.id);
    posthog.capture('section_completed', {
      sectionId: currentSection.id,
      sectionIndex: currentSectionIndex,
      sectionScore,
      profession,
      clientCount
    });

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setStage('reveal');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!firstName.trim()) { setEmailError('Please enter your first name.'); return; }
    if (!email || !email.includes('@')) { setEmailError('Please enter a valid email address.'); return; }

    setIsSubmittingEmail(true);

    // PostHog: identify the lead immediately (merges anonymous session)
    posthog.identify(email, {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      profession,
      clientCount,
      totalScore: calculateTotalScore(),
    });
    posthog.capture('lead_submitted', {
      score: calculateTotalScore(),
      profession,
      hasLastName: Boolean(lastName.trim()),
    });

    // ── Fire-and-forget: navigate immediately, report arrives by email ──────
    const workerUrl = import.meta.env.VITE_CF_WORKER_URL || 'http://localhost:8787';
    fetch(`${workerUrl}/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim() || '',
        email: email.trim(),
        profession,
        clientCount,
        score: calculateTotalScore(),
        sectionScores: {
          foundation:   calculateSectionScore('foundation'),
          productivity: calculateSectionScore('productivity'),
          content:      calculateSectionScore('content'),
          marketing:    calculateSectionScore('marketing'),
          client:       calculateSectionScore('client'),
          finance:      calculateSectionScore('finance'),
        },
        answers,
      }),
    })
    .then((res) => res.ok ? res.json() : null)
    .then((report) => {
      if (report) {
        setGeneratedReport(report);
        posthog.capture('report_generated', {
          riskLevel: report.riskLevel,
          diagnosisLabel: report.primaryDiagnosis?.label,
        });
      }
    })
    .catch((err) => console.error('Background report generation failed:', err));

    // ── Authentic 12-second loading sequence ──────────────────────────────────
    const messages = [
      'Analyzing your responses...',
      'Building your operational report...',
      'Calculating your risk score...',
      'Preparing your PDF...',
    ];
    setLoadingMessage(messages[0]);
    const intervalId = setInterval(() => {
      setLoadingMessage(prev => {
        const idx = messages.indexOf(prev);
        return messages[Math.min(idx + 1, messages.length - 1)];
      });
    }, 3000);

    await new Promise(resolve => setTimeout(resolve, 12000));
    clearInterval(intervalId);

    // Navigate after delay
    setEmailSubmitted(true);
    setIsSubmittingEmail(false);
    setLoadingMessage('');
    setStage('results');
  };

  const handleSkipEmail = () => {
    posthog.capture('email_gate_skipped', { score: calculateTotalScore() });
    setEmailSubmitted(false);
    setStage('results');
  };

  const resetFunnel = () => {
    localStorage.removeItem('kos_stage');
    localStorage.removeItem('kos_profession');
    localStorage.removeItem('kos_clientCount');
    localStorage.removeItem('kos_answers');
    localStorage.removeItem('kos_currentSectionIndex');
    localStorage.removeItem('kos_firstName');
    localStorage.removeItem('kos_lastName');
    localStorage.removeItem('kos_email');
    localStorage.removeItem('kos_emailSubmitted');
    localStorage.removeItem('kos_generatedReport');
    localStorage.removeItem('kos_avgFee');
    localStorage.removeItem('kos_activeClientsNum');
    localStorage.removeItem('kos_scopeCreepPercent');

    setAnswers({
      s5q5: [],
      s6q5: []
    });
    setCurrentSectionIndex(0);
    setProfession(null);
    setClientCount(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setEmailError('');
    setEmailSubmitted(false);
    setGeneratedReport(null);
    setStage('landing');
    setAnimatedScore(0);
    setShowBand(false);
    setShowEmailGate(false);
    setShowSuccessPopup(false);
    setExpandedReasoning({});
  };

  const getSectionIcon = (id) => {
    switch (id) {
      case 'foundation': return <Layers className="text-accent" size={18} />;
      case 'productivity': return <Clock className="text-accent" size={18} />;
      case 'content': return <Calendar className="text-accent" size={18} />;
      case 'marketing': return <Briefcase className="text-accent" size={18} />;
      case 'client': return <Sparkles className="text-accent" size={18} />;
      case 'finance': return <DollarSign className="text-accent" size={18} />;
      default: return null;
    }
  };

  const toggleReasoning = (id) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const navigateToHome = (e) => {
    if (e) e.preventDefault();
    resetFunnel();
  };

  // Dynamic calculations for display in Results stage
  const composites = stage === 'results' ? calculateComposites() : null;
  const lowestSections = stage === 'results' ? getLowestSections() : [];
  const highestSection = stage === 'results' ? getHighestSection() : null;
  const leverageAnalysis = stage === 'results' ? getLeverageAnalysis() : null;
  const recommendationsList = stage === 'results' ? getRecommendations() : [];
  const priorFailureWedge = stage === 'results' ? getPriorFailureWedge() : null;
  const contradictions = stage === 'results' ? getContradictionsList() : [];
  const activeBlindSpots = stage === 'results' ? getBlindSpots() : [];

  return (
    <div className="app-container">
      {/* Logo Header */}
      <header className="app-header">
        <div className="logo-text" onClick={navigateToHome} style={{ cursor: 'pointer' }}>
          <svg className="logo-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.22 451">
            <polygon points="444.22 294.59 390.95 380.92 317.41 345.33 277.69 326.11 277.69 451 166.69 451 166.69 326.11 126.97 345.33 53.42 380.92 0 294.63 76.51 243.82 104.09 225.51 62.43 199.85 62.36 199.82 .83 161.93 48.88 62.46 117.77 98.97 166.69 124.9 166.69 0 277.69 0 277.69 124.9 346.56 88.37 395.47 62.44 443.58 161.95 361.53 211.71 348.16 219.82 333.26 228.86 444.22 294.59"/>
          </svg>
          <span className="logo-title">KineticOS</span>
        </div>
      </header>

      {/* Main content body */}
      <main className="content-wrapper">
        
        {/* STAGE 1: LANDING PAGE */}
        {stage === 'landing' && (
          <div className="animate-fade-in hero-container hero-v2">

            {/* Main headline with accent streak */}
            <h1 className="hero-headline-v2">
              Know where your business stands<br />across <span className="text-accent">6 areas</span> in <span className="text-accent">7 minutes</span>.
            </h1>

            {/* Landing Honesty Engine Card */}
            <div className="landing-honesty-container">
              <p className="honesty-line-main">Answer for where you are today, not where you're headed.</p>
              <p className="honesty-line-sub">The gap between the two is exactly what this diagnostic surfaces.</p>
            </div>

            {/* CTA button with pulse ring */}
            <div className="hero-cta-wrapper">
              <div className="hero-cta-pulse-ring" />
              <button
                className="btn-primary btn-hero-cta"
                onClick={() => setStage('selector')}
              >
                <span>Find My Score</span>
                <ArrowRight size={28} />
              </button>
            </div>

            <p className="hero-lead hero-lead-v2">
              Score your practice across 6 operational areas. Get a root-cause breakdown of what your current setup costs you every month.
            </p>

            {/* Empty space placeholder where the score tease used to be */}
            <div className="hero-score-tease-placeholder" />

            {/* Side-by-side Row container */}
            <div className="hero-cards-row">
              {/* Animated score tease strip */}
              <div className="hero-score-tease">
                <div className="tease-left">
                  <div className="tease-main-text">Your score could be out of 60.</div>
                  <div className="tease-sub-text">Find out where you land.</div>
                </div>
                <div className="tease-divider" />
                <div className="tease-right">
                  <ScoreTeaseTicker />
                </div>
              </div>

              {/* 3-col stat bar */}
              <div className="hero-stat-bar">
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    <AnimatedNumber value={6} />
                  </span>
                  <span className="hero-stat-label hero-stat-label-animate">Areas Scored</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    <AnimatedNumber value={30} />
                  </span>
                  <span className="hero-stat-label hero-stat-label-animate">Questions</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    <AnimatedNumber value={7} /><span style={{fontSize:'0.7rem', fontWeight:700}}>min</span>
                  </span>
                  <span className="hero-stat-label hero-stat-label-animate">Avg. Time</span>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <Check size={13} strokeWidth={3} />
                <span>Specific by area</span>
              </div>
              <div className="hero-trust-item">
                <Check size={13} strokeWidth={3} />
                <span>Root cause identified</span>
              </div>
              <div className="hero-trust-item">
                <Check size={13} strokeWidth={3} />
                <span>PDF audit report</span>
              </div>
            </div>

          </div>
        )}

        {/* STAGE 2: PROFESSION & CLIENT COUNT SELECTOR */}
        {stage === 'selector' && (
          <div className="animate-fade-in">
            <h2 className="mb-24 text-center">Tailoring your diagnostic</h2>
            <p className="text-center mb-40">
              We customize the questions and benchmarks based on your business type and size.
            </p>

            <div className="card">
              <h3 className="mb-12">What kind of creative work do you do?</h3>
              <div className="option-grid option-grid-2x2 mb-32">
                {[
                  { id: 'designer', label: 'Freelance Designer', sub: 'Graphic, brand, UI/UX, motion' },
                  { id: 'marketer', label: 'Freelance Marketer', sub: 'Paid ads, content, strategy' },
                  { id: 'writer', label: 'Freelance Writer', sub: 'Copy, content, editorial' },
                  { id: 'other', label: 'Other Freelancer', sub: 'Multiple skills / general creative' }
                ].map(p => (
                  <button 
                    key={p.id}
                    className={`option-card ${profession === p.id ? 'selected' : ''}`}
                    onClick={() => setProfession(p.id)}
                  >
                    <div>
                      <div className="option-label">{p.label}</div>
                      <div className="option-card-sub">{p.sub}</div>
                    </div>
                    <div className="checkmark"></div>
                  </button>
                ))}
              </div>

              <h3 className="mb-12">How many active clients are you currently working with?</h3>
              <div className="option-grid option-grid-2x2">
                {[
                  { id: '3-4', label: '3 to 4 clients', desc: 'Facing capacity ceiling' },
                  { id: '5+', label: '5 or more clients', desc: 'Need active systems & records' }
                ].map(c => (
                  <button 
                    key={c.id}
                    className={`option-card ${clientCount === c.id ? 'selected' : ''}`}
                    onClick={() => setClientCount(c.id)}
                  >
                    <div>
                      <div className="option-label">{c.label}</div>
                      <div className="option-card-sub">{c.desc}</div>
                    </div>
                    <div className="checkmark"></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="honesty-line-container text-center mb-24" style={{ opacity: 0.8, color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 24px auto' }}>
              <p className="m-0 text-sm">
                Answer for where you are today, not where you're headed.
              </p>
              <p className="m-0 text-sm">
                The gap between the two is exactly what this diagnostic surfaces.
              </p>
            </div>

            <div className="funnel-nav-buttons">
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => setStage('landing')}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button 
                type="button"
                className="btn-primary"
                disabled={!profession || !clientCount}
                onClick={() => setStage('diagnostic')}
              >
                <span>Start My Diagnostic</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: DIAGNOSTIC QUESTIONNAIRE */}
        {stage === 'diagnostic' && (
          <>
            {(() => {
              const currentSection = sections[currentSectionIndex];
              const answeredInSection = currentSection.questions.filter(q => {
                if (q.type === 'checklist') return true;
                return answers[q.id] !== undefined;
              }).length;
              const sectionScore = calculateSectionScore(currentSection.id);
              
              return (
                <>
                  {/* Sticky Right-Side Section Progress Tracker - Placed outside animate-slide-left for relative-to-viewport fixed positioning */}
                  <div className="sticky-section-tracker">
                    {currentSection.questions.map((q, idx) => {
                      const isAnswered = q.type === 'checklist'
                        ? (answers[q.id] && answers[q.id].length > 0)
                        : (answers[q.id] !== undefined);
                      const isActive = activeQuestionId === q.id;
                      const qShortLabel = getQuestionShortLabel(q.id);
                      const qFullLabel = getQuestionFullLabel(q.id);
                      const isLongLabel = qShortLabel.length > 2;
                      return (
                        <div key={q.id} className="tracker-dot-wrapper">
                          <button
                            type="button"
                            className={`tracker-dot ${isAnswered ? 'answered' : ''} ${isActive ? 'active' : ''} ${isLongLabel ? 'long-label' : ''}`}
                            onClick={() => {
                              const el = document.getElementById(`q-container-${q.id}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          >
                            {isAnswered ? "✓" : qShortLabel}
                          </button>
                          <span className="tracker-tooltip">
                            {isAnswered ? `${qFullLabel}: Answered` : `${qFullLabel}: Pending`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="animate-slide-left w-full">
                    <div className="progress-header">
                      <div>
                        <span className="progress-title-sub text-mono">[0{currentSectionIndex + 1}/06]</span>
                        <h2 className="text-sm mt-4 m-0 uppercase font-semibold">
                          {currentSection.name}
                        </h2>
                      </div>
                      <div className="progress-score-live text-mono">
                        LIVE SCORE: {sectionScore}/10
                      </div>
                    </div>

                    <div className="progress-bar-track">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${((currentSectionIndex * 5 + Math.min(answeredInSection, 5)) / 30) * 100}%` }}
                      ></div>
                    </div>

                    <div className="section-opener-card">
                      <div className="section-opener-content">
                        <span className="section-opener-pill">[ Serious Operator Standard ]</span>
                        <p className="section-opener-desc">
                          {seriousOperatorBenchmarks[currentSection.id] ? (
                            profession && seriousOperatorBenchmarks[currentSection.id][profession] 
                              ? seriousOperatorBenchmarks[currentSection.id][profession] 
                              : seriousOperatorBenchmarks[currentSection.id].general
                          ) : ""}
                        </p>
                      </div>
                    </div>

                    {currentSection.questions.map((q, idx) => (
                      <div key={q.id} id={`q-container-${q.id}`} className="question-container">
                        <div className="question-text">
                          <span className="question-num text-mono">
                            [{getQuestionContainerLabel(q.id)}]
                          </span>
                          {q.text}
                        </div>
                        
                        {q.type === 'choice' && (
                          <div className="choices-stack">
                            {q.options.map(option => (
                              <button
                                key={option.label}
                                className={`choice-button ${answers[q.id] === option.label ? 'selected' : ''}`}
                                onClick={() => handleSelectChoice(q.id, option.label)}
                              >
                                <span className="choice-badge">{option.label}</span>
                                <span>{option.text}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === 'scale' && (
                          <div className="scale-container">
                            <div className="scale-buttons">
                              {[1, 2, 3, 4, 5].map(val => (
                                <button
                                  type="button"
                                  key={val}
                                  className={`scale-button ${answers[q.id] === val ? 'selected' : ''}`}
                                  onClick={() => handleSelectChoice(q.id, val)}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            <div className="scale-labels text-xs text-secondary mt-8">
                              <span>1: Hard limit / memory-based</span>
                              <span>5: Confident / one connected page</span>
                            </div>
                          </div>
                        )}

                        {q.type === 'checklist' && (
                          <div className="checklist-container mt-12">
                            <div className="checklist-grid">
                              {q.options.map((option, oIdx) => {
                                const isChecked = (answers[q.id] || []).includes(oIdx);
                                return (
                                  <button
                                    type="button"
                                    key={oIdx}
                                    className={`checklist-item-btn ${isChecked ? 'checked' : ''}`}
                                    onClick={() => handleSelectChecklist(q.id, oIdx)}
                                  >
                                    <div className={`checkbox-box ${isChecked ? 'checked' : ''}`}>
                                      {isChecked && <Check size={14} className="checkbox-check" />}
                                    </div>
                                    <span className="checklist-item-text">{option.text}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {q.id === 's5q6_5' && q.has_open_text && (answers[q.id] === 'A' || answers[q.id] === 'B') && (
                          <div className="conditional-textarea mt-16 animate-fade-in">
                            <label className="textarea-label text-sm font-semibold mb-6 block">
                              {q.open_text_label}
                            </label>
                            <textarea
                              className="textarea-input"
                              placeholder="Setup time too high, template broke, too complex, got busy, etc..."
                              value={answers['s5q6_5_text'] || ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, s5q6_5_text: e.target.value }))}
                              maxLength={500}
                              rows={3}
                            />
                          </div>
                        )}

                      </div>
                    ))}

                    {isSectionComplete(currentSection) && (
                      <div className="section-bridge-container animate-fade-in">
                        {currentSectionIndex === 1 && (
                          <div className="micro-progress-hint text-xs text-accent text-mono mb-8 uppercase tracking-wider text-center" style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>
                            You're 35% through. Section 3 takes about 90 seconds.
                          </div>
                        )}
                        <p className="section-bridge-text" style={{ marginBottom: 0 }}>
                          {currentSectionIndex === 0 && (
                            <>
                              You've been describing how you define and qualify what comes into your business.
                              <br />
                              The next section looks at how you manage what's already inside it.
                            </>
                          )}
                          {currentSectionIndex === 1 && (
                            <>
                              You've been describing how your work gets organized and executed.
                              <br />
                              The next section looks at how your work gets found.
                            </>
                          )}
                          {currentSectionIndex === 2 && (
                            <>
                              You've been describing your content.
                              <br />
                              The next section looks at what happens to the leads that content touches.
                            </>
                          )}
                          {currentSectionIndex === 3 && (
                            <>
                              You've been describing how clients find you.
                              <br />
                              The next section looks at what happens once they're in.
                            </>
                          )}
                          {currentSectionIndex === 4 && (
                            <>
                              Client systems scoped.
                              <br />
                              Finally, let's review your real-time financial controls.
                            </>
                          )}
                          {currentSectionIndex === 5 && (
                            <>
                              Operational diagnostic complete.
                              <br />
                              Let's compute your total score.
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="funnel-nav-buttons mt-32">
                      <button 
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          if (currentSectionIndex === 0) {
                            setStage('selector');
                          } else {
                            setCurrentSectionIndex(prev => prev - 1);
                          }
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Previous</span>
                      </button>
                      <button 
                        type="button"
                        className="btn-primary"
                        disabled={!isSectionComplete(currentSection)}
                        onClick={handleNextSection}
                      >
                        <span>{currentSectionIndex < 5 ? "Next Section" : "Compute Score"}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* STAGE 4: SCORE REVEAL & EMAIL GATE */}
        {stage === 'reveal' && (
          <div className="score-reveal-wrapper animate-fade-in">
            {!showEmailGate ? (
              <>
                <div className="score-display-ring">
                  <span className="score-label">
                    Your Diagnostic Result
                  </span>
                  <div className="score-number">{animatedScore}</div>
                  <div className="score-max">OUT OF 60</div>
                </div>
                {(() => {
                  const finalScore = Math.round(calculateTotalScore());
                  return (
                    <div className="reveal-loader-container">
                      <div className="reveal-loader-bar-track">
                        <div 
                          className="reveal-loader-bar-fill" 
                          style={{ width: `${finalScore > 0 ? (animatedScore / finalScore) * 100 : 100}%` }}
                        ></div>
                      </div>
                      <div className="reveal-loader-status-text text-mono text-xs uppercase tracking-wider mt-12">
                        {animatedScore < finalScore * 0.20 && "Initializing system audit..."}
                        {animatedScore >= finalScore * 0.20 && animatedScore < finalScore * 0.40 && "Analyzing your diagnostic responses..."}
                        {animatedScore >= finalScore * 0.40 && animatedScore < finalScore * 0.60 && "Benchmarking operational parameters..."}
                        {animatedScore >= finalScore * 0.60 && animatedScore < finalScore * 0.80 && "Identifying systemic leakage points..."}
                        {animatedScore >= finalScore * 0.80 && animatedScore < finalScore && "Compiling custom recommendations..."}
                        {animatedScore === finalScore && "Calculations complete! Preparing your report..."}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="reveal-split-layout animate-fade-in">
                {/* Left Side: Score display + Section breakdown */}
                <div className="reveal-left-pane">
                  <div className="score-display-ring">
                    <span className="score-label">
                      Your Diagnostic Result
                    </span>
                    <div className="score-number">{animatedScore}</div>
                    <div className="score-max">OUT OF 60</div>
                  </div>

                  <div className="section-scores-grid">
                    {sections.map(s => {
                      const score = calculateSectionScore(s.id);
                      return (
                        <div key={s.id} className="section-score-item">
                          <span className="section-score-name">{s.name}</span>
                          <span className="section-score-val text-accent text-mono">{score} / 10</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Email form card */}
                <div className="reveal-right-pane">
                  <div className={`email-form-card ${emailFormFocus ? 'focus-active' : ''}`}>
                    <form onSubmit={handleEmailSubmit}>
                      <label className="email-label">
                        Get Your Full Report
                      </label>

                      {/* Name row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label className="text-xs text-secondary" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name *</label>
                          <input
                            id="first-name-input"
                            type="text"
                            className="email-input"
                            placeholder="Sarah"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onFocus={() => setEmailFormFocus(true)}
                            onBlur={() => setEmailFormFocus(false)}
                            required
                            disabled={isSubmittingEmail}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-secondary" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</label>
                          <input
                            id="last-name-input"
                            type="text"
                            className="email-input"
                            placeholder="Chen"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onFocus={() => setEmailFormFocus(true)}
                            onBlur={() => setEmailFormFocus(false)}
                            disabled={isSubmittingEmail}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                      </div>

                      {/* Email row + Submit */}
                      <div className="email-input-wrapper">
                        <input
                          id="email-input"
                          type="email"
                          className="email-input"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFormFocus(true)}
                          onBlur={() => setEmailFormFocus(false)}
                          required
                          disabled={isSubmittingEmail}
                        />
                        <button 
                          type="submit" 
                          className="btn-primary flex-center-gap-2"
                          disabled={isSubmittingEmail || !email.includes('@') || !firstName.trim()}
                        >
                          {isSubmittingEmail ? (
                            <>
                              <RefreshCw className="animate-spin" size={18} />
                              <span style={{ fontSize: '0.82rem' }}>{loadingMessage || 'Analyzing...'}</span>
                            </>
                          ) : (
                            <>
                              <span>Send My Report</span>
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Error message */}
                      {emailError && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                          {emailError}
                        </p>
                      )}

                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '10px', textAlign: 'center' }}>
                        <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                        Your PDF report will be sent within 60 seconds.
                      </p>
                    </form>
                    
                    <button 
                      type="button"
                      className="btn-secondary"
                      onClick={handleSkipEmail}
                      disabled={isSubmittingEmail}
                      style={{ width: '100%', marginTop: '20px' }}
                    >
                      Skip and show my summary on screen
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '12px 24px', fontSize: '0.85rem', width: 'auto', gap: '8px' }}
                        onClick={() => {
                          setStage('diagnostic');
                          setCurrentSectionIndex(5);
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Questions</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAGE 5: RESULTS SUMMARY & CALL TO ACTION */}
        {stage === 'results' && (
          <div className="results-container glass-panel animate-fade-in">
            {/* Header info */}
            <div className="results-header">
              <div className="results-header-top">
                <div>
                  <span className="progress-title-sub">Freelancer Diagnostic Results</span>
                  <h1 className="results-title">{getScoreBand(calculateTotalScore()).name}</h1>
                </div>
                <div className="results-score-badge">
                  {calculateTotalScore()}/60
                </div>
              </div>
              <p className="m-0 text-sm text-secondary">
                Diagnosed on {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            </div>

            {/* lock-banner hidden */}

            {/* Block 1: Score Context & Executive Summary */}
            <div className="mb-40" style={{ position: 'relative' }}>
              <div className="section-header-brutalist">
                <span className="section-label-badge">01 // Diagnosis</span>
                <h2 className="section-title-large">Operational Diagnosis</h2>
              </div>
              <p className="text-secondary mb-24" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                {getScoreBand(calculateTotalScore()).description}
              </p>
              
              <div style={{ position: 'relative' }}>
                <div
                  className="exec-assessment-container"
                  style={!emailSubmitted ? { filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' } : {}}
                >
                  <div className="exec-header-bar">
                    <div className="exec-header-title">
                      <Sparkles className="exec-header-icon" size={14} />
                      <span>Executive Assessment</span>
                    </div>
                    <span className="text-mono text-xxs text-muted" style={{ fontSize: '10px' }}>ANALYSIS ID: KOS-DIAG-01</span>
                  </div>

                  <div className="exec-meta-grid">
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Segment / Role</span>
                      <span className="exec-meta-val">Freelance {profession ? profession.charAt(0).toUpperCase() + profession.slice(1) : 'Professional'}</span>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Scale (Clients)</span>
                      <span className="exec-meta-val">{clientCount || 'N/A'} Active</span>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">Workspace Index</span>
                      <span className="exec-meta-val text-mono" style={{ color: composites.crgmScore >= 4 && answers.s5q1 !== 'C' ? 'var(--color-accent)' : '#10b981' }}>
                        {composites.crgmScore >= 4 && answers.s5q1 !== 'C' ? 'LOW' : 'ALIGNED'}
                      </span>
                    </div>
                    <div className="exec-meta-item">
                      <span className="exec-meta-label">SPOF Risk Level</span>
                      <span className="exec-meta-val text-mono" style={{ color: composites.riskScore >= 7 ? '#ef4444' : composites.riskScore >= 4 ? 'var(--color-accent)' : '#10b981' }}>
                        {composites.riskScore >= 7 ? 'HIGH' : (composites.riskScore >= 4 ? 'MODERATE' : 'LOW')}
                      </span>
                    </div>
                  </div>

                  <div className="exec-narrative-box">
                    <p>
                      <span className="exec-prompt-char">&gt;</span>
                      Based on your answers, your lowest performance centers in <strong>{lowestSections.map(s => s.name).join(' & ')}</strong>. This indicates your business is facing a capacity or trackability bottleneck where your admin overhead locks you in a capacity ceiling.
                    </p>
                  </div>
                </div>

                {!emailSubmitted && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    zIndex: 10,
                    borderRadius: '8px',
                    background: 'rgba(18, 18, 18, 0.55)',
                    backdropFilter: 'blur(2px)',
                  }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 8px rgba(255, 107, 0, 0.18)',
                    }}>
                      <Lock size={24} color="#fff" />
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
                      <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Enter your email to unlock your full</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Operational Diagnosis</span>
                    </p>
                    <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="email-input lock-input"
                        required
                        style={{ minWidth: '180px' }}
                      />
                      <button type="submit" className="btn-primary lock-btn" disabled={isSubmittingEmail}>
                        Unlock Now
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Block 2: Section Breakdown */}
            <div className="breakdown-section mb-40">
              <h2 className="text-sm uppercase tracking-wider text-muted mb-24">Functional Area Breakdown</h2>
              
              {sections.map(section => {
                const score = calculateSectionScore(section.id);
                const percent = (score / 10) * 100;
                const status = getScoreStatus(score);
                
                return (
                  <div key={section.id} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="breakdown-name flex-align-center-gap-2">
                        {getSectionIcon(section.id)}
                        <span>{section.name}</span>
                        <span className={`breakdown-score-metric ${status.class}`}>
                          {status.text}
                        </span>
                      </span>
                      <span className="breakdown-score-text text-mono">{score}/10</span>
                    </div>
                    
                    <div className="breakdown-bar-track">
                      <div 
                        className={`breakdown-bar-fill ${
                          score <= 4.0 ? 'low-score' : score <= 7.0 ? 'mid-score' : 'high-score'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className="breakdown-desc">{section.description}</p>
                  </div>
                );
              })}

              <div className="oci-redesigned-card mt-32" style={{ position: 'relative' }}>
                <div
                  style={!emailSubmitted ? { filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none', display: 'flex', flex: 1, gap: 'inherit', alignItems: 'inherit', flexWrap: 'wrap' } : { display: 'flex', flex: 1, gap: 'inherit', alignItems: 'inherit', flexWrap: 'wrap' }}
                >
                  <div className="oci-score-block">
                    <span className="oci-score-num">{composites.ociTotal}</span>
                    <span className="oci-score-denom">/12</span>
                  </div>
                  <div className="oci-content-block">
                    <h4 className="oci-card-title">Operational Component Inventory (OCI)</h4>
                    <p className="oci-card-desc mb-12">
                      You have verified that <strong>{composites.ociTotal} of 12</strong> key relational documents/trackers currently exist in one connected location in your business.
                    </p>
                    <div className="oci-visual-grid">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`oci-block-dot ${i < composites.ociTotal ? 'active' : 'inactive'}`}
                          title={i < composites.ociTotal ? 'Active inventory item' : 'Missing inventory item'}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {!emailSubmitted && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    zIndex: 10,
                    borderRadius: '8px',
                    background: 'rgba(18, 18, 18, 0.60)',
                    backdropFilter: 'blur(2px)',
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 7px rgba(255, 107, 0, 0.18)',
                    }}>
                      <Lock size={20} color="#fff" />
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
                      <span style={{ display: 'block', fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' }}>Unlock your OCI</span>
                      <span style={{ display: 'block', whiteSpace: 'nowrap' }}>Enter your email above</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Block 3: Cost Calculator & Soft Offer */}
            <div className="mb-40">
              {/* Cost Calculator */}
              <h2 className="text-sm uppercase tracking-wider text-muted mb-24">Hidden Cost of Chaos Calculator</h2>
              
              <div className="calculator-card glass-panel p-24 bg-results border-dark rounded-technical mb-24">
                <h3 className="calculator-title flex-align-center-gap-2 mb-12">
                  <Calculator className="text-accent" size={20} />
                  <span>Interactive Drag Calculator</span>
                </h3>
                <p className="text-sm text-secondary mb-24">
                  Adjust the sliders to estimate how much revenue is escaping through scope creep, billing delays, and admin overhead.
                </p>

                <div className="calculator-sliders">
                  <div className="slider-group mb-16">
                    <div className="flex-space-between mb-4">
                      <label className="text-xs font-semibold text-secondary">Average Project Fee ($):</label>
                      <span className="text-xs text-mono font-semibold">${avgFee.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="500" 
                      max="15000" 
                      step="500"
                      value={avgFee}
                      onChange={(e) => setAvgFee(Number(e.target.value))}
                      className="range-slider"
                    />
                  </div>

                  <div className="slider-group mb-16">
                    <div className="flex-space-between mb-4">
                      <label className="text-xs font-semibold text-secondary">Active Clients / Projects per Year:</label>
                      <span className="text-xs text-mono font-semibold">{activeClientsNum}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      step="1"
                      value={activeClientsNum}
                      onChange={(e) => setActiveClientsNum(Number(e.target.value))}
                      className="range-slider"
                    />
                  </div>

                  <div className="slider-group mb-24">
                    <div className="flex-space-between mb-4">
                      <label className="text-xs font-semibold text-secondary">Estimated Scope Creep & Admin Loss (%):</label>
                      <span className="text-xs text-mono font-semibold text-accent">{scopeCreepPercent}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={scopeCreepPercent}
                      onChange={(e) => setScopeCreepPercent(Number(e.target.value))}
                      className="range-slider"
                    />
                    <span className="text-xs text-muted block mt-4">
                      Includes unbilled revisions, delayed invoice payments, and context-reconstruction hours.
                    </span>
                  </div>
                </div>

                <div className="calculator-result-box bg-accent-subtle border-light p-20 rounded-technical text-center">
                  <div className="calc-result-title text-xs text-secondary uppercase tracking-wider mb-4">Expected Annual Revenue Loss:</div>
                  <div className="calc-result-value text-2xl font-bold text-accent">
                    ${Math.round(avgFee * activeClientsNum * (scopeCreepPercent / 100)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted m-0 mt-8">
                    This represents revenue currently lost. Building a relational record helps reclaim this margin.
                  </p>
                </div>
              </div>

              {/* Soft Offer CTA */}
              <div className="offer-section mt-40">
                <div className="offer-card glass-panel p-32 text-center rounded-technical">
                  <div className="offer-tag uppercase text-xs font-bold text-accent tracking-widest mb-6">The Operational Blueprint</div>
                  <h2 className="offer-title mb-16 text-lg">Systematize Your Freelance Workspace</h2>
                  <p className="offer-desc text-secondary text-sm mb-32">
                    Stop acting as the manual connective tissue of your business. KineticOS connects your services, projects, tasks, content, leads, and financials in a single relational Notion workspace. Launch with our 23-step Setup Launchpad on Day 1.
                  </p>
                  <a 
                    href="https://unikbuilds.com/kos" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-primary offer-cta-btn offer-cta-link py-16 px-32 uppercase text-sm font-semibold tracking-wider inline-block text-white"
                    style={{ textDecoration: 'none' }}
                  >
                    Get KineticOS Workspace ($149)
                  </a>
                </div>

                <button 
                  className="btn-secondary mt-32 py-12 px-24 border-dark rounded-technical bg-results w-full uppercase text-xs font-semibold tracking-wider cursor-pointer"
                  onClick={resetFunnel}
                >
                  Retake Diagnostic Funnel
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      {stage === 'landing' && (
        <footer className="app-footer">
          <div className="app-footer-copyright">
            &copy; {new Date().getFullYear()} KineticOS by Team Unik Builds. All rights reserved.
          </div>
          <div className="app-footer-tagline">Built for freelance creative professionals prioritizing operational architecture.</div>
        </footer>
      )}
      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="success-modal-overlay">
          <div className="success-modal-card">
            <button 
              className="success-modal-close" 
              onClick={() => setShowSuccessPopup(false)}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
            <div className="success-modal-icon-wrap">
              <Mail size={32} />
            </div>
            <h2 className="success-modal-title">
              Report Sent! 📩
            </h2>
            <div className="success-modal-subtitle">
              Operational Blueprint Dispatched
            </div>
            <hr className="success-modal-divider" />
            <p className="success-modal-text" style={{ marginBottom: '16px', fontWeight: '500' }}>
              Your customized operational blueprint has<br />been sent to your inbox.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0 0 20px 0', fontWeight: '500' }}>
              Please check your inbox shortly.
            </p>
            <div className="success-modal-alert">
              💡 If you don't see it within 60 seconds, please check your <strong>Spam or Promotions</strong> folder as automated emails sometimes land there.
            </div>
            <button 
              className="btn-primary" 
              onClick={() => setShowSuccessPopup(false)}
            >
              View My Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
