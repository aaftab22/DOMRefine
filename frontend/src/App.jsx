import { useState, useRef } from "react";
import ShaderBackground from "./components/ShaderBackground";
import Navbar           from "./components/Navbar";
import HeroSection      from "./components/HeroSection";
import FeaturesSection  from "./components/FeaturesSection";
import ContactSection   from "./components/ContactSection";
import Footer           from "./components/Footer";
import LoadingScreen    from "./components/LoadingScreen";
import AuditReport      from "./components/AuditReport";
import { runAudit }     from "./services/auditService";

// ── View state machine ────────────────────────────────────────────
// 'landing'  → landing page (always mounted while on landing/loading)
// 'loading'  → LoadingScreen renders as a fixed overlay ON TOP of landing
// 'report'   → audit report page (replaces everything)
// ─────────────────────────────────────────────────────────────────

function App() {
  const [view,       setView]       = useState("landing");
  const [url,        setUrl]        = useState("");
  const [auditUrl,   setAuditUrl]   = useState("");
  const [rawData,    setRawData]    = useState(null);
  const [useAI,      setUseAI]      = useState(true);
  const [auditError, setAuditError] = useState(null);
  const auditRef                    = useRef(null);
  const loadingTimerRef             = useRef(null);  // deferred loading overlay timer

  // ── Handlers ───────────────────────────────────────────────────

  const handleScrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunAudit = async (e) => {
    e?.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) return;

    setAuditError(null);

    let normalizedUrl = trimmed;
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;

    try { normalizedUrl = new URL(normalizedUrl).href; }
    catch { setAuditError("Please enter a valid URL."); return; }

    try {
      setAuditUrl(normalizedUrl);

      // Only show the loading overlay if the request takes > 200ms.
      // Fast failures (e.g. backend unreachable) won't produce a flash.
      loadingTimerRef.current = setTimeout(() => setView("loading"), 200);

      const data = await runAudit(normalizedUrl, useAI);

      clearTimeout(loadingTimerRef.current); // request done — cancel the timer
      setRawData(data);
      setView("report");
    } catch (err) {
      clearTimeout(loadingTimerRef.current); // cancel timer before hiding overlay
      console.error(err);
      setView("landing");
      const isNetwork = err instanceof TypeError && err.message.toLowerCase().includes("fetch");
      setAuditError(
        isNetwork
          ? "Unable to connect to the server. Please make sure the backend is running and try again."
          : `Audit failed: ${err.message}`
      );
    }
  };

  const handleCancel   = () => setView("landing");
  const handleNewAudit = () => {
    setRawData(null); setAuditUrl(""); setUrl(""); setAuditError(null); setView("landing");
  };

  // ── Report (full replacement — scroll position not relevant) ───
  if (view === "report" && rawData) {
    return <AuditReport rawData={rawData} onNewAudit={handleNewAudit} />;
  }

  // ── Landing + optional loading overlay ────────────────────────

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* ── Fixed WebGL shader ── */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      >
        <ShaderBackground style={{ width: "100%", height: "100%" }} />
      </div>

      {/* ── Landing page (always mounted while view !== "report") ── */}
      <Navbar onStartAudit={handleScrollToAudit} />

      <main>
        <HeroSection onStartAudit={handleScrollToAudit} />

        {/* ── Audit widget ── */}
        <section id="audit" ref={auditRef} className="hp-audit">
          <div className="hp-audit__inner">
            <div className="hp-audit__header">
              <h2 className="hp-audit__title">Run a Free Audit</h2>
              <p className="hp-audit__subtitle">
                Enter any URL and get a full technical report in seconds.
              </p>
            </div>

            <div className="hp-audit__form">
              <input
                id="audit-url-input"
                type="text"
                className="hp-audit__input"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setAuditError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleRunAudit(e)}
                autoComplete="off"
              />
              <button
                id="audit-run-button"
                type="button"
                className="hp-audit__btn"
                onClick={handleRunAudit}
              >
                Run Audit Now
              </button>
            </div>

            {/* Inline error banner */}
            {auditError && (
              <div className="hp-audit__error" role="alert">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", flexShrink: 0 }}>error</span>
                {auditError}
              </div>
            )}

            {/* AI Analysis setting card */}
            <div className="hp-audit__ai-card">
              <div className="hp-audit__ai-card-row">
                <div className="hp-audit__toggle-info">
                  <span className="hp-audit__toggle-label">AI Analysis</span>
                  <span className="hp-audit__toggle-desc">
                    Generate AI-powered insights and recommendations.
                    Disable to run only the standard audit.
                  </span>
                </div>
                <button
                  id="ai-toggle"
                  role="switch"
                  aria-checked={useAI}
                  aria-label="Toggle AI analysis"
                  className={`hp-toggle${useAI ? " hp-toggle--on" : ""}`}
                  onClick={() => setUseAI((v) => !v)}
                >
                  <span className="hp-toggle__thumb" />
                </button>
              </div>

              {!useAI && (
                <p className="hp-audit__ai-off-hint">
                  AI analysis is disabled. The audit will run without AI-generated insights.
                </p>
              )}
            </div>
          </div>
        </section>

        <FeaturesSection />
        <ContactSection />
      </main>

      <Footer />

      {/* ── Loading overlay (fixed, on top of landing) ── */}
      {view === "loading" && (
        <LoadingScreen url={auditUrl} onCancel={handleCancel} />
      )}
    </div>
  );
}

export default App;