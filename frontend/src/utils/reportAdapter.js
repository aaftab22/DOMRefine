
export function adaptReport(raw) {
  const analysis = raw.analysis || {};
  const audit = raw.audit || {};

  const overallScore = analysis.overall_score || analysis.score || 100;

  const categoryScores = analysis.category_scores || {
    user_facing: 100,
    security: 100,
    accessibility: 100,
    technical: 100,
    seo: 100, 
  };

  const recommendations = analysis.recommended_fixes || [];
  const byCategory = {
    user_facing: [],
    security: [],
    accessibility: [],
    technical: [],
    seo: [],
  };

  const errors = analysis.errors || [];
  const warnings = analysis.warnings || [];

  const issues = [...errors, ...warnings];

  issues.forEach(issue => {
  if (issue.category && byCategory[issue.category]) {
    byCategory[issue.category].push(issue);
  }
  });

  return {
    url: raw["Entered url"],
    createdAt: raw.created_at,

    overallScore,
    categoryScores,

    recommendations,
    byCategory,

    audit,
  };
}

export const CATEGORIES = [
  { key: "user_facing", label: "User Facing", icon: "visibility", color: "primary" },
  { key: "security", label: "Security", icon: "shield", color: "secondary" },
  { key: "accessibility", label: "Accessibility", icon: "accessibility_new", color: "primary" },
  { key: "technical", label: "Technical", icon: "account_tree", color: "primary" },
  { key: "seo", label: "SEO", icon: "search", color: "primary" },
];

/* Returns { color, label } for a numeric score */
export function scoreChip(score) {
  if (score >= 90) return { color: "secondary", label: `${score}/100` }; // green
  if (score >= 70) return { color: "tertiary",  label: `${score}/100` }; // amber
  return { color: "error", label: `${score}/100` }; // red
}

export function categoryStatus(issueCount, score) {
  if (issueCount === 0 && score >= 90) return { dot: "secondary", label: "Healthy" };
  if (issueCount === 0)                return { dot: "secondary", label: "Pass" };
  if (score >= 80)                     return { dot: "secondary", label: "Healthy" };
  if (score >= 70)                     return { dot: "tertiary",  label: "Review Suggested" };
  return                                      { dot: "error",     label: "Action Required" };
}