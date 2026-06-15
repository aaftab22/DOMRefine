import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import AuditReport from "./components/AuditReport";

// ── View state machine ────────────────────────────────────────────
// 'landing'  → landing page
// 'loading'  → fullscreen loading screen (backend call in flight)
// 'report'   → audit report page
// ─────────────────────────────────────────────────────────────────

function App() {
  const [view,     setView]     = useState("landing");
  const [url,      setUrl]      = useState("");
  const [auditUrl, setAuditUrl] = useState("");
  const [rawData,  setRawData]  = useState(null);
  const auditRef                = useRef(null);
  const abortRef                = useRef(null);   // AbortController for in-flight request

  // ── Handlers ───────────────────────────────────────────────────

  const handleScrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Capture the URL and immediately navigate to loading screen
    setAuditUrl(trimmed);
    setRawData(null);
    setView("loading");

    // Create an abort controller so Cancel can stop the request
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/audit?url=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      setRawData(data);
      setView("report");
    } catch (err) {
      if (err.name === "AbortError") {
        // User cancelled — already navigated back to landing
        return;
      }
      // On real API errors still transition to report with partial data
      // so the UI doesn't get stuck. Pass a synthetic error payload.
      console.error("Audit failed:", err);
      setRawData({
        "Entered url": trimmed,
        audit: { errors: [], warnings: [] },
        analysis: {
          overall_score: 0,
          category_scores: { user_facing: 0, security: 0, accessibility: 0, technical: 0, seo: 0 },
          critical_issues: [{ type: "Connection Error", description: err.message, count: 0 }],
          warnings: [],
          recommended_fixes: [],
        },
        created_at: new Date().toISOString(),
      });
      setView("report");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setView("landing");
  };

  const handleNewAudit = () => {
    setRawData(null);
    setView("landing");
  };

  // ── Screens ────────────────────────────────────────────────────

  if (view === "loading") {
    return <LoadingScreen url={auditUrl} onCancel={handleCancel} />;
  }

  if (view === "report" && rawData) {
    return <AuditReport rawData={rawData} onNewAudit={handleNewAudit} />;
  }

  // ── Landing ───────────────────────────────────────────────────

  return (
    <>
      <Navbar onStartAudit={handleScrollToAudit} />

      <HeroSection onStartAudit={handleScrollToAudit} />

      {/* Inline audit widget */}
      <section id="audit" ref={auditRef} className="audit-widget">
        <div className="audit-widget__header">
          <h2>Run a Free Audit</h2>
          <p>Enter any URL and get a full technical report in seconds.</p>
        </div>

        <div className="audit-widget__input-row">
          <input
            id="audit-url-input"
            type="text"
            className="audit-widget__input"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRunAudit()}
            autoComplete="off"
          />
          <button
            id="audit-run-button"
            className="btn-primary"
            onClick={handleRunAudit}
            style={{ padding: "8px 24px" }}
          >
            Run Audit
          </button>
        </div>
      </section>

      <FeaturesSection />
      <ContactSection />

      <div className="footer-wrapper">
        <Footer />
      </div>
    </>
  );
}

export default App;