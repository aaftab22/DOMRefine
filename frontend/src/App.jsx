import { useState, useRef } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import AuditReport from "./components/AuditReport";
import { runAudit } from "./services/auditService";

function App() {
  const [view, setView] = useState("landing");
  const [url, setUrl] = useState("");
  const [auditUrl, setAuditUrl] = useState("");
  const auditRef = useRef(null);
  const [rawData, setRawData] = useState(null);

  const handleScrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    let normalizedUrl = trimmed;

    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      normalizedUrl = new URL(normalizedUrl).href;
    }
    catch {
      alert("Please enter a valid URL");
      return;
    }

    try {
      setAuditUrl(normalizedUrl);
      setView("loading");
      const data = await runAudit(normalizedUrl);

      //temprory
      console.log(data);

      setRawData(data);
      setView("report");
    }
    catch (error) {
        console.error(error);
        setView("landing"); 
    }
  };

  const handleCancel = () => {
    setView("landing");
  };

  const handleNewAudit = () => {
    setRawData(null);
    setAuditUrl("");
    setUrl("");
    setView("landing");
  };

  //Screens

  if (view === "loading") {
    return <LoadingScreen url={auditUrl} onCancel={handleCancel} />;
  }

  if (view === "report" && rawData) {
    return <AuditReport rawData={rawData} onNewAudit={handleNewAudit} />;
  }

  // Landing

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
          <input id="audit-url-input" type="text"
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