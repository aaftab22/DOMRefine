import { useEffect, useRef } from "react";

const FEATURES = [
  {
    icon: "accessibility_new",
    title: "Accessibility",
    desc: "Ensure compliance with WCAG standards. Detect missing ARIA labels, poor contrast ratios, and keyboard navigation traps.",
    delay: 0,
  },
  {
    icon: "search_check",
    title: "SEO Performance",
    desc: "Identify missing meta tags, broken canonicals, duplicate content, and analyze core web vitals affecting search ranking.",
    delay: 100,
  },
  {
    icon: "architecture",
    title: "Technical Architecture",
    desc: "Uncover broken links (404s), missing assets, console errors, and insecure mixed-content warnings in the DOM.",
    delay: 200,
  },
  {
    icon: "neurology",
    title: "AI UX Review",
    desc: "Leverage ML to detect layout shifts, overlapping elements, and suggest heuristic improvements for complex user interfaces.",
    delay: 300,
  },
];

export default function FeaturesSection() {
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("hp-reveal--visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="hp-features">
      <div className="hp-features__inner">
        <div className="hp-features__header hp-reveal" ref={(el) => (cardRefs.current[0] = el)}>
          <h2 className="hp-features__title">Comprehensive Analysis</h2>
          <p className="hp-features__subtitle">Deep inspection across four critical domains.</p>
        </div>

        <div className="hp-features__grid">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className="hp-feature-card hp-reveal"
              ref={(el) => (cardRefs.current[i + 1] = el)}
              style={{ transitionDelay: `${feat.delay}ms` }}
            >
              <div className="hp-feature-card__icon-wrap">
                <span
                  className="material-symbols-outlined hp-feature-card__icon"
                  style={{ fontVariationSettings: '"FILL" 0', fontSize: "22px" }}
                >
                  {feat.icon}
                </span>
              </div>
              <h3 className="hp-feature-card__title">{feat.title}</h3>
              <p className="hp-feature-card__desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
