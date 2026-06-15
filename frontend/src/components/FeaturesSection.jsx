const features = [
  {
    id: "accessibility",
    icon: "accessibility_new",
    iconColorClass: "feature-card__icon-wrap--blue",
    iconTextClass: "text-primary",
    title: "Accessibility",
    description:
      "Ensure compliance with WCAG standards. Detect missing ARIA labels, poor contrast ratios, and keyboard navigation traps.",
  },
  {
    id: "seo",
    icon: "travel_explore",
    iconColorClass: "feature-card__icon-wrap--green",
    iconTextClass: "text-secondary",
    title: "SEO Performance",
    description:
      "Identify missing meta tags, broken canonicals, duplicate content, and analyze core web vitals affecting search ranking.",
  },
  {
    id: "technical",
    icon: "terminal",
    iconColorClass: "feature-card__icon-wrap--amber",
    iconTextClass: "text-warning",
    title: "Technical Architecture",
    description:
      "Uncover broken links (404s), missing assets, console errors, and insecure mixed-content warnings in the DOM.",
  },
  {
    id: "ai-ux",
    icon: "auto_awesome",
    iconColorClass: "feature-card__icon-wrap--purple",
    iconTextClass: "text-primary",
    title: "AI UX Review",
    description:
      "Leverage ML to detect layout shifts, overlapping elements, and suggest heuristic improvements for complex user interfaces.",
    hasGlow: true,
  },
];

function FeaturesSection() {
  return (
    <section
      className="features"
      id="features"
      aria-labelledby="features-headline"
    >
      <div className="section-header">
        <h2 id="features-headline">Comprehensive Analysis</h2>
        <p>Deep inspection across four critical domains.</p>
      </div>

      <div className="features__grid">
        {features.map((feature) => (
          <div key={feature.id} className="feature-card">
            {feature.hasGlow && <div className="feature-card__glow" />}

            <div
              className={`feature-card__icon-wrap ${feature.iconColorClass}`}
            >
              <span
                className={`material-symbols-outlined ${feature.iconTextClass}`}
                style={{ fontSize: "24px" }}
              >
                {feature.icon}
              </span>
            </div>

            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
