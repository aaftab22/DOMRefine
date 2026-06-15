import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";

// ── View state machine ──────────────────────────────────────────
// 'landing'  → user is on the landing page
// 'loading'  → audit is in progress (fullscreen, no nav)
// 'report'   → (future) audit results
// ───────────────────────────────────────────────────────────────

function App() {
  const [view, setView]     = useState("landing");   // current screen
  const [url, setUrl]       = useState("");
  const [auditUrl, setAuditUrl] = useState("");       // URL captured at submission
  const auditRef            = useRef(null);

  // ── Handlers ────────────────────────────────────────────────
  const handleStartAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Called when the user submits a URL to audit
  const handleRunAudit = () => {
    if (!url.trim()) return;
    setAuditUrl(url.trim());
    setView("loading");        // immediately navigate to loading screen
    // NOTE: backend API call will be wired here in the next step
  };

  // Cancel: return to landing (backend connection will cancel here later)
  const handleCancel = () => {
    setView("landing");
  };

  // ── Loading screen — fullscreen, no other chrome ────────────
  if (view === "loading") {
    return (
      <LoadingScreen
        url={auditUrl}
        onCancel={handleCancel}
      />
    );
  }

  // ── Landing page ────────────────────────────────────────────
  return (
    <>
      <Navbar onStartAudit={handleStartAudit} />

      <HeroSection onStartAudit={handleStartAudit} />

      {/* ── Inline Audit Widget ── */}
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