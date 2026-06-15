function HeroSection({ onStartAudit }) {
  return (
    <section className="hero" aria-labelledby="hero-headline">
      {/* Content */}
      <div className="hero__content">
        <h1 className="hero__headline" id="hero-headline">
          Find Website Issues{" "}
          <span className="hero__headline--accent">
            <br />Before Your Clients Do
          </span>
        </h1>

        <p className="hero__description">
          Automated website audits that detect broken images, accessibility
          issues, layout problems, and SEO mistakes in seconds. Engineered for
          professionals.
        </p>

        <div className="hero__actions">
          <button
            id="hero-start-audit"
            className="btn-primary"
            onClick={onStartAudit}
          >
            Start Free Audit
          </button>
          <button className="btn-secondary" id="hero-view-demo">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              play_circle
            </span>
            View Demo
          </button>
        </div>
      </div>

      {/* Product Preview Card */}
      <div className="preview-card" role="img" aria-label="DOMRefine audit dashboard preview">
        {/* Browser chrome bar */}
        <div className="preview-card__bar">
          <div className="preview-card__dots">
            <div className="preview-card__dot" />
            <div className="preview-card__dot" />
            <div className="preview-card__dot" />
          </div>
          <div className="preview-card__url">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              lock
            </span>
            domrefine.com/audit/report-xyz
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="preview-card__body">
          {/* Left: score + stats */}
          <div className="preview-card__main">
            {/* Overall Health */}
            <div className="preview-card__score">
              <div className="preview-card__score-label">
                <h3>Overall Health</h3>
                <p>Scanned 142 pages in 12.4s</p>
              </div>
              <div className="preview-card__score-number">94</div>
            </div>

            {/* Critical Issues + Warnings */}
            <div className="preview-card__stats">
              <div className="stat-card">
                <div className="stat-card__header stat-card__header--error">
                  <span className="material-symbols-outlined">error</span>
                  <span className="stat-card__label">Critical Issues</span>
                </div>
                <div className="stat-card__count">3</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__header stat-card__header--warning">
                  <span className="material-symbols-outlined">warning</span>
                  <span className="stat-card__label">Warnings</span>
                </div>
                <div className="stat-card__count">12</div>
              </div>
            </div>
          </div>

          {/* Right: Top Priorities */}
          <div className="preview-card__priorities">
            <p className="preview-card__priorities-title">Top Priorities</p>
            <ul className="priority-list">
              <li className="priority-item">
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontSize: "16px", marginTop: "2px" }}
                >
                  broken_image
                </span>
                <div className="priority-item__text">
                  <p>Missing Alt Text</p>
                  <p>/about-us (4 instances)</p>
                </div>
              </li>
              <li className="priority-item">
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontSize: "16px", marginTop: "2px" }}
                >
                  link_off
                </span>
                <div className="priority-item__text">
                  <p>404 Broken Link</p>
                  <p>/pricing → /old-pricing</p>
                </div>
              </li>
              <li className="priority-item">
                <span
                  className="material-symbols-outlined text-warning"
                  style={{ fontSize: "16px", marginTop: "2px" }}
                >
                  speed
                </span>
                <div className="priority-item__text">
                  <p>LCP &gt; 2.5s</p>
                  <p>/homepage</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
