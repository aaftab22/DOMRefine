import { useEffect, useRef, useState } from "react";

// ── Stage definitions (matches user spec) ──────────────────────────
const STAGES = [
  {
    percent: 12,
    title: "Checking page structure…",
    statuses: ["Crawling DOM structure…", "Mapping element hierarchy…", "Indexing page layout…"],
  },
  {
    percent: 28,
    title: "Scanning accessibility…",
    statuses: ["Checking ARIA roles…", "Evaluating color contrast…", "Verifying keyboard navigation…"],
  },
  {
    percent: 44,
    title: "Inspecting broken links…",
    statuses: ["Resolving internal URLs…", "Checking anchor targets…", "Validating href chains…"],
  },
  {
    percent: 60,
    title: "Verifying security headers…",
    statuses: ["Reading HTTP response headers…", "Checking Content-Security-Policy…", "Auditing X-Frame-Options…"],
  },
  {
    percent: 74,
    title: "Analyzing SEO architecture…",
    statuses: ["Checking meta tags…", "Validating canonical links…", "Inspecting heading structure…"],
  },
  {
    percent: 88,
    title: "Generating AI recommendations…",
    statuses: ["Processing audit findings…", "Ranking critical issues…", "Formulating fix suggestions…"],
  },
  {
    percent: 98,
    title: "Compiling report…",
    statuses: ["Generating insights…", "Formatting data…", "Finalizing results…"],
  },
];

// ── WebGL shader — recreated from the Stitch reference ────────────
function initShader(canvas) {
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return null;

  const vs = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;

  const fs = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float time = u_time * 0.2;
      vec3 color = vec3(0.05, 0.05, 0.06);
      float line = sin(uv.y * 10.0 + time + sin(uv.x * 5.0 + time)) * 0.5 + 0.5;
      line *= pow(1.0 - abs(uv.y - 0.5) * 2.0, 2.0);
      vec3 accent = vec3(0.23, 0.51, 0.96);
      color += accent * line * 0.15;
      float n = noise(uv + time);
      if (n > 0.99) color += accent * 0.2;
      gl_FragColor = vec4(color, 1.0);
    }`;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, "u_time");
  const uRes = gl.getUniformLocation(prog, "u_resolution");

  return { gl, uTime, uRes };
}

// ── SVG Ring ──────────────────────────────────────────────────────
const RADIUS = 48;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI; // ≈ 301.59

function ProgressRing({ percent }) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  return (
    <svg
      viewBox="0 0 100 100"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {/* Track */}
      <circle
        cx="50" cy="50" r={RADIUS}
        fill="transparent"
        stroke="rgba(42, 42, 42, 1)"
        strokeWidth="2"
      />
      {/* Progress */}
      <circle
        cx="50" cy="50" r={RADIUS}
        fill="transparent"
        stroke="#adc6ff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.3s ease-out",
        }}
      />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────
function LoadingScreen({ url, onCancel }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const rafRef = useRef(null);
  const roRef = useRef(null);
  const progIntRef = useRef(null);
  const statIntRef = useRef(null);

  const [percent, setPercent] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [statusText, setStatusText] = useState(STAGES[0].statuses[0]);
  const [statusVisible, setStatusVisible] = useState(true);

  // ── WebGL setup ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== "undefined") {
      roRef.current = new ResizeObserver(syncSize);
      roRef.current.observe(canvas);
    }
    syncSize();

    const shader = initShader(canvas);
    glRef.current = shader;

    function render(t) {
      if (!shader) return;
      if (typeof ResizeObserver === "undefined") syncSize();
      const { gl, uTime, uRes } = shader;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
    };
  }, []);

  // ── Progress + Stage cycling ──────────────────────────────────
  useEffect(() => {
    let currentPercent = 0;
    let currentStage = 0;
    let statusIdx = 0;

    function rotateStatus(stage) {
      clearInterval(statIntRef.current);
      statusIdx = 0;

      function showNext() {
        setStatusVisible(false);
        setTimeout(() => {
          setStatusText(STAGES[stage].statuses[statusIdx]);
          setStatusVisible(true);
          statusIdx = (statusIdx + 1) % STAGES[stage].statuses.length;
        }, 500);
      }

      showNext();
      statIntRef.current = setInterval(showNext, 2500);
    }

    rotateStatus(0);

    progIntRef.current = setInterval(() => {
      currentPercent += Math.random() * 1.8;
      if (currentPercent > 99) currentPercent = 99;
      setPercent(currentPercent);

      let newStage = currentStage;
      for (let i = 0; i < STAGES.length; i++) {
        if (currentPercent >= STAGES[i].percent) newStage = i;
      }

      if (newStage !== currentStage) {
        currentStage = newStage;
        setStageIndex(newStage);
        rotateStatus(newStage);
      }
    }, 200);

    return () => {
      clearInterval(progIntRef.current);
      clearInterval(statIntRef.current);
    };
  }, []);

  const stage = STAGES[stageIndex];

  return (
    <div style={styles.overlay}>
      {/* ── WebGL background ── */}
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />

      {/* ── Glassmorphism card ── */}
      <div style={styles.card}>

        {/* Progress indicator */}
        <div style={styles.ringWrap}>
          {/* Outer progress ring */}
          <ProgressRing percent={percent} />

          {/* Inner spinning dashed ring */}
          <svg
            viewBox="0 0 100 100"
            style={{
              position: "absolute",
              inset: "8px",
              width: "calc(100% - 16px)",
              height: "calc(100% - 16px)",
              opacity: 0.5,
              animation: "domrefine-spin 3s linear infinite",
            }}
          >
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="transparent"
              stroke="#adc6ff"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          </svg>

          {/* Center icon */}
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              zIndex: 10,
              fontSize: "48px",
              color: "#adc6ff",
              fontVariationSettings: '"FILL" 1',
              animation: "domrefine-pulse 2s ease-in-out infinite alternate",
            }}
          >
            memory
          </span>
        </div>

        {/* Percentage */}
        <div style={{ marginBottom: "16px" }}>
          <span style={styles.percent}>{Math.floor(percent)}%</span>
        </div>

        {/* Stage title */}
        <h2 style={styles.stageTitle}>{stage.title}</h2>

        {/* Rotating status message */}
        <div style={styles.statusWrap}>
          <p
            style={{
              ...styles.status,
              opacity: statusVisible ? 1 : 0,
              transform: statusVisible ? "translateY(0)" : "translateY(-5px)",
            }}
          >
            {statusText}
          </p>
        </div>

        {/* Auditing URL badge */}
        {url && (
          <div style={styles.urlBadge}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "13px", color: "#8c909f" }}
            >
              language
            </span>
            <span style={styles.urlText}>{url}</span>
          </div>
        )}

        {/* Cancel */}
        <button
          id="loading-cancel-btn"
          onClick={onCancel}
          style={styles.cancelBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#e5e2e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#c2c6d6";
          }}
        >
          Cancel Audit
        </button>
      </div>

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes domrefine-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes domrefine-pulse {
          from { filter: drop-shadow(0 0 10px rgba(77,142,255,0.2)); }
          to   { filter: drop-shadow(0 0 30px rgba(77,142,255,0.8)); }
        }
      `}</style>
    </div>
  );
}

