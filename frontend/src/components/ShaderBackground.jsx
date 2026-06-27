import { useEffect, useRef } from "react";

/* ----------------------------------------------------------------
   Vertex shader — full-screen quad
   ---------------------------------------------------------------- */
const VS = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

/* ----------------------------------------------------------------
   Fragment shader — Simplex noise organic motion + earthy palette
   ---------------------------------------------------------------- */
const FS = `
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;

/* Simplex 2D noise -------------------------------------------- */
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4( 0.211324865405187,  0.366025403784439,
                      -0.577350269189626,  0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy  -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz  + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
/* ------------------------------------------------------------- */

void main() {
  vec2 uv    = v_texCoord;
  vec2 mouse = u_mouse / u_resolution;

  /* Layered noise for organic movement */
  float n1 = snoise(uv * 2.0 + u_time * 0.1);
  float n2 = snoise(uv * 4.0 - u_time * 0.2 + n1);

  /* Earthy Precision palette */
  vec3 bg      = vec3(0.075, 0.078, 0.059); /* #13140f */
  vec3 primary = vec3(0.388, 0.420, 0.184); /* #636b2f */
  vec3 accent  = vec3(0.729, 0.753, 0.584); /* #bac095 */

  float mask = smoothstep(-0.5, 0.8, n2);
  vec3  color = mix(bg, primary * 0.4, mask);

  /* Subtle mouse glow */
  float dist = distance(uv, mouse);
  float glow = smoothstep(0.4, 0.0, dist) * 0.15;
  color += accent * glow;

  /* Vignette */
  float vig = smoothstep(0.8, 0.2, length(uv - 0.5));
  color *= vig * 0.8 + 0.2;

  gl_FragColor = vec4(color, 1.0);
}`;

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER,   VS));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  return prog;
}

/* ----------------------------------------------------------------
   Component
   ---------------------------------------------------------------- */
export default function ShaderBackground({ style }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const roRef     = useRef(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 }); // normalized

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Size sync */
    function syncSize() {
      const w = canvas.clientWidth  || 1280;
      const h = canvas.clientHeight || 800;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
    }
    if (typeof ResizeObserver !== "undefined") {
      roRef.current = new ResizeObserver(syncSize);
      roRef.current.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const prog = createProgram(gl);
    gl.useProgram(prog);

    /* Full-screen quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, "u_time");
    const uRes   = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    /* Mouse tracking — update ref only, no re-render */
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = 1.0 - (e.clientY - rect.top)  / rect.height;
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    /* Render loop */
    function render(t) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime)  gl.uniform1f(uTime,  t * 0.001);
      if (uRes)   gl.uniform2f(uRes,   canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouseRef.current.x * canvas.width, mouseRef.current.y * canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      roRef.current?.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
