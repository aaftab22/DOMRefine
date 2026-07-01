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
// 'landing'  → full landing page
// 'loading'  → fullscreen loading (no other UI)
// 'report'   → audit report page
// ─────────────────────────────────────────────────────────────────

function App() {
  const [view,     setView]     = useState("landing");
  const [url,      setUrl]      = useState("");
  const [auditUrl, setAuditUrl] = useState("");
  const [rawData,  setRawData]  = useState(null);
  const [useAI,    setUseAI]    = useState(true);
  const auditRef                = useRef(null);

  // ── Handlers ───────────────────────────────────────────────────

  const handleScrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    let normalizedUrl = trimmed;
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;

    try { normalizedUrl = new URL(normalizedUrl).href; }
    catch { alert("Please enter a valid URL"); return; }

    try {
      setAuditUrl(normalizedUrl);
      setView("loading");
      const data = await runAudit(normalizedUrl, useAI);
      setRawData(data);
      setView("report");
    } catch (err) {
      console.error(err);
      setView("landing");
    }
  };

  const handleCancel   = () => setView("landing");
  const handleNewAudit = () => { setRawData(null); setAuditUrl(""); setUrl(""); setView("landing"); };

  // ── Fullscreen screens (no landing chrome) ─────────────────────

  if (view === "loading") {
    return <LoadingScreen url={auditUrl} onCancel={handleCancel} />;
  }

  if (view === "report" && rawData) {
    return <AuditReport rawData={rawData} onNewAudit={handleNewAudit} />;
  }

  // ── Landing ───────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* ── Fixed WebGL shader — covers the entire page ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <ShaderBackground style={{ width: "100%", height: "100%" }} />
      </div>

      {/* ── Page chrome ── */}
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
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunAudit()}
                autoComplete="off"
              />
              <button
                id="audit-run-button"
                className="hp-audit__btn"
                onClick={handleRunAudit}
              >
                Run Audit Now
              </button>
            </div>

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
    </div>
  );
}

export default App;