// ── Styles object ─────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "#131313",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0.7,
    display: "block",
  },
  card: {
    position: "relative",
    zIndex: 10,
    width: "min(90%, 640px)",
    padding: "48px 40px",
    background: "rgba(19, 19, 19, 0.55)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "24px",
    boxShadow: "0 0 60px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 0,
  },
  ringWrap: {
    position: "relative",
    width: "192px",
    height: "192px",
    marginBottom: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontFamily: "'Geist', system-ui, sans-serif",
    fontSize: "56px",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.04em",
    color: "#e5e2e1",
  },
  stageTitle: {
    fontFamily: "'Geist', system-ui, sans-serif",
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.03em",
    color: "#d8e2ff",
    marginBottom: "8px",
    marginTop: 0,
  },
  statusWrap: {
    height: "24px",
    position: "relative",
    width: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
  },
  status: {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: "#c2c6d6",
    width: "100%",
    textAlign: "center",
    transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
  },
  urlBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "20px",
    padding: "4px 14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "9999px",
    maxWidth: "100%",
    overflow: "hidden",
  },
  urlText: {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "12px",
    color: "#8c909f",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "380px",
  },
  cancelBtn: {
    marginTop: "40px",
    padding: "8px 24px",
    borderRadius: "9999px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "#c2c6d6",
    fontFamily: "'Geist', system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "0.02em",
    cursor: "pointer",
    transition: "background 0.2s ease, color 0.2s ease",
  },
};

export default LoadingScreen;
