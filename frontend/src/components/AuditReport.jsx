import { useState, useEffect } from "react";
import "./AuditReport.css";
import { adaptReport, scoreChip, categoryStatus, CATEGORIES} from "../utils/reportAdapter";

//Helpers 
function fmt(dateStr) {
  try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return dateStr; }
}

function severityClass(sev) {
  return sev?.toLowerCase() || "info";
}

function deriveCategoryRows(issues) {
  if (issues.length === 0) {
    return [
      {
        label: "All checks passed",
        value: "Pass",
        cls: "val--pass",
        dot: "secondary"
      }
    ];
  }

  return issues.slice(0, 3).map(issue => {
    const sev = issue.severity.toLowerCase();

    const dot =
      sev === "critical"
        ? "error"
        : sev === "warning"
        ? "tertiary"
        : "secondary";

    const valCls =
      sev === "critical"
        ? "val--error"
        : sev === "warning"
        ? "val--warning"
        : "val--pass";

    return {
      label: issue.issue,
      value: issue.severity,
      cls: valCls,
      dot
    };
  });
}

//Score ring (SVG)
const RING_CIRCUMFERENCE = 283; // 2π × r=45
function ScoreRing({ score }) {
  const [animated, setAnimated] = useState(false);
  const offset = animated
    ? RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * score) / 100
    : RING_CIRCUMFERENCE;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <svg className="score-hero__ring" viewBox="0 0 100 100">
      <circle className="score-hero__ring-track" cx="50" cy="50" r="45" fill="none" strokeWidth="6" />
      <circle
        className="score-hero__ring-progress"
        cx="50" cy="50" r="45"
        fill="none" strokeWidth="6"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

//Issue card
function IssueCard({ issue }) {
  const sev = severityClass(issue.severity);

  return (
    <div className={`issue-card issue-card--${sev}`}>
      <div className="issue-card__header">
        <div className="issue-card__meta">
          <div className="issue-card__badge-row">
            <span className={`severity-badge severity-badge--${sev}`}>{issue.severity}</span>
            <span className="issue-card__title">{issue.issue}</span>
          </div>
          <p className="issue-card__desc">{issue.details}</p>
        </div>
      </div>
    </div>
  );
}

//AI insights card
function AICard({ text }) {
  if (!text) return null;
  return (
    <div className="ai-card">
      <span className="material-symbols-outlined ai-card__icon">lightbulb</span>
      <div className="ai-card__body">
        <span className="ai-card__label">AI Insights</span>
        <p className="ai-card__text">{text}</p>
      </div>
    </div>
  );
}

