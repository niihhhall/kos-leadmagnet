import React, { useState, useEffect, useRef } from 'react';
import { 
  sections, 
  scoreBands, 
  seriousOperatorBenchmarks, 
  generatePatternParagraph 
} from './questions';
import { submitLeadToESP } from './utils/esp';
import { 
  ArrowRight, 
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
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Navigation & funnel states
  const [stage, setStage] = useState('landing'); // 'landing' | 'selector' | 'diagnostic' | 'reveal' | 'results'
  const [profession, setProfession] = useState(null); // 'designer' | 'marketer' | 'writer' | 'other'
  const [clientCount, setClientCount] = useState(null); // '1-2' | '3-4' | '5+'
  
  // Answers state: { qId: score }
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  
  // Lead info
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailFormFocus, setEmailFormFocus] = useState(false);

  // Results calculator states
  const [avgFee, setAvgFee] = useState(2500);
  const [chaosProjects, setChaosProjects] = useState(4);
  const [lostPercent, setLostPercent] = useState(20);

  // Score reveal animation states
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showBand, setShowBand] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);

  // Calculate scores helper
  const calculateTotalScore = () => {
    return Object.values(answers).reduce((sum, val) => sum + val, 0);
  };

  const calculateSectionScore = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;
    return section.questions.reduce((sum, q) => {
      return sum + (answers[q.id] || 0);
    }, 0);
  };

  const getLowestSections = () => {
    return sections
      .map(s => ({
        id: s.id,
        name: s.name,
        score: calculateSectionScore(s.id)
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        // tie-breaker: order of section
        return sections.findIndex(s => s.id === a.id) - sections.findIndex(s => s.id === b.id);
      })
      .slice(0, 2);
  };

  const getScoreBand = (score) => {
    return scoreBands.find(band => score >= band.min && score <= band.max) || scoreBands[1];
  };

  const getScoreStatus = (val) => {
    if (val <= 4) return { text: "Critical Gap", class: "critical" };
    if (val <= 7) return { text: "Needs Attention", class: "warning" };
    return { text: "Systematized", class: "healthy" };
  };

  // Scroll to top on stage change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, currentSectionIndex]);

  // Score counter animation in reveal stage
  useEffect(() => {
    if (stage === 'reveal') {
      const targetScore = calculateTotalScore();
      if (targetScore === 0) {
        setAnimatedScore(0);
        setShowBand(true);
        setTimeout(() => setShowEmailGate(true), 500);
        return;
      }
      
      let start = 0;
      const duration = 2000; // 2 seconds
      const stepTime = Math.max(Math.floor(duration / targetScore), 30);
      
      const timer = setInterval(() => {
        start += 1;
        setAnimatedScore(start);
        if (start >= targetScore) {
          clearInterval(timer);
          // Show band after settles
          setTimeout(() => setShowBand(true), 300);
          // Show email form after band fades in
          setTimeout(() => setShowEmailGate(true), 800);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [stage]);

  // Handle choice selection
  const handleSelectChoice = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isSectionComplete = (section) => {
    return section.questions.every(q => answers[q.id] !== undefined);
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setStage('reveal');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmittingEmail(true);
    try {
      await submitLeadToESP({
        email,
        score: calculateTotalScore(),
        profession,
        clientCount,
        answers
      });
      setEmailSubmitted(true);
      setStage('results');
    } catch (err) {
      console.error("Failed to submit lead", err);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleSkipEmail = () => {
    setEmailSubmitted(false);
    setStage('results');
  };

  const resetFunnel = () => {
    setAnswers({});
    setCurrentSectionIndex(0);
    setProfession(null);
    setClientCount(null);
    setEmail('');
    setEmailSubmitted(false);
    setStage('landing');
    setAnimatedScore(0);
    setShowBand(false);
    setShowEmailGate(false);
  };

  // Render question text with profession variants
  const getQuestionText = (q) => {
    if (q.variants && profession && q.variants[profession]) {
      return q.variants[profession];
    }
    return q.text;
  };

  // Render icons for section names
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

  return (
    <div className="app-container">
      {/* Logo Header */}
      <header className="app-header">
        <div className="logo-text">
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
          <div className="animate-fade-in text-center hero-container">
            <h1 className="mb-24">Your work is premium.<br />Your backend isn't.</h1>
            <p className="hero-lead">
              Score the operational health of your creative freelance business across six functional areas in 7 minutes. See exactly what your current setup is costing you.
            </p>
            
            <div className="hero-btn-wrapper">
              <button 
                className="btn-primary" 
                onClick={() => setStage('selector')}
              >
                Begin the Diagnostic
              </button>
            </div>

            <div className="hero-badges">
              <div className="hero-badge-item">
                <Check size={14} className="text-accent" />
                <span>Tailored results</span>
              </div>
              <div className="hero-badge-item">
                <Check size={14} className="text-accent" />
                <span>7 minutes. 30 questions.</span>
              </div>
              <div className="hero-badge-item">
                <Check size={14} className="text-accent" />
                <span>1,200+ freelancers audited</span>
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
                  { id: 'other', label: 'Other HAT wearer', sub: 'Multiple skills / general creative' }
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
                  { id: '1-2', label: '1 to 2 clients', desc: 'Focus on scaling foundation' },
                  { id: '3-4', label: '3 to 4 clients', desc: 'Facing capacity ceiling' },
                  { id: '5+', label: '5 or more clients', desc: 'Need active delegation & systems' }
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

            <button 
              className="btn-primary"
              disabled={!profession || !clientCount}
              onClick={() => setStage('diagnostic')}
            >
              Start My Diagnostic
            </button>
          </div>
        )}

        {/* STAGE 3: DIAGNOSTIC QUESTIONNAIRE */}
        {stage === 'diagnostic' && (
          <div className="animate-slide-left">
            {/* Header progress info */}
            {(() => {
              const currentSection = sections[currentSectionIndex];
              const answeredInSection = currentSection.questions.filter(q => answers[q.id] !== undefined).length;
              const sectionScore = calculateSectionScore(currentSection.id);
              
              return (
                <>
                  <div className="progress-header">
                    <div>
                      <span className="progress-title-sub text-mono">[0{currentSectionIndex + 1}/06]</span>
                      <h2 className="text-sm mt-4 m-0 uppercase font-semibold">
                        {currentSection.name}
                      </h2>
                    </div>
                    <div className="progress-score-live text-mono">
                      SCORE: {sectionScore}/10
                    </div>
                  </div>

                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${((currentSectionIndex * 5 + answeredInSection) / 30) * 100}%` }}
                    ></div>
                  </div>

                  <div className="section-opener-text">
                    {/* Accessing opener variants */}
                    {seriousOperatorBenchmarks[currentSection.id] ? (
                      profession && seriousOperatorBenchmarks[currentSection.id][profession] 
                        ? seriousOperatorBenchmarks[currentSection.id][profession] 
                        : seriousOperatorBenchmarks[currentSection.id].general
                    ) : ""}
                  </div>

                  {/* Render 5 questions of this section */}
                  {currentSection.questions.map((q, idx) => (
                    <div key={q.id} className="question-container">
                      <div className="question-text">
                        <span className="question-num text-mono">
                          [0{idx + 1}]
                        </span>
                        {getQuestionText(q)}
                      </div>
                      
                      <div className="choices-stack">
                        {q.options.map(option => (
                          <button
                            key={option.value}
                            className={`choice-button ${answers[q.id] === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelectChoice(q.id, option.value)}
                          >
                            <span className="choice-badge">{option.value}</span>
                            <span>{option.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Section Bridge (only appears when all 5 questions are answered) */}
                  {isSectionComplete(currentSection) && (
                    <div className="section-bridge-container">
                      <p className="section-bridge-text">
                        {currentSectionIndex === 0 && "Your foundation is marked. Let's look at how you orchestrate tasks day-to-day."}
                        {currentSectionIndex === 1 && "Daily tasks are tracked. Now, let's explore if content and promotion are integrated."}
                        {currentSectionIndex === 2 && "Content is documented. Let's see how you convert that traffic into active leads."}
                        {currentSectionIndex === 3 && "Pipeline checked. Let's move to client onboarding and command centers."}
                        {currentSectionIndex === 4 && "Client systems scoped. Finally, let's review your real-time financial controls."}
                        {currentSectionIndex === 5 && "Operational diagnostic complete. Let's compute your total score."}
                      </p>
                      
                      <button 
                        className="btn-primary"
                        onClick={handleNextSection}
                      >
                        {currentSectionIndex < 5 ? "Continue to Next Section" : "Compute My Score"}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* STAGE 4: SCORE REVEAL & EMAIL GATE */}
        {stage === 'reveal' && (
          <div className="score-reveal-wrapper animate-fade-in">
            <div className="score-display-ring">
              <span className="score-label">
                Your Diagnostic Result
              </span>
              <div className="score-number">{animatedScore}</div>
              <div className="score-max">OUT OF 60</div>
            </div>

            {showBand && (
              <div className="score-band-badge animate-fade-in">
                {getScoreBand(animatedScore).name}
              </div>
            )}

            {showEmailGate && (
              <div className="animate-fade-in w-full">
                <p className="reveal-interpretation">
                  {getScoreBand(animatedScore).description}
                </p>

                <div className={`email-form-card ${emailFormFocus ? 'focus-active' : ''}`}>
                  <form onSubmit={handleEmailSubmit}>
                    <label className="email-label" htmlFor="email-input">
                      Unlock Full Section Analysis & Priority Plan
                    </label>
                    <div className="email-input-wrapper">
                      <input
                        id="email-input"
                        type="email"
                        className="email-input"
                        placeholder="Enter your professional email"
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
                        disabled={isSubmittingEmail || !email.includes('@')}
                      >
                        {isSubmittingEmail ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Send My Breakdown</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  <button 
                    className="skip-button-link"
                    onClick={handleSkipEmail}
                    disabled={isSubmittingEmail}
                  >
                    I'll skip for now — just show my summary
                  </button>
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
              <p className="m-0">
                Diagnosed on {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            </div>

            {/* If email was skipped, show a sticky upgrade gate */}
            {!emailSubmitted && (
              <div className="card lock-banner">
                <div className="lock-banner-content">
                  <Lock className="lock-icon" size={18} />
                  <div>
                    <h3 className="m-0 mb-12 text-primary">Unlock Your Custom Root Cause Analysis</h3>
                    <p className="text-sm m-0 mb-24">
                      Enter your email to receive your full section-by-section breakdown report, root cause patterns, and actionable priority plan.
                    </p>
                    <form onSubmit={handleEmailSubmit} className="lock-banner-form">
                      <input 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="email-input lock-input"
                        required
                      />
                      <button 
                        type="submit" 
                        className="btn-primary lock-btn"
                        disabled={isSubmittingEmail}
                      >
                        Unlock Now
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Block 1: Score Context */}
            <div className="mb-40">
              <h2 className="text-sm mb-12">Operational Diagnosis</h2>
              <p className="text-secondary">
                {getScoreBand(calculateTotalScore()).description}
              </p>
            </div>

            {/* Block 2: Section Breakdown */}
            <div className="breakdown-section">
              <h2 className="text-sm mb-24">Functional Area Breakdown</h2>
              
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
                          score <= 4 ? 'low-score' : score <= 7 ? 'mid-score' : 'high-score'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className="breakdown-desc">{section.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Block 3: Dynamic Pattern Paragraph (If email captured) */}
            {emailSubmitted ? (
              <div className="pattern-callout animate-fade-in">
                <div className="pattern-title">
                  <Sparkles size={16} />
                  <span>Operational Root Cause</span>
                </div>
                <p className="pattern-text">
                  {generatePatternParagraph(getLowestSections(), profession)}
                </p>
              </div>
            ) : (
              <div className="pattern-container-relative">
                <div className="pattern-overlay">
                  <div className="pattern-overlay-badge">
                    <Lock size={14} />
                    <span>Email Required for Root Cause Analysis</span>
                  </div>
                </div>
                <div className="pattern-callout pattern-blur-gate">
                  <div className="pattern-title">
                    <Sparkles size={16} />
                    <span>Operational Root Cause</span>
                  </div>
                  <p className="pattern-text">
                    Your two lowest sections — Business Foundation and Client & Project — are not separate failures. They are the same failure at different surfaces. Without documented services, creative scope drifts endlessly. The root is one gap: you lack a connected relational workspace where files, projects, tasks, and margins sync.
                  </p>
                </div>
              </div>
            )}

            {/* Block 4: Cost Calculation Widget */}
            <div className="calculator-card glass-panel">
              <h3 className="calculator-title flex-align-center-gap-2">
                <Calculator className="text-accent" size={20} />
                <span>Calculate Your Cost of Chaos</span>
              </h3>
              <p className="text-sm mb-24">
                Surfacing the real, retrospective cost of your operational gaps on your project revenue.
              </p>

              <div className="calculator-inputs">
                <div className="calc-input-group">
                  <label className="calc-input-label">Average Project Fee ($)</label>
                  <input
                    type="number"
                    className="calc-input"
                    value={avgFee}
                    onChange={(e) => setAvgFee(Number(e.target.value))}
                  />
                </div>
                <div className="calc-input-group">
                  <label className="calc-input-label">Chaos Projects / Year</label>
                  <input
                    type="number"
                    className="calc-input"
                    value={chaosProjects}
                    onChange={(e) => setChaosProjects(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="calc-input-group mb-24">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="calc-input-label">Estimated Revenue Lost / Project</label>
                  <span className="text-sm font-semibold text-accent">
                    {lostPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={lostPercent}
                  onChange={(e) => setLostPercent(Number(e.target.value))}
                  className="range-slider"
                />
                <span className="range-slider-desc">
                  Covers scope creep, late invoices, missed retainer extensions, and context switching time.
                </span>
              </div>

              <div className="calculator-result-box">
                <div className="calc-result-title">Annual Cost of Operational Gaps</div>
                <div className="calc-result-value">
                  ${Math.round(avgFee * chaosProjects * (lostPercent / 100)).toLocaleString()}
                </div>
                <div className="text-xs text-secondary mt-8">
                  This is revenue currently lost. It represents what your current score is actively costing you.
                </div>
              </div>
            </div>

            {/* Block 5 & 6: Serious Operator Benchmarks */}
            <div className="benchmarks-section">
              <h2 className="text-sm mb-24">Serious Operator Standards</h2>
              <p>What a 10/10 operational benchmark looks like in your profession:</p>

              {sections.map(section => (
                <div key={section.id} className="benchmark-card">
                  <div className="benchmark-card-title">{section.name}</div>
                  <div className="benchmark-card-text">
                    {seriousOperatorBenchmarks[section.id] ? (
                      profession && seriousOperatorBenchmarks[section.id][profession]
                        ? seriousOperatorBenchmarks[section.id][profession]
                        : seriousOperatorBenchmarks[section.id].general
                    ) : ""}
                  </div>
                </div>
              ))}
            </div>

            {/* Block 7: Soft Offer CTA to KineticOS */}
            <div className="offer-section">
              <div className="offer-card glass-panel">
                <div className="offer-tag">The Relational Solution</div>
                <h2 className="offer-title">Systematize Your Business with KineticOS</h2>
                <p className="offer-desc">
                  KineticOS connects your services, projects, tasks, content, leads, and finances in a single relational Notion workspace. With a guided 23-step Launchpad setup, you populate it with your real active clients on Day 1.
                </p>
                <a 
                  href="https://unikbuilds.com/kos" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary offer-cta-btn offer-cta-link"
                >
                  Explore KineticOS ($149)
                </a>
              </div>

              <button 
                className="btn-secondary mt-40" 
                onClick={resetFunnel}
              >
                Retake Diagnostic Funnel
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>&copy; {new Date().getFullYear()} KineticOS by Team Unik Builds. All rights reserved.</div>
        <div className="mt-6">Built for freelance creative professionals prioritizing operational architecture.</div>
      </footer>
    </div>
  );
}
