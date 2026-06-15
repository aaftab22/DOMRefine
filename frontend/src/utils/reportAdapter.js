/**
 * reportAdapter.js
 *
 * Converts the raw backend response into a stable shape consumed by AuditReport.
 * Works whether the backend returns GPT analysis or the fallback scoring_service output.
 *
 * Backend response envelope:
 *   {
 *     "Entered url": string,
 *     "audit": { errors[], warnings[], overflow{}, screenshots[] },
 *     "analysis": { overall_score, category_scores{}, critical_issues[], warnings[], recommended_fixes[] }
 *     "created_at": string
 *   }
 */

// ── Severity helpers ──────────────────────────────────────────────

/** Map an error/warning type string to a display severity label */
function deriveSeverity(item, isError) {
  if (isError) return "Critical";
  const t = (item.type || "").toLowerCase();
  if (t.includes("missing security") || t.includes("broken")) return "Critical";
  return "Warning";
}

/** Determine which report category an issue belongs to */
function deriveCategory(item) {
  const t = (item.type || "").toLowerCase();
  if (t.includes("overflow") || t.includes("tap") || t.includes("viewport")) return "user_facing";
  if (t.includes("security") || t.includes("csp") || t.includes("header") || t.includes("vulnerab")) return "security";
  if (t.includes("aria") || t.includes("label") || t.includes("contrast") || t.includes("alt") || t.includes("access")) return "accessibility";
  if (t.includes("h1") || t.includes("meta") || t.includes("canonical") || t.includes("seo") || t.includes("duplicate")) return "seo";
  // Default: technical (broken images, broken pages, nesting, etc.)
  return "technical";
}

/** Build a concise human-readable description from raw issue data */
function buildDescription(item) {
  if (item.description) return item.description;
  const count = item.count ?? (item.details?.length ?? 0);
  if (item.type === "Broken Internal Pages" && item.details?.length) {
    return `${count} internal page(s) returned errors: ${item.details.slice(0, 2).map(d => d.url || d).join(", ")}${item.details.length > 2 ? "…" : ""}`;
  }
  if (item.type === "Missing Alt Tags") return "Images are missing descriptive alt attributes, impacting accessibility and SEO.";
  if (item.type === "Missing Meta Description") return "No meta description tag found. Search engines may generate unpredictable snippets.";
  if (item.type === "Mobile Element Overflow") return "Elements exceed the viewport width on mobile, causing horizontal scroll.";
  if (item.type === "Missing Security Headers") return `Security headers missing: ${Array.isArray(item.details) ? item.details.slice(0, 3).join(", ") : item.details || "see details"}`;
  if (item.type === "Inputs Without Labels") return "Form inputs are missing associated <label> elements, breaking accessibility.";
  if (item.type === "Multiple H1") return "Multiple H1 tags found on the page, diluting semantic structure.";
  if (item.type === "Broken Images") return `${count} image(s) could not be loaded.`;
  return item.type || "Issue detected.";
}

/** Count occurrences for an issue */
function occurrenceCount(item) {
  if (typeof item.count === "number") return item.count;
  if (Array.isArray(item.details)) return item.details.length;
  return 1;
}

// ── Category metadata ─────────────────────────────────────────────

export const CATEGORIES = [
  { key: "user_facing",   label: "User Facing",   icon: "visibility",        color: "primary" },
  { key: "security",      label: "Security",       icon: "shield",            color: "secondary" },
  { key: "accessibility", label: "Accessibility",  icon: "accessibility_new", color: "primary" },
  { key: "technical",     label: "Technical",      icon: "account_tree",      color: "primary" },
  { key: "seo",           label: "SEO",            icon: "search",            color: "primary" },
];

/** Returns { color, label } for a numeric score */
export function scoreChip(score) {
  if (score >= 90) return { color: "secondary", label: `${score}/100` }; // green
  if (score >= 70) return { color: "tertiary",  label: `${score}/100` }; // amber
  return            { color: "error",     label: `${score}/100` }; // red
}

/** Returns status dot + label based on issue count and score */
export function categoryStatus(issueCount, score) {
  if (issueCount === 0 && score >= 90) return { dot: "secondary", label: "Healthy" };
  if (issueCount === 0)                return { dot: "secondary", label: "Pass" };
  if (score >= 80)                     return { dot: "secondary", label: "Healthy" };
  if (score >= 70)                     return { dot: "tertiary",  label: "Review Suggested" };
  return                                      { dot: "error",     label: "Action Required" };
}

// ── Main adapter ──────────────────────────────────────────────────

/**
 * @param {object} raw - The raw JSON from the backend /audit endpoint
 * @returns {object} Normalised report data
 */
export function adaptReport(raw) {
  const auditUrl   = raw["Entered url"] || raw.url || "";
  const audit      = raw.audit || {};
  const analysis   = raw.analysis || {};
  const createdAt  = raw.created_at || new Date().toISOString();

  // ── Scores ──
  const categoryScores = analysis.category_scores || {
    user_facing: 100, security: 100, accessibility: 100, technical: 100, seo: 100,
  };
  const overallScore = analysis.overall_score
    ?? Math.round(Object.values(categoryScores).reduce((a, b) => a + b, 0) / 5);

  // ── Flatten all issues ──
  const rawErrors   = analysis.critical_issues || audit.errors   || [];
  const rawWarnings = analysis.warnings         || audit.warnings || [];

  const allIssues = [
    ...rawErrors.map(e => ({
      ...e,
      _severity: deriveSeverity(e, true),
      _category: deriveCategory(e),
      _description: buildDescription(e),
      _count: occurrenceCount(e),
    })),
    ...rawWarnings.map(w => ({
      ...w,
      _severity: deriveSeverity(w, false),
      _category: deriveCategory(w),
      _description: buildDescription(w),
      _count: occurrenceCount(w),
    })),
  ];

  // ── Group by category ──
  const byCategory = {};
  CATEGORIES.forEach(c => { byCategory[c.key] = []; });
  allIssues.forEach(issue => {
    const cat = issue._category;
    if (byCategory[cat]) byCategory[cat].push(issue);
    else byCategory["technical"].push(issue); // safe fallback
  });

  // ── AI recommendation per category (from recommended_fixes array or GPT fields) ──
  //    recommended_fixes may be a string[] or an object with per-category keys
  const fixes = analysis.recommended_fixes || [];
  const aiByCategory = {};
  if (Array.isArray(fixes) && fixes.length > 0) {
    // Simple array: assign round-robin to non-empty categories
    const nonEmpty = CATEGORIES.filter(c => byCategory[c.key].length > 0);
    fixes.forEach((fix, i) => {
      const cat = nonEmpty[i % nonEmpty.length];
      if (cat) aiByCategory[cat.key] = fix;
    });
  } else if (fixes && typeof fixes === "object") {
    // Object keyed by category
    Object.assign(aiByCategory, fixes);
  }

  // Also pick up top-level AI fields if GPT analysis returns them
  if (analysis.ai_recommendation)   aiByCategory["_global"]  = analysis.ai_recommendation;

  // ── Supplemental audit metadata ──
  const overflow = audit.overflow || {};

  return {
    url: auditUrl,
    createdAt,
    overallScore,
    categoryScores,
    byCategory,
    aiByCategory,
    hasAI: fixes.length > 0 || !!analysis.ai_recommendation,
    overflow,
  };
}
