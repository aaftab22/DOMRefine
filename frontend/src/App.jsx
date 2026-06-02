import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setResult(null);
    setLoading(true);
    try {
        
      const response = await fetch(
        `http://127.0.0.1:8000/audit?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      setResult(data);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <h1 >DOMRefine</h1>

        <input
          type="text"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={runAudit}
          disabled={loading}
        >
          {loading ? "Auditing..." : "Run Audit"}
        </button>
        {loading && (
          <p>Analyzing website... This may take 10-30 seconds.</p>
        )}
      </div>

      {result && (
        <>
          <h2>Score: {result.analysis.score}/100</h2>

          <h3>Summary</h3>
          <p>{result.analysis.summary}</p>

          <h3>Critical Issues</h3>
          <ul>
            {result.analysis.critical_issues.map((issue, index) => (
              <li key={index}>
                <strong>{issue.issue}</strong> ({issue.severity})
                <p>{JSON.stringify(issue.details)}</p>
              </li>
            ))}
          </ul>

          <h3>Warnings</h3>
          <ul>
            {result.analysis.warnings.map((warning, index) => (
              <li key={index}>
                <strong>{warning.issue}</strong>
                <p>{JSON.stringify(warning.details)}</p>
              </li>
            ))}
          </ul>

          <h3>Recommended Fixes</h3>
          <ul>
            {result.analysis.recommended_fixes.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;