//Accordion section
function AccordionSection({ categoryKey, label, issues, aiText, categoryScore, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const issueCount = issues.length;
  const status = categoryStatus(issueCount, categoryScore);

  return (
    <div className="accordion">
      <button
        className="accordion__trigger"
        id={`accordion-${categoryKey}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="accordion__trigger-left">
          <span className={`material-symbols-outlined accordion__chevron${open ? " accordion__chevron--open" : ""}`}>
            expand_more
          </span>
          <h3 className="accordion__title">
            {label} ({issueCount} {issueCount === 1 ? "issue" : "issues"})
          </h3>
        </div>
        <div className="accordion__status">
          <span className={`dot dot--${status.dot}`} />
          <span className="accordion__status-label">{status.label}</span>
        </div>
      </button>

      <div className={`accordion__body${open ? " accordion__body--open" : ""}`}>
        <div className="accordion__body-inner">
          {/* Issues */}
          {issues.length === 0 ? (
            <IssueCard issue={{
              issue: "No issues found",
              severity: "Success",
              details: "All checks passed for this category.",
            }} />
          ) : (
            issues.map((issue, i) => <IssueCard key={i} issue={issue} />)
          )}

          {/* AI recommendation */}
          <AICard text={aiText} />
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, score, issues }) {
  const chip = scoreChip(score);
  const rows = deriveCategoryRows(issues);

  return (
    <div className="category-card">
      <div className="category-card__header">
        <div className="category-card__name-group">
          <div className="category-card__icon-wrap">
            <span className="material-symbols-outlined" style={{ color: "#adc6ff", fontSize: "20px" }}>
              {category.icon}
            </span>
          </div>
          <h3 className="category-card__name">{category.label}</h3>
        </div>
        <span className={`score-chip score-chip--${chip.color}`}>{chip.label}</span>
      </div>

      <div className="category-card__rows">
        {rows.map((row, i) => (
          <div className="category-card__row" key={i}>
            <span className="category-card__row-label">
              <span className={`dot dot--${row.dot}`} />
              {row.label}
            </span>
            <span className={`category-card__row-value ${row.cls}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

//Main component
function AuditReport({ rawData, onNewAudit }) {
  const report = adaptReport(rawData);
  const {
    url, createdAt, overallScore,
    categoryScores, byCategory, recommendations,
  } = report;

  // Export JSON handler
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: "application/json" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `domrefine-audit-${Date.now()}.json`;
    a.click();
  };

  // Download PDF handler (basic window.print fallback)
  const handleDownloadPDF = () => window.print();

  return (
    <div className="report-shell">
      {/* ── Sidebar (desktop) ── */}
      <nav className="report-sidebar" aria-label="Report navigation">
        <div className="sidebar__brand">
          <span className="sidebar__logo">DOMRefine</span>
          <span className="sidebar__tagline">Expert Control</span>
        </div>

        <button
          id="sidebar-new-audit"
          className="sidebar__new-audit"
          onClick={onNewAudit}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1', fontSize: "18px" }}>
            add
          </span>
          New Audit
        </button>

        <div className="sidebar__nav">
          <button className="sidebar__nav-item sidebar__nav-item--active">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>analytics</span>
            Audit
          </button>
          <button className="sidebar__nav-item">
            <span className="material-symbols-outlined">history</span>
            History
          </button>
          <button className="sidebar__nav-item">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar">
            <span className="material-symbols-outlined" style={{ color: "#c2c6d6", fontSize: "20px" }}>person</span>
          </div>
          <span className="sidebar__username">User Workspace</span>
        </div>
      </nav>

      {/* ── Top nav (mobile) ── */}
      <nav className="report-topnav" aria-label="Mobile navigation">
        <span style={{ fontFamily: "'Geist', sans-serif", fontSize: "20px", fontWeight: 700, color: "#adc6ff" }}>
          DOMRefine
        </span>
        <button style={{ background: "none", border: "none", color: "#e5e2e1", cursor: "pointer" }}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </nav>

      {/* ── Main ── */}
      <main className="report-main">
        <div className="report-content">

          {/* ── Header ── */}
          <header className="report-header">
            <div className="report-header__left">
              <div className="report-header__badge-row">
                <span className="report-header__badge">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                  Audit Complete
                </span>
                <span className="report-header__date">Generated: {fmt(createdAt)}</span>
              </div>
              <h1 className="report-header__url">{url}</h1>
              <p className="report-header__subtitle">Comprehensive structural and performance analysis.</p>
            </div>

            <div className="report-header__actions">
              <button id="report-download-pdf" className="report-btn-ghost" onClick={handleDownloadPDF}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                Download PDF
              </button>
              <button id="report-export-json" className="report-btn-ghost" onClick={handleExportJSON}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>code</span>
                Export JSON
              </button>
            </div>
          </header>

          {/* ── Bento score grid ── */}
          <div className="score-grid">
            {/* Overall health */}
            <div className="score-hero">
              <h2 className="score-hero__title">Overall Health</h2>

              <div className="score-hero__ring-wrap">
                <ScoreRing score={overallScore} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                  <span className="score-hero__number">{overallScore}</span>
                  <span className="score-hero__pts">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>trending_up</span>
                    +2 pts
                  </span>
                </div>
              </div>

              <div className="score-hero__footer">
                <div>
                  <div className="score-hero__stat-label">Scanned DOM Nodes</div>
                  <div className="score-hero__stat-val">1,420</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="score-hero__stat-label">Load Time</div>
                  <div className="score-hero__stat-val">1.2s</div>
                </div>
              </div>
            </div>

            {/* Category cards */}
            <div className="category-cards-grid">
              {CATEGORIES.map(cat => (
                <CategoryCard
                  key={cat.key}
                  category={cat}
                  score={categoryScores[cat.key] ?? 100}
                  issues={byCategory[cat.key] ?? []}
                />
              ))}
            </div>
          </div>

          {/* ── Accordion sections ── */}
          <section aria-label="Detailed findings">
            <div className="accordions">
              {CATEGORIES.map((cat, idx) => (
                <AccordionSection
                  key={cat.key}
                  categoryKey={cat.key}
                  label={cat.label}
                  issues={byCategory[cat.key] ?? []}
                  aiText={recommendations[0]}
                  categoryScore={categoryScores[cat.key] ?? 100}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default AuditReport;
