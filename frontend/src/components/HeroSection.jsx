export default function HeroSection({ onStartAudit }) {
  return (
    <section className="hp-hero">
      <div className="hp-hero__inner">

        {/* ── Left column ── */}
        <div className="hp-hero__left">
          <h1 className="hp-hero__headline">
            Audit All Your{" "}<br />
            <span className="hp-hero__headline-accent">Code</span>{" "}<br />
            Online
          </h1>

          <p className="hp-hero__desc">
            DOMRefine is an advanced auditing tool for developers,
            with the optimal architecture for web precision and SEO performance.
          </p>

          <div className="hp-hero__cta-wrap">
            <button
              id="hero-cta"
              className="hp-hero__cta"
              onClick={onStartAudit}
            >
              <span>Start Free Audit</span>
              {/* GitHub icon */}
              <svg
                className="hp-hero__cta-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Right column — Floating product window ── */}
        <div className="hp-hero__window-wrap">
          {/* Stacked shadow layers */}
          <div className="hp-hero__window-shadow-2" aria-hidden="true" />
          <div className="hp-hero__window-shadow-1" aria-hidden="true" />

          {/* Main window */}
          <div className="hp-hero__window">
            {/* Title bar */}
            <div className="hp-hero__window-bar">
              <div className="hp-hero__window-dots" aria-hidden="true">
                <span className="hp-hero__window-dot hp-hero__window-dot--red" />
                <span className="hp-hero__window-dot hp-hero__window-dot--yellow" />
                <span className="hp-hero__window-dot hp-hero__window-dot--green" />
              </div>
              <span className="hp-hero__window-title">domrefine.io</span>
            </div>

            {/* Window body */}
            <div className="hp-hero__window-body">

              {/* Audit card */}
              <div className="win-audit-card">
                <div className="win-audit-card__icon">
                  <span className="material-symbols-outlined"
                    style={{ fontVariationSettings: '"FILL" 1' }}>
                    terminal
                  </span>
                </div>
                <div className="win-audit-card__info">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="win-audit-card__type">Report</p>
                      <h3 className="win-audit-card__name">prod-audit-v1</h3>
                    </div>
                    <span className="win-badge-new">+New Scan</span>
                  </div>
                  <div className="win-badge-row">
                    <span className="win-badge win-badge--dark">AuditJS</span>
                    <span className="win-badge win-badge--running">
                      <span className="win-status-dot" />
                      Running
                    </span>
                  </div>
                </div>
              </div>

              {/* Domain */}
              <div>
                <div className="win-domain-label">
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>public</span>
                  Domains
                </div>
                <div className="win-domain-box">https://audit-v1.domrefine.dev</div>
              </div>

              {/* Logs */}
              <div className="win-logs">
                <div className="win-logs__header">Logs</div>
                <div className="win-logs__body">
                  <div className="win-logs__line" style={{ width: "128px" }} />
                  <div className="win-logs__line" style={{ width: "192px" }} />
                  <div className="win-logs__line" style={{ width: "160px" }} />
                  <div className="win-logs__line" style={{ width: "144px" }} />
                </div>
              </div>

              {/* Score chart */}
              <div>
                <p className="win-score-title">Audit Health Score</p>
                <div className="win-score-bars">
                  {[
                    { h: "25%",  o: "0.3"  },
                    { h: "75%",  o: "1"    },
                    { h: "50%",  o: "0.6"  },
                    { h: "40%",  o: "0.4"  },
                    { h: "60%",  o: "0.8"  },
                    { h: "20%",  o: "0.2"  },
                    { h: "40%",  o: "0.5"  },
                    { h: "50%",  o: "0.7"  },
                  ].map((bar, i) => (
                    <div
                      key={i}
                      className="win-score-bar"
                      style={{
                        height: bar.h,
                        background: `rgba(195, 204, 133, ${bar.o})`,
                      }}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
