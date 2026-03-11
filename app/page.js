"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── KaTeX loader ─────────────────────────────────────────────────────────────
function useMath() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.katex) { setReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function MathEq({ tex, display = false }) {
  const ref = useRef(null);
  const ready = useMath();
  useEffect(() => {
    if (ready && ref.current && window.katex) {
      try {
        window.katex.render(tex, ref.current, { displayMode: display, throwOnError: false });
      } catch (e) {}
    }
  }, [ready, tex, display]);
  return <span ref={ref} style={{ color: display ? "#90ee90" : "#b8e6b8", fontSize: display ? "1.05em" : "0.95em" }} />;
}

// ─── Shared Slider ─────────────────────────────────────────────────────────────
function Slider({ label, min, max, val, step, onChange, color }) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666", minWidth: 130 }}>{label}</span>
      <input
        type="range" min={min} max={max} value={val} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: color, cursor: "pointer" }}
      />
      <span style={{ fontFamily: "monospace", fontSize: 11, color, minWidth: 44, textAlign: "right" }}>
        {Number(val).toFixed(decimals)}
      </span>
    </div>
  );
}

function BtnRow({ options, active, onSelect, color }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {options.map(o => (
        <button key={o} onClick={() => onSelect(o)} style={{
          padding: "5px 12px", borderRadius: 7, border: `1px solid ${color}`,
          background: active === o ? color : "transparent",
          color: active === o ? "#000" : color,
          fontFamily: "monospace", fontSize: 11, cursor: "pointer", fontWeight: active === o ? 700 : 400
        }}>{o}</button>
      ))}
    </div>
  );
}

function OutputCard({ label, value, color }) {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function OutputGrid({ cards }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 6, marginTop: 10 }}>
      {cards.map((c, i) => <OutputCard key={i} {...c} />)}
    </div>
  );
}

function InteractiveWrap({ label, color, children }) {
  return (
    <div style={{ background: "#111317", border: `1px solid ${color}44`, borderRadius: 12, padding: 16, marginTop: 14 }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", color, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        {label}
        <div style={{ flex: 1, height: 1, background: `${color}22` }} />
      </div>
      {children}
    </div>
  );
}

// ─── Canvas helper hook ────────────────────────────────────────────────────────
function useCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    draw(ctx, cv.width, cv.height);
  }, deps); // eslint-disable-line
  return ref;
}

// ════════════════════════════════════════════════════════════════════════════════
//  INTERACTIVE LABS
// ════════════════════════════════════════════════════════════════════════════════

// 1. Loss Surface
function LossSurface({ color }) {
  const [theta, setTheta] = useState(0.5);
  const L = t => (t - 1) ** 2 + 0.3 * Math.sin(3 * t) + 0.5;
  const dL = t => 2 * (t - 1) + 0.9 * Math.cos(3 * t);
  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const tx = t => (t + 3) / 6 * W, ty = v => H - 20 - (v / 4) * (H - 40);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 200; i++) { const t = -3 + i * 6 / 200; i === 0 ? ctx.moveTo(tx(t), ty(L(t))) : ctx.lineTo(tx(t), ty(L(t))); }
    ctx.stroke();
    const px = tx(theta), py = ty(L(theta));
    const g = dL(theta), scale = 20;
    ctx.beginPath(); ctx.strokeStyle = "#ff6b6b"; ctx.lineWidth = 2;
    ctx.moveTo(px, py); ctx.lineTo(px - g * scale, py); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }, [theta, color]);
  return (
    <InteractiveWrap label="LOSS SURFACE EXPLORER" color={color}>
      <canvas ref={cvRef} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block" }} />
      <Slider label="θ (parameter)" min={-3} max={3} val={theta} step={0.01} onChange={setTheta} color={color} />
      <OutputGrid cards={[
        { label: "Loss L(θ)", value: L(theta).toFixed(3), color },
        { label: "Gradient ∂L/∂θ", value: dL(theta).toFixed(3), color: "#ff6b6b" },
        { label: "θ after step (α=0.1)", value: (theta - 0.1 * dL(theta)).toFixed(3), color: "#888" }
      ]} />
    </InteractiveWrap>
  );
}

// 2. Linear Regression
const LR_PTS = [[1,14],[2,24],[3,31],[4,40],[5,48],[6,55],[7,65],[8,70],[9,80]];
function LinearRegression({ color }) {
  const [w, setW] = useState(8); const [b, setB] = useState(5);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const animRef = useRef(null); const stateRef = useRef({ w: 8, b: 5 });
  const mse = LR_PTS.reduce((s, [x, y]) => s + (y - (w * x + b)) ** 2, 0) / LR_PTS.length;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const sx = p => (p / 11) * W * 0.9 + 20, sy = p => H - 20 - (p / 90) * (H - 40);
    LR_PTS.forEach(([x, y]) => {
      const yh = w * x + b;
      ctx.strokeStyle = "rgba(255,100,100,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(x), sy(yh)); ctx.stroke();
    });
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.moveTo(sx(0), sy(b)); ctx.lineTo(sx(10), sy(w * 10 + b)); ctx.stroke();
    LR_PTS.forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(sx(x), sy(y), 5, 0, Math.PI * 2); ctx.fillStyle = "#e0e0ff"; ctx.fill();
    });
  }, [w, b, color]);

  const runGD = useCallback(() => {
    if (running) { setRunning(false); cancelAnimationFrame(animRef.current); return; }
    setRunning(true); stateRef.current = { w, b };
    const step = () => {
      const { w: cw, b: cb } = stateRef.current;
      const lr = 0.002, n = LR_PTS.length;
      let dw = 0, db = 0;
      LR_PTS.forEach(([x, y]) => { const e = (cw * x + cb) - y; dw += e * x; db += e; });
      const nw = cw - lr * dw / n, nb = cb - lr * db / n;
      stateRef.current = { w: nw, b: nb };
      setW(nw); setB(nb); setSteps(s => s + 1);
      const mseNow = LR_PTS.reduce((s, [x, y]) => s + (y - (nw * x + nb)) ** 2, 0) / LR_PTS.length;
      if (mseNow > 0.5) animRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    animRef.current = requestAnimationFrame(step);
  }, [running, w, b]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <InteractiveWrap label="LINEAR REGRESSION — MANUAL & AUTO FIT" color={color}>
      <canvas ref={cvRef} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", marginBottom: 10 }} />
      <Slider label="weight w" min={-5} max={15} val={w} step={0.1} onChange={v => { setW(v); setSteps(0); }} color={color} />
      <Slider label="bias b" min={-20} max={40} val={b} step={0.5} onChange={v => { setB(v); setSteps(0); }} color={color} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={runGD} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${color}`, background: running ? color : "transparent", color: running ? "#000" : color, fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>
          {running ? "⏸ Pause" : "▶ Run Gradient Descent"}
        </button>
        <button onClick={() => { cancelAnimationFrame(animRef.current); setRunning(false); setW(8); setB(5); setSteps(0); }} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid #444`, background: "transparent", color: "#888", fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>Reset</button>
      </div>
      <OutputGrid cards={[
        { label: "MSE Loss", value: mse.toFixed(1), color },
        { label: "w (weight)", value: w.toFixed(2), color: "#aaa" },
        { label: "b (bias)", value: b.toFixed(2), color: "#aaa" },
        { label: "GD Steps", value: steps, color: "#666" }
      ]} />
    </InteractiveWrap>
  );
}

// 3. Gradient Descent
function GradientDescent({ color }) {
  const [lr, setLr] = useState(0.3);
  const [start, setStart] = useState(2.5);
  const [opt, setOpt] = useState("SGD");
  const [trail, setTrail] = useState([]);
  const L = t => (t - 1) ** 2 + 0.5 * Math.sin(5 * t) + 0.3 * Math.cos(t) + 1;
  const dL = t => 2 * (t - 1) + 2.5 * Math.cos(5 * t) - 0.3 * Math.sin(t);

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const tx = t => (t + 3.5) / 7.5 * W, ty = v => H - 20 - (v / 5) * (H - 40);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 300; i++) { const t = -3.5 + i * 7.5 / 300; i === 0 ? ctx.moveTo(tx(t), ty(L(t))) : ctx.lineTo(tx(t), ty(L(t))); }
    ctx.stroke();
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tx(0.92), 20); ctx.lineTo(tx(0.92), H); ctx.stroke();
    ctx.setLineDash([]);
    if (trail.length > 1) {
      ctx.beginPath(); ctx.strokeStyle = "rgba(255,200,80,0.7)"; ctx.lineWidth = 1.5;
      trail.forEach((p, i) => i === 0 ? ctx.moveTo(tx(p[0]), ty(p[1])) : ctx.lineTo(tx(p[0]), ty(p[1])));
      ctx.stroke();
    }
    if (trail.length) {
      const [th] = trail[trail.length - 1];
      ctx.beginPath(); ctx.arc(tx(th), ty(L(th)), 7, 0, Math.PI * 2); ctx.fillStyle = "#ffb347"; ctx.fill();
    }
  }, [trail, color]);

  const run = () => {
    let theta = start, m = 0, v2 = 0, t2 = 0;
    const h = [[theta, L(theta)]];
    for (let i = 0; i < 200; i++) {
      const g = dL(theta);
      if (opt === "SGD") { theta -= lr * g; }
      else if (opt === "Momentum") { m = 0.9 * m + g; theta -= lr * m; }
      else { t2++; m = 0.9 * m + 0.1 * g; v2 = 0.999 * v2 + 0.001 * g * g; const mh = m / (1 - 0.9 ** t2), vh = v2 / (1 - 0.999 ** t2); theta -= lr * mh / (Math.sqrt(vh) + 1e-8); }
      h.push([theta, L(theta)]);
      if (Math.abs(dL(theta)) < 0.005) break;
    }
    setTrail(h);
  };

  const last = trail[trail.length - 1];
  return (
    <InteractiveWrap label="GRADIENT DESCENT — OPTIMIZER COMPARISON" color={color}>
      <canvas ref={cvRef} width={420} height={220} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block" }} />
      <Slider label="learning rate α" min={0.01} max={1.5} val={lr} step={0.01} onChange={setLr} color={color} />
      <Slider label="starting θ₀" min={-3} max={3} val={start} step={0.1} onChange={v => { setStart(v); setTrail([[v, L(v)]]); }} color={color} />
      <BtnRow options={["SGD", "Momentum", "Adam"]} active={opt} onSelect={setOpt} color={color} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={run} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${color}`, background: "transparent", color, fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>▶ Run</button>
        <button onClick={() => { setTrail([[start, L(start)]]); }} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #444", background: "transparent", color: "#888", fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>Clear</button>
      </div>
      <OutputGrid cards={[
        { label: "θ current", value: last ? last[0].toFixed(3) : "-", color },
        { label: "Loss", value: last ? last[1].toFixed(3) : "-", color: "#aaa" },
        { label: "Steps", value: trail.length ? trail.length - 1 : 0, color: "#666" }
      ]} />
    </InteractiveWrap>
  );
}

// 4. Logistic
const LOG_PTS = [[-2.2,0],[-1.8,0],[-1.5,0],[-1.0,0],[-0.5,0],[0.2,0],[0.5,1],[1.0,1],[1.5,1],[2.0,1],[2.5,1],[3.0,1]];
function Logistic({ color }) {
  const [w, setW] = useState(2); const [b, setB] = useState(-1); const [thresh, setThresh] = useState(0.5);
  const sig = z => 1 / (1 + Math.exp(-z));
  const xb = (-Math.log(1 / thresh - 1) - b) / w;
  const correct = LOG_PTS.filter(([x, y]) => (sig(w * x + b) >= thresh ? 1 : 0) === y).length;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const sx = x => (x + 3.5) / 7.5 * W, sy = p => H - 20 - p * (H - 40);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 200; i++) { const x = -3.5 + i * 7.5 / 200, p = sig(w * x + b); i === 0 ? ctx.moveTo(sx(x), sy(p)) : ctx.lineTo(sx(x), sy(p)); }
    ctx.stroke();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, sy(thresh)); ctx.lineTo(W, sy(thresh)); ctx.stroke();
    ctx.setLineDash([]);
    if (isFinite(xb)) { ctx.strokeStyle = "#ff6b6b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(xb), 20); ctx.lineTo(sx(xb), H); ctx.stroke(); }
    LOG_PTS.forEach(([x, y]) => {
      const p = sig(w * x + b), pred = p >= thresh ? 1 : 0;
      ctx.beginPath(); ctx.arc(sx(x), sy(0.1 + y * 0.8), 6, 0, Math.PI * 2);
      ctx.fillStyle = y === 1 ? "#4fffb0" : "#ff7043"; ctx.fill();
      if (pred !== y) { ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 2; ctx.stroke(); }
    });
  }, [w, b, thresh, color]);

  return (
    <InteractiveWrap label="LOGISTIC REGRESSION — DECISION BOUNDARY" color={color}>
      <canvas ref={cvRef} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", marginBottom: 8 }} />
      <Slider label="weight w" min={-5} max={5} val={w} step={0.1} onChange={setW} color={color} />
      <Slider label="bias b" min={-5} max={5} val={b} step={0.1} onChange={setB} color={color} />
      <Slider label="threshold" min={0.1} max={0.9} val={thresh} step={0.01} onChange={setThresh} color={color} />
      <OutputGrid cards={[
        { label: "Boundary x", value: isFinite(xb) ? xb.toFixed(2) : "∞", color },
        { label: "Accuracy", value: Math.round(correct / LOG_PTS.length * 100) + "%", color: "#aaa" }
      ]} />
    </InteractiveWrap>
  );
}

// 5. Neuron
const ACT = {
  relu: { fn: z => Math.max(0, z), d: z => z > 0 ? 1 : 0 },
  sigmoid: { fn: z => 1 / (1 + Math.exp(-z)), d: z => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); } },
  tanh: { fn: z => Math.tanh(z), d: z => 1 - Math.tanh(z) ** 2 },
  gelu: { fn: z => z * 0.5 * (1 + Math.tanh(0.7978846 * (z + 0.044715 * z ** 3))), d: z => { const v = 0.5 * (1 + Math.tanh(0.7978846 * (z + 0.044715 * z ** 3))); return v + z * 0.5 * (1 - v * v) * 0.7978846 * (1 + 3 * 0.044715 * z ** 2); } }
};

function Neuron({ color }) {
  const [xs, setXs] = useState([0.8, -0.3, 0.5]);
  const [ws, setWs] = useState([0.6, 0.9, -0.4]);
  const [bias, setBias] = useState(0.1);
  const [act, setAct] = useState("relu");
  const z = xs.reduce((s, x, i) => s + x * ws[i], bias);
  const { fn, d } = ACT[act];
  const out = fn(z), grad = d(z);

  const actCvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let i = 0; i <= 200; i++) { const zz = -4 + i * 8 / 200, y = fn(zz), px = W / 2 + zz / 4 * W / 2, py = H / 2 - y * H / 2.5; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
    ctx.stroke();
    const px = Math.max(5, Math.min(W - 5, W / 2 + z / 4 * W / 2));
    const py = Math.max(5, Math.min(H - 5, H / 2 - out * H / 2.5));
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = "#555"; ctx.font = "9px monospace";
    ctx.fillText(`${act}(z)  — f'(z) = ${grad.toFixed(2)}`, 8, H - 6);
  }, [z, out, act, color]);

  return (
    <InteractiveWrap label="ARTIFICIAL NEURON — INPUTS, WEIGHTS, ACTIVATION" color={color}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: "#0d0f13", borderRadius: 8, padding: 10, border: "1px solid #1e2229" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4 }}>Input / Weight {i + 1}</div>
            <Slider label={`x${i+1}`} min={-2} max={2} val={xs[i]} step={0.1} onChange={v => setXs(p => p.map((x, j) => j === i ? v : x))} color="#88aaff" />
            <Slider label={`w${i+1}`} min={-2} max={2} val={ws[i]} step={0.1} onChange={v => setWs(p => p.map((x, j) => j === i ? v : x))} color={color} />
          </div>
        ))}
        <Slider label="bias b" min={-2} max={2} val={bias} step={0.1} onChange={setBias} color="#ff9a9a" />
        <BtnRow options={["relu", "sigmoid", "tanh", "gelu"]} active={act} onSelect={setAct} color={color} />
      </div>
      <canvas ref={actCvRef} width={420} height={80} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", marginTop: 10 }} />
      <OutputGrid cards={[
        { label: "z = w·x + b", value: z.toFixed(3), color: "#aaa" },
        { label: `output f(z)`, value: out.toFixed(3), color },
        { label: "f'(z) gradient", value: grad.toFixed(3), color: "#ff9a9a" }
      ]} />
    </InteractiveWrap>
  );
}

// 6. MLP
function MLP({ color }) {
  const [layers, setLayers] = useState(3);
  const [neurons, setNeurons] = useState(64);
  const [inputDim, setInputDim] = useState(128);
  const [outputDim, setOutputDim] = useState(10);
  const dims = [inputDim, ...Array(layers).fill(neurons), outputDim];
  let params = 0, flops = 0;
  for (let i = 0; i < dims.length - 1; i++) { params += dims[i] * dims[i + 1] + dims[i + 1]; flops += 2 * dims[i] * dims[i + 1]; }
  const fmt = n => n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const maxShow = 8, numL = dims.length;
    const lx = i => 30 + i * (W - 60) / (numL - 1);
    const ny = (n, j) => H / 2 + (j - (Math.min(n, maxShow) - 1) / 2) * (H - 40) / maxShow;
    ctx.globalAlpha = 0.08; ctx.strokeStyle = color; ctx.lineWidth = 0.5;
    for (let l = 0; l < numL - 1; l++) {
      const n1 = Math.min(dims[l], maxShow), n2 = Math.min(dims[l + 1], maxShow);
      for (let a = 0; a < n1; a++) for (let bk = 0; bk < n2; bk++) {
        ctx.beginPath(); ctx.moveTo(lx(l), ny(dims[l], a)); ctx.lineTo(lx(l + 1), ny(dims[l + 1], bk)); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    dims.forEach((n, l) => {
      const show = Math.min(n, maxShow);
      for (let j = 0; j < show; j++) {
        ctx.beginPath(); ctx.arc(lx(l), ny(n, j), l === 0 || l === numL - 1 ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = l === 0 ? "#e0e0ff" : l === numL - 1 ? "#ffb347" : color; ctx.fill();
      }
      if (n > maxShow) { ctx.fillStyle = "#555"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText("...", lx(l), H - 8); }
      ctx.fillStyle = l === 0 ? "#7070aa" : l === numL - 1 ? "#aa7030" : color;
      ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(n <= 999 ? n : "1K+", lx(l), H - 2);
      ctx.textAlign = "left";
    });
  }, [dims.join(","), color]);

  return (
    <InteractiveWrap label="MLP ARCHITECTURE — DESIGN & PARAMETER COUNT" color={color}>
      <Slider label="Hidden layers" min={1} max={6} val={layers} step={1} onChange={setLayers} color={color} />
      <Slider label="Neurons per layer" min={4} max={512} val={neurons} step={4} onChange={setNeurons} color={color} />
      <Slider label="Input dim" min={1} max={1024} val={inputDim} step={1} onChange={setInputDim} color={color} />
      <Slider label="Output dim" min={1} max={100} val={outputDim} step={1} onChange={setOutputDim} color={color} />
      <canvas ref={cvRef} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "10px 0" }} />
      <OutputGrid cards={[
        { label: "Total Params", value: fmt(params), color },
        { label: "FLOPs (fwd)", value: fmt(flops), color: "#aaa" },
        { label: "Memory fp32", value: `${(params * 4 / 1e6).toFixed(1)}MB`, color: "#888" }
      ]} />
    </InteractiveWrap>
  );
}

// 7. Backprop
function Backprop({ color }) {
  const [numLayers, setNumLayers] = useState(8);
  const [actFn, setActFn] = useState("sigmoid");
  const avgGrad = { sigmoid: 0.25, relu: 0.5, tanh: 0.42 };
  const g = avgGrad[actFn];
  const grads = Array.from({ length: numLayers }, (_, i) => Math.pow(g, numLayers - 1 - i));

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const bw = (W - 40) / numLayers;
    const cols = { sigmoid: "255,112,67", relu: "79,255,176", tanh: "124,131,253" };
    grads.forEach((gv, i) => {
      const x = 20 + i * bw, barH = Math.max(1, (gv / 1) * (H - 50));
      const alpha = Math.min(1, 0.2 + gv * 3);
      ctx.fillStyle = `rgba(${cols[actFn]},${alpha})`;
      ctx.fillRect(x, H - 30 - barH, bw - 3, barH);
      if (i === 0 || i === numLayers - 1 || i === Math.floor(numLayers / 2)) {
        ctx.fillStyle = "#555"; ctx.font = "8px monospace"; ctx.textAlign = "center";
        ctx.fillText(`L${i + 1}`, x + bw / 2, H - 16);
        ctx.fillText(gv.toExponential(0), x + bw / 2, H - 4);
      }
    });
    ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`← gradient flows backward (shrinks ~${g}× per ${actFn} layer)`, 8, 14);
    ctx.textAlign = "left";
  }, [numLayers, actFn, color]);

  return (
    <InteractiveWrap label="BACKPROP — GRADIENT FLOW & VANISHING GRADIENTS" color={color}>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Watch how gradients shrink backwards through activations</p>
      <Slider label="Num layers" min={2} max={15} val={numLayers} step={1} onChange={setNumLayers} color={color} />
      <BtnRow options={["sigmoid", "relu", "tanh"]} active={actFn} onSelect={setActFn} color={color} />
      <canvas ref={cvRef} width={420} height={160} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Grad at layer 1", value: grads[0].toExponential(2), color },
        { label: "Grad at last layer", value: grads[numLayers - 1].toExponential(2), color: "#ff6b6b" },
        { label: "Shrinkage ratio", value: `${(grads[0] / (grads[numLayers - 1] || 1e-20)).toExponential(1)}×`, color: "#aaa" }
      ]} />
    </InteractiveWrap>
  );
}

// 8. Regularization
function Regularization({ color }) {
  const [cap, setCap] = useState(5);
  const [data, setData] = useState(200);
  const [drop, setDrop] = useState(0);
  const [l2, setL2] = useState(0);
  const epochs = 50;
  const overfit = cap * 50 / data;
  const reg = drop * 0.6 + l2 * 2;
  const trainLoss = Array.from({ length: epochs }, (_, e) => Math.exp(-(e + 1) * 0.12) * 0.8 + 0.08);
  const valLoss = trainLoss.map((t, e) => t + Math.max(0, (overfit - reg) * 0.3 * (1 - Math.exp(-(e + 1) * 0.08))));
  const tf = trainLoss[epochs - 1], vf = valLoss[epochs - 1];
  const state = vf - tf < 0.02 ? "Good fit" : vf - tf < 0.08 ? "Slight overfit" : "Overfit!";
  const stateColor = state === "Good fit" ? color : state === "Slight overfit" ? "#ffb347" : "#ff6b6b";

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const maxL = Math.max(...trainLoss, ...valLoss);
    const sx = e => (e / epochs) * (W - 40) + 20, sy = l => H - 20 - (l / maxL) * (H - 40);
    [[trainLoss, color, "Train"], [valLoss, "#ff6b6b", "Val"]].forEach(([arr, c, lbl]) => {
      ctx.beginPath(); ctx.strokeStyle = c; ctx.lineWidth = 2;
      arr.forEach((l, i) => i === 0 ? ctx.moveTo(sx(i + 1), sy(l)) : ctx.lineTo(sx(i + 1), sy(l)));
      ctx.stroke();
      ctx.fillStyle = c; ctx.font = "10px monospace"; ctx.fillText(lbl, W - 35, lbl === "Train" ? 18 : 30);
    });
    ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.fillText("Epoch →", W / 2 - 20, H - 4);
  }, [cap, data, drop, l2, color]);

  return (
    <InteractiveWrap label="OVERFITTING & REGULARIZATION" color={color}>
      <Slider label="Model capacity" min={1} max={10} val={cap} step={1} onChange={setCap} color={color} />
      <Slider label="Training data size" min={50} max={2000} val={data} step={50} onChange={setData} color={color} />
      <Slider label="Dropout rate p" min={0} max={0.8} val={drop} step={0.05} onChange={setDrop} color={color} />
      <Slider label="L2 weight decay λ" min={0} max={0.5} val={l2} step={0.01} onChange={setL2} color={color} />
      <canvas ref={cvRef} width={420} height={180} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Train Loss", value: tf.toFixed(3), color },
        { label: "Val Loss", value: vf.toFixed(3), color: "#ff6b6b" },
        { label: "Gap", value: (vf - tf).toFixed(3), color: "#aaa" },
        { label: "State", value: state, color: stateColor }
      ]} />
    </InteractiveWrap>
  );
}

// 9. Param Sharing
function ParamSharing({ color }) {
  const [size, setSize] = useState(64);
  const [filters, setFilters] = useState(32);
  const [kernel, setKernel] = useState(3);
  const [hidden, setHidden] = useState(512);
  const inp = size * size * 3;
  const fcP = inp * hidden + hidden;
  const convP = kernel * kernel * 3 * filters + filters;
  const fmt = n => n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;
  return (
    <InteractiveWrap label="PARAMETER SHARING — FC vs CNN" color={color}>
      <Slider label="Image size W×W" min={16} max={256} val={size} step={8} onChange={setSize} color={color} />
      <Slider label="Num filters" min={1} max={256} val={filters} step={1} onChange={setFilters} color={color} />
      <Slider label="Kernel size k×k" min={1} max={11} val={kernel} step={2} onChange={setKernel} color={color} />
      <Slider label="FC hidden units" min={64} max={4096} val={hidden} step={64} onChange={setHidden} color={color} />
      <OutputGrid cards={[
        { label: "FC Layer Params", value: fmt(fcP), color: "#ff6b6b" },
        { label: "Conv Layer Params", value: fmt(convP), color },
        { label: "FC/Conv ratio", value: Math.round(fcP / convP) + "×", color: "#ffb347" },
        { label: "Param saving", value: `${((1 - convP / fcP) * 100).toFixed(1)}%`, color: "#aaa" }
      ]} />
    </InteractiveWrap>
  );
}

// 10. Convolution
const KERNELS = {
  "edge h": [[1, 2, 1], [0, 0, 0], [-1, -2, -1]],
  "edge v": [[1, 0, -1], [2, 0, -2], [1, 0, -1]],
  blur: [[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]],
  sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]]
};
function Convolution({ color }) {
  const SZ = 8;
  const [grid, setGrid] = useState(() => Array.from({ length: SZ }, (_, r) => Array.from({ length: SZ }, (_, c) => (r === 3 || r === 4) ? 1 : ((c === 3 || c === 4) && r > 1 && r < 6 ? 0.5 : 0))));
  const [curK, setCurK] = useState("edge h");
  const K = KERNELS[curK];
  const outsz = SZ - 3 + 1;
  const outVals = Array.from({ length: outsz }, (_, r) => Array.from({ length: outsz }, (_, c) => { let s = 0; for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++) s += grid[r + m][c + n] * K[m][n]; return s; }));
  const flat = outVals.flat(), mn = Math.min(...flat), mx = Math.max(...flat);

  const inCvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const cell = W / SZ;
    grid.forEach((row, r) => row.forEach((v, c) => {
      ctx.fillStyle = `rgba(124,131,253,${v})`; ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
    }));
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 0.5;
    for (let i = 1; i < SZ; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(W, i * cell); ctx.stroke(); }
  }, [grid, color]);

  const kCvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const kc = W / 3;
    const flat2 = K.flat(), mn2 = Math.min(...flat2), mx2 = Math.max(...flat2);
    K.forEach((row, r) => row.forEach((v, c) => {
      const norm = (v - mn2) / (mx2 - mn2 || 1);
      ctx.fillStyle = `rgba(255,180,70,${norm})`; ctx.fillRect(c * kc + 1, r * kc + 1, kc - 2, kc - 2);
      ctx.fillStyle = "#fff"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(v.toFixed(1), (c + 0.5) * kc, (r + 0.5) * kc + 3);
    }));
  }, [curK]);

  const outCvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const oc = W / outsz;
    outVals.forEach((row, r) => row.forEach((v, c) => {
      const norm = (v - mn) / (mx - mn || 1);
      ctx.fillStyle = `rgba(124,131,253,${norm})`; ctx.fillRect(c * oc + 1, r * oc + 1, oc - 2, oc - 2);
    }));
  }, [outVals.flat().join(",")]);

  const handleClick = (e) => {
    const cv = e.currentTarget; const rect = cv.getBoundingClientRect();
    const scale = SZ / rect.width;
    const c = Math.floor((e.clientX - rect.left) * scale), r = Math.floor((e.clientY - rect.top) * scale);
    if (r >= 0 && r < SZ && c >= 0 && c < SZ) setGrid(g => g.map((row, ri) => row.map((v, ci) => ri === r && ci === c ? (v > 0.5 ? 0 : 1) : v)));
  };

  return (
    <InteractiveWrap label="CONVOLUTION — CLICK PIXELS, WATCH FEATURE MAP" color={color}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div><div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4 }}>INPUT (click)</div><canvas ref={inCvRef} onClick={handleClick} width={160} height={160} style={{ cursor: "pointer", borderRadius: 6, border: "1px solid #222", display: "block" }} /></div>
        <div><div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4 }}>KERNEL</div><canvas ref={kCvRef} width={90} height={90} style={{ borderRadius: 6, border: "1px solid #222", display: "block" }} /></div>
        <div><div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", marginBottom: 4 }}>OUTPUT</div><canvas ref={outCvRef} width={160} height={160} style={{ borderRadius: 6, border: "1px solid #222", display: "block" }} /></div>
      </div>
      <BtnRow options={Object.keys(KERNELS)} active={curK} onSelect={setCurK} color={color} />
      <OutputGrid cards={[{ label: "Output size", value: `${outsz}×${outsz}`, color }, { label: "Kernel params", value: 9, color: "#aaa" }]} />
    </InteractiveWrap>
  );
}

// 11. Attention
const ATT_TOKENS = ["The", "cat", "sat", "on", "mat", "it", "was", "tired"];
const ATT_PATTERNS = [
  [0.3,0.2,0.1,0.1,0.1,0.1,0.05,0.05],[0.05,0.4,0.1,0.05,0.1,0.2,0.05,0.05],
  [0.05,0.15,0.35,0.15,0.1,0.1,0.05,0.05],[0.05,0.05,0.1,0.35,0.25,0.1,0.05,0.05],
  [0.05,0.15,0.1,0.1,0.35,0.15,0.05,0.05],[0.05,0.45,0.05,0.05,0.2,0.1,0.05,0.05],
  [0.05,0.05,0.05,0.05,0.05,0.1,0.4,0.25],[0.05,0.25,0.05,0.05,0.1,0.15,0.1,0.25]
];
function Attention({ color }) {
  const [sel, setSel] = useState(1);
  const [temp, setTemp] = useState(1);
  const softmax = (arr, t) => { const e = arr.map(v => Math.exp(v * t)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
  const weights = softmax(ATT_PATTERNS[sel].map(v => Math.log(v + 0.01)), temp);
  const maxIdx = weights.indexOf(Math.max(...weights));

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const n = ATT_TOKENS.length, tw = (W - 20) / n, barMaxH = H - 80;
    weights.forEach((w, i) => {
      const bh = w * barMaxH, x = 10 + i * tw + 4;
      ctx.fillStyle = `rgba(0,212,255,${0.1 + w * 0.9})`; ctx.fillRect(x, H - 50 - bh, tw - 8, bh);
      ctx.fillStyle = i === sel ? color : "#aaa";
      ctx.font = (i === sel ? "bold " : "") + "12px Georgia, serif"; ctx.textAlign = "center";
      ctx.fillText(ATT_TOKENS[i], x + (tw - 8) / 2, H - 32);
      ctx.font = "9px monospace"; ctx.fillStyle = w > 0.15 ? color : "#666";
      ctx.fillText(w.toFixed(2), x + (tw - 8) / 2, H - 18);
    });
    const sx = 10 + sel * tw + 4;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.rect(sx, 0, tw - 8, H - 50); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`Query: "${ATT_TOKENS[sel]}" → attends most to: "${ATT_TOKENS[maxIdx]}" (${Math.max(...weights).toFixed(2)})`, 10, 14);
    ctx.textAlign = "left";
    // click
  }, [sel, temp, color]);

  const handleClick = e => {
    const cv = e.currentTarget; const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / (cvRef.current?.width || 420));
    setSel(Math.min(ATT_TOKENS.length - 1, Math.max(0, Math.floor((x - 10) / ((420 - 20) / ATT_TOKENS.length)))));
  };

  return (
    <InteractiveWrap label="SELF-ATTENTION — CLICK A TOKEN TO QUERY IT" color={color}>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Sentence: "The cat sat on mat it was tired" — click any word</p>
      <canvas ref={cvRef} onClick={handleClick} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", cursor: "pointer" }} />
      <Slider label="Temperature (1/√dₖ)" min={0.1} max={5} val={temp} step={0.1} onChange={setTemp} color={color} />
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666", padding: 8, background: "#111", borderRadius: 8, marginTop: 8 }}>
        Weights sum to {weights.reduce((a, b) => a + b, 0).toFixed(3)} · Temperature {temp.toFixed(1)}: {temp < 0.5 ? "Very sharp" : temp > 2 ? "Very flat (uniform)" : "Balanced"}
      </div>
    </InteractiveWrap>
  );
}

// 12. Multi-head
function MultiHead({ color }) {
  const [dm, setDm] = useState(512);
  const [heads, setHeads] = useState(8);
  const [seqLen, setSeqLen] = useState(512);
  const [ffnMult, setFfnMult] = useState(4);
  const dk = Math.floor(dm / heads);
  const attnP = 4 * dm * dm;
  const ffnP = 2 * dm * dm * ffnMult;
  const attnFlops = seqLen * (4 * dm * dm + 2 * seqLen * dm);
  const fmt = n => n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const maxShow = Math.min(heads, 16), hw = (W - 20) / maxShow;
    for (let i = 0; i < maxShow; i++) {
      const x = 10 + i * hw + 2;
      ctx.fillStyle = `hsl(${180 + i * 25},65%,38%)`;
      ctx.fillRect(x, 20, hw - 4, H - 50);
      ctx.fillStyle = "#aaa"; ctx.font = "8px monospace"; ctx.textAlign = "center";
      ctx.fillText(`H${i + 1}`, x + (hw - 4) / 2, H - 28);
      ctx.fillText(`d_k=${dk}`, x + (hw - 4) / 2, H - 16);
    }
    if (heads > 16) { ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText(`+${heads - 16} more`, W / 2, H - 4); }
    ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`${heads} heads × d_k=${dk} = d_model=${dm}   |   Attention matrix: ${seqLen}×${seqLen}`, 10, 14);
  }, [dm, heads, seqLen, color]);

  return (
    <InteractiveWrap label="MULTI-HEAD ATTENTION — PARAMETER & COMPUTE BUDGET" color={color}>
      <Slider label="d_model" min={64} max={4096} val={dm} step={64} onChange={setDm} color={color} />
      <Slider label="Num heads H" min={1} max={32} val={heads} step={1} onChange={setHeads} color={color} />
      <Slider label="Sequence length n" min={32} max={4096} val={seqLen} step={32} onChange={setSeqLen} color={color} />
      <Slider label="FFN multiplier" min={1} max={8} val={ffnMult} step={1} onChange={setFfnMult} color={color} />
      <canvas ref={cvRef} width={420} height={130} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "d_k per head", value: dk, color },
        { label: "Attn params", value: fmt(attnP), color: "#aaa" },
        { label: "FFN params", value: fmt(ffnP), color: "#888" },
        { label: "FLOPs/token", value: fmt(attnFlops / seqLen), color: "#ffb347" }
      ]} />
    </InteractiveWrap>
  );
}

// 13. Scaling + LoRA
function Scaling({ color }) {
  const [logN, setLogN] = useState(9);
  const [logD, setLogD] = useState(11);
  const [baseM, setBaseM] = useState(7);
  const [rank, setRank] = useState(8);
  const N = Math.pow(10, logN), D = Math.pow(10, logD);
  const loss = Math.max(1, 3.1 - 0.076 * logN - 0.095 * logD + 5);
  const loraParams = 2 * rank * 4096 * (baseM / 7);
  const totalBase = baseM * 1e9;
  const fmt = n => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${Math.round(n)}`;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const sx = ln => (ln - 6) / (12 - 6) * (W - 40) + 20, sy = l => H - 20 - (l - 1) / 5 * (H - 40);
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let i = 0; i <= 100; i++) { const ln = 6 + i * 6 / 100, l = Math.max(1, 3.1 - 0.076 * ln - 0.095 * logD + 5); i === 0 ? ctx.moveTo(sx(ln), sy(l)) : ctx.lineTo(sx(ln), sy(l)); }
    ctx.stroke();
    const px = sx(logN), py = sy(Math.max(1, loss));
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    // LoRA
    const lx = W * 0.65, lw = W * 0.3, lh = (H - 30) / 3;
    ctx.fillStyle = "rgba(255,180,70,0.1)"; ctx.fillRect(lx, 10, lw, lh);
    ctx.strokeStyle = "rgba(255,180,70,0.4)"; ctx.lineWidth = 1; ctx.strokeRect(lx, 10, lw, lh);
    ctx.fillStyle = "rgba(0,212,255,0.25)"; ctx.fillRect(lx, 10 + lh * 0.1, lw * 0.15, lh * 0.8);
    ctx.fillRect(lx + lw * 0.85, 10 + lh * 0.1, lw * 0.15, lh * 0.8);
    ctx.fillStyle = "#777"; ctx.font = "8px monospace"; ctx.textAlign = "center";
    ctx.fillText(`W frozen (${fmt(totalBase)})`, lx + lw / 2, 10 + lh / 2 + 3);
    ctx.fillStyle = "#00d4ff"; ctx.fillText("A", lx + lw * 0.075, 10 + lh / 2 + 3); ctx.fillText("B", lx + lw * 0.925, 10 + lh / 2 + 3);
    ctx.fillStyle = "#555"; ctx.fillText("LoRA adapters", lx + lw / 2, 10 + lh + 14);
    ctx.fillStyle = "#555"; ctx.textAlign = "left"; ctx.fillText("Loss ↑", 8, 16); ctx.fillText("← more params", W / 2, H - 6);
  }, [logN, logD, baseM, rank, color]);

  return (
    <InteractiveWrap label="SCALING LAWS & LoRA FINE-TUNING" color={color}>
      <Slider label="log₁₀(N) params" min={6} max={12} val={logN} step={0.1} onChange={setLogN} color={color} />
      <Slider label="log₁₀(D) tokens" min={8} max={13} val={logD} step={0.1} onChange={setLogD} color={color} />
      <Slider label="Base model (B params)" min={1} max={70} val={baseM} step={1} onChange={setBaseM} color={color} />
      <Slider label="LoRA rank r" min={1} max={64} val={rank} step={1} onChange={setRank} color={color} />
      <canvas ref={cvRef} width={420} height={150} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Predicted Loss", value: loss.toFixed(2), color },
        { label: "N parameters", value: fmt(N), color: "#aaa" },
        { label: "LoRA trainable", value: fmt(loraParams), color: "#ffb347" },
        { label: "Param %", value: `${(loraParams / totalBase * 100).toFixed(2)}%`, color: "#888" }
      ]} />
    </InteractiveWrap>
  );
}

// 14. Tokenization
function Tokenization({ color }) {
  const [imgSize, setImgSize] = useState(224);
  const [patch, setPatch] = useState(16);
  const [txtTok, setTxtTok] = useState(256);
  const [embDim, setEmbDim] = useState(768);
  const imgTok = Math.floor(imgSize / patch) ** 2;
  const total = imgTok + txtTok;
  const kvMem = (total * embDim * 2 * 2 / 1e6).toFixed(1);
  const fmt = n => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const maxShow = Math.min(total, 42), showImg = Math.min(imgTok, Math.floor(maxShow * imgTok / total));
    const showTxt = maxShow - showImg, tokW = (W - 20) / maxShow, tokH = 22;
    for (let i = 0; i < showImg; i++) { ctx.fillStyle = `rgba(255,180,70,0.75)`; ctx.fillRect(10 + i * tokW + 1, H / 2 - tokH / 2, tokW - 2, tokH); }
    for (let i = 0; i < showTxt; i++) { ctx.fillStyle = "rgba(100,150,255,0.75)"; ctx.fillRect(10 + (showImg + i) * tokW + 1, H / 2 - tokH / 2, tokW - 2, tokH); }
    ctx.fillStyle = "#aaa"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    if (showImg > 2) ctx.fillText(`Image (${imgTok})`, 10 + showImg * tokW / 2, H / 2 - tokH / 2 - 8);
    if (showTxt > 2) ctx.fillStyle = "#7090ff", ctx.fillText(`Text (${txtTok})`, 10 + (showImg + showTxt / 2) * tokW, H / 2 + tokH / 2 + 14);
    if (total > maxShow) { ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.fillText(`showing ${maxShow}/${total} tokens`, W / 2, H - 6); }
    ctx.fillStyle = "#333"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`All ${total} tokens → same Transformer, same attention`, 10, 16);
  }, [imgSize, patch, txtTok, color]);

  return (
    <InteractiveWrap label="MULTIMODAL TOKENIZATION — SHARED EMBEDDING SPACE" color={color}>
      <Slider label="Image size H×W" min={32} max={512} val={imgSize} step={8} onChange={setImgSize} color={color} />
      <Slider label="Patch size p×p" min={8} max={64} val={patch} step={4} onChange={setPatch} color={color} />
      <Slider label="Text tokens" min={16} max={4096} val={txtTok} step={16} onChange={setTxtTok} color={color} />
      <Slider label="Embedding dim d" min={64} max={4096} val={embDim} step={64} onChange={setEmbDim} color={color} />
      <canvas ref={cvRef} width={420} height={130} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Image tokens", value: imgTok, color },
        { label: "Total sequence", value: total, color: "#aaa" },
        { label: "Attention ops (n²)", value: fmt(total * total), color: "#888" },
        { label: "KV cache fp16", value: `${kvMem}MB`, color: "#ffb347" }
      ]} />
    </InteractiveWrap>
  );
}

// 15. CLIP
function CLIP({ color }) {
  const [tau, setTau] = useState(0.07);
  const [batchN, setBatchN] = useState(4);
  const sims = useRef([]);
  useEffect(() => {
    sims.current = Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => i === j ? 0.85 + Math.random() * 0.1 : 0.1 + Math.random() * 0.3));
  }, [batchN]);
  const N = Math.min(batchN, 10);
  const sm = (row, t) => { const e = row.map(v => Math.exp(v / t)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
  let loss = 0, correct = 0;
  const s2 = sims.current.slice(0, N).map(r => r.slice(0, N));
  s2.forEach((row, i) => { const sw = sm(row, tau); loss -= Math.log(sw[i] + 1e-9); if (sw.indexOf(Math.max(...sw)) === i) correct++; });
  loss /= N || 1;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const cell = Math.min(Math.floor((W - 100) / N), Math.floor((H - 60) / N));
    const ox = (W - N * cell) / 2, oy = 30;
    s2.forEach((row, i) => row.forEach((v, j) => {
      const isM = i === j;
      ctx.fillStyle = isM ? `rgba(255,180,70,${v})` : `rgba(255,100,100,${v * 0.5})`;
      ctx.fillRect(ox + j * cell + 1, oy + i * cell + 1, cell - 2, cell - 2);
      ctx.fillStyle = "#ccc"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(v.toFixed(1), ox + j * cell + cell / 2, oy + i * cell + cell / 2 + 3);
    }));
    ctx.fillStyle = "#555"; ctx.font = "9px monospace"; ctx.textAlign = "center";
    ctx.fillText("text captions →", ox + N * cell / 2, oy + N * cell + 16);
    ctx.save(); ctx.translate(ox - 12, oy + N * cell / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("images ↓", 0, 0); ctx.restore();
    ctx.fillStyle = "#888"; ctx.fillText(`τ=${tau.toFixed(2)}: ${tau < 0.1 ? "Sharp (good)" : tau > 0.5 ? "Flat (bad)" : "Balanced"}`, W / 2, 16);
    ctx.textAlign = "left";
  }, [tau, N, s2.flat().join(","), color]);

  return (
    <InteractiveWrap label="CLIP — CONTRASTIVE LOSS & TEMPERATURE" color={color}>
      <Slider label="Temperature τ" min={0.01} max={1.0} val={tau} step={0.01} onChange={setTau} color={color} />
      <Slider label="Batch size N" min={2} max={8} val={batchN} step={1} onChange={setBatchN} color={color} />
      <canvas ref={cvRef} width={420} height={200} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "CLIP Loss", value: loss.toFixed(3), color },
        { label: "Retrieval Acc", value: `${correct}/${N}`, color: "#aaa" }
      ]} />
    </InteractiveWrap>
  );
}

// 16. Diffusion
function Diffusion({ color }) {
  const [t, setT] = useState(0);
  const [bmax, setBmax] = useState(0.02);
  const [sch, setSch] = useState("linear");
  const T = 1000;
  const getAlpha = (tt) => {
    if (sch === "linear") { let a = 1; for (let i = 0; i < tt; i++) a *= (1 - (0.0001 + (bmax - 0.0001) * i / T)); return Math.max(0, a); }
    const f = s => Math.cos((s / T + 0.008) / 1.008 * Math.PI / 2) ** 2;
    return Math.max(0, f(tt) / f(0));
  };
  const abar = getAlpha(t), noise = 1 - abar;
  const snr = abar > 0.001 ? (10 * Math.log10(abar / (noise + 1e-9))).toFixed(1) : "-40.0";

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const sx = tt => (tt / T) * (W - 40) + 20, sy = v => H - 30 - v * (H - 50);
    ["linear", "cosine"].forEach((s, si) => {
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = s === "linear" ? color : "#ff7043";
      ctx.setLineDash(si === 1 && sch !== "cosine" ? [4, 4] : []);
      for (let i = 0; i <= 100; i++) {
        const tt = i * T / 100;
        let a; if (s === "linear") { a = 1; for (let k = 0; k < tt; k++) a *= (1 - (0.0001 + (bmax - 0.0001) * k / T)); a = Math.max(0, a); }
        else { const f = x => Math.cos((x / T + 0.008) / 1.008 * Math.PI / 2) ** 2; a = Math.max(0, f(tt) / f(0)); }
        i === 0 ? ctx.moveTo(sx(tt), sy(a)) : ctx.lineTo(sx(tt), sy(a));
      }
      ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(sx(t), 10); ctx.lineTo(sx(t), H - 30); ctx.stroke(); ctx.setLineDash([]);
    const ca = getAlpha(t);
    ctx.beginPath(); ctx.arc(sx(t), sy(ca), 7, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    const imgX = W - 80, imgY = 10, imgS = 60;
    for (let px = 0; px < imgS; px += 4) for (let py = 0; py < imgS; py += 4) {
      const signal = (px < imgS / 2 && py < imgS / 2) ? 1 : 0.3;
      const v = ca * signal + noise * Math.random();
      ctx.fillStyle = `rgba(255,180,70,${Math.min(1, v)})`; ctx.fillRect(imgX + px, imgY + py, 4, 4);
    }
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.strokeRect(imgX, imgY, imgS, imgS);
    ctx.fillStyle = "#555"; ctx.font = "8px monospace"; ctx.textAlign = "center";
    ctx.fillText(`x_${t}`, imgX + imgS / 2, imgY + imgS + 12);
    ctx.fillStyle = "#555"; ctx.textAlign = "left"; ctx.fillText("α̅ₜ →", 8, H - 14);
    ctx.fillText("t=0 clean", 18, 14); ctx.fillText(`t=${T} noise`, W - 70, 14);
  }, [t, bmax, sch, color]);

  return (
    <InteractiveWrap label="DIFFUSION — FORWARD NOISE PROCESS" color={color}>
      <Slider label={`Timestep t (0→${T})`} min={0} max={T} val={t} step={1} onChange={setT} color={color} />
      <Slider label="β_max" min={0.01} max={0.03} val={bmax} step={0.001} onChange={setBmax} color={color} />
      <BtnRow options={["linear", "cosine"]} active={sch} onSelect={setSch} color={color} />
      <canvas ref={cvRef} width={420} height={180} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Signal α̅ₜ", value: abar.toFixed(3), color },
        { label: "Noise (1-α̅ₜ)", value: noise.toFixed(3), color: "#ff6b6b" },
        { label: "SNR (dB)", value: `${snr}dB`, color: "#aaa" }
      ]} />
    </InteractiveWrap>
  );
}

// 17. Fine-tuning
function FineTuning({ color }) {
  const [sz, setSz] = useState(7);
  const [rank, setRank] = useState(16);
  const [vram, setVram] = useState(24);
  const fullV = sz * 7, loraV = sz * 2 + sz * rank / 1000 * 3, qloraV = sz * 0.5 + sz * rank / 1000 * 3;
  const feasible = qloraV < vram ? "QLoRA ✓" : loraV < vram ? "LoRA ✓" : fullV < vram ? "Full FT ✓" : "Need bigger GPU";
  const feasColor = qloraV < vram ? color : loraV < vram ? "#ffb347" : fullV < vram ? "#ff9a9a" : "#ff4444";

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const methods = [["Full FT", fullV, "#ff6b6b"], ["LoRA", loraV, "#ffb347"], ["QLoRA", qloraV, color]];
    const maxV = Math.max(fullV, vram);
    const bw = (W - 60) / 3;
    methods.forEach(([name, v, c], i) => {
      const bh = Math.min(H - 50, (v / maxV) * (H - 50)), x = 20 + i * (bw + 15);
      ctx.fillStyle = `${c}22`; ctx.fillRect(x, H - 30 - bh, bw, bh);
      ctx.strokeStyle = v <= vram ? c : "#ff4444"; ctx.lineWidth = v <= vram ? 2 : 1; ctx.strokeRect(x, H - 30 - bh, bw, bh);
      ctx.fillStyle = c; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(name, x + bw / 2, H - 14);
      ctx.fillStyle = v <= vram ? c : "#ff4444"; ctx.fillText(`${v.toFixed(0)}GB`, x + bw / 2, H - 30 - bh - 6);
    });
    const ly = H - 30 - (vram / maxV) * (H - 50);
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(10, ly); ctx.lineTo(W - 10, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#666"; ctx.font = "9px monospace"; ctx.textAlign = "right";
    ctx.fillText(`Available: ${vram}GB`, W - 14, ly - 4); ctx.textAlign = "left";
  }, [sz, rank, vram, color]);

  return (
    <InteractiveWrap label="FINE-TUNING STRATEGY — VRAM COMPARATOR" color={color}>
      <Slider label="Base model (B params)" min={1} max={70} val={sz} step={1} onChange={setSz} color={color} />
      <Slider label="LoRA rank r" min={1} max={64} val={rank} step={1} onChange={setRank} color={color} />
      <Slider label="GPU VRAM (GB)" min={8} max={80} val={vram} step={2} onChange={setVram} color={color} />
      <canvas ref={cvRef} width={420} height={150} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Full FT VRAM", value: `${fullV.toFixed(0)}GB`, color: "#ff6b6b" },
        { label: "LoRA VRAM", value: `${loraV.toFixed(0)}GB`, color: "#ffb347" },
        { label: "QLoRA VRAM", value: `${qloraV.toFixed(0)}GB`, color },
        { label: "Best fit", value: feasible, color: feasColor }
      ]} />
    </InteractiveWrap>
  );
}

// 18. RNN vs Transformer
function RNNvsTransformer({ color }) {
  const [seqLen, setSeqLen] = useState(12);
  const [mode, setMode] = useState("RNN");

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const spacing = (W - 40) / seqLen, cy = H / 2;
    const nx = i => 20 + i * spacing + spacing / 2;
    if (mode === "RNN" || mode === "LSTM") {
      for (let i = 0; i < seqLen - 1; i++) {
        const fade = Math.max(0.05, 1 - i * (0.9 / (seqLen - 1)));
        ctx.strokeStyle = `rgba(0,212,255,${fade})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(nx(i) + 12, cy); ctx.lineTo(nx(i + 1) - 12, cy); ctx.stroke();
        ctx.fillStyle = `rgba(0,212,255,${fade})`;
        ctx.beginPath(); ctx.moveTo(nx(i + 1) - 12, cy); ctx.lineTo(nx(i + 1) - 18, cy - 5); ctx.lineTo(nx(i + 1) - 18, cy + 5); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,100,100,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(nx(0), cy - 20); ctx.quadraticCurveTo(W / 2, 20, nx(seqLen - 1), cy - 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,100,100,0.6)"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(`${seqLen - 1} serial steps to reach last token`, W / 2, 14);
    } else {
      for (let i = 0; i < seqLen; i++) for (let j = 0; j < seqLen; j++) {
        if (i === j) continue;
        ctx.strokeStyle = `rgba(0,212,255,${Math.random() * 0.25 + 0.05})`; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(nx(i), cy); ctx.lineTo(nx(j), cy); ctx.stroke();
      }
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(nx(0), cy - 12); ctx.quadraticCurveTo(W / 2, 25, nx(seqLen - 1), cy - 12); ctx.stroke();
      ctx.fillStyle = "#aaa"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText("Direct O(1) path — any token to any other token", W / 2, 14);
    }
    for (let i = 0; i < seqLen; i++) {
      ctx.beginPath(); ctx.arc(nx(i), cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#88aaff" : i === seqLen - 1 ? "#ff7043" : color;
      ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff"; ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillText(i + 1, nx(i), cy + 3);
    }
    ctx.textAlign = "left";
  }, [seqLen, mode, color]);

  return (
    <InteractiveWrap label="RNN vs TRANSFORMER — INFORMATION FLOW" color={color}>
      <Slider label="Sequence length" min={4} max={32} val={seqLen} step={1} onChange={setSeqLen} color={color} />
      <BtnRow options={["RNN", "LSTM", "Transformer"]} active={mode} onSelect={setMode} color={color} />
      <canvas ref={cvRef} width={420} height={180} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Steps: first→last", value: mode === "Transformer" ? "1 direct" : `${seqLen - 1} serial`, color },
        { label: "Parallelizable", value: mode === "Transformer" ? "Yes ✓" : "No", color: "#aaa" },
        { label: "Memory", value: mode === "Transformer" ? `O(n²)` : mode === "LSTM" ? "O(4n)" : "O(n)", color: "#888" }
      ]} />
    </InteractiveWrap>
  );
}

// CNN Architecture
function CNNArch({ color }) {
  const [imgSize, setImgSize] = useState(64);
  const [blocks, setBlocks] = useState(3);
  const [initF, setInitF] = useState(32);
  const [fcSize, setFcSize] = useState(256);
  const [skipConn, setSkipConn] = useState(false);
  const [batchNorm, setBatchNorm] = useState(false);

  let params = 0, curSz = imgSize, curF = 3, depth = 0;
  const stages = [];
  for (let i = 0; i < blocks; i++) {
    const fi = initF * (2 ** i);
    params += 3 * 3 * curF * fi + fi; if (batchNorm) params += 2 * fi;
    params += 3 * 3 * fi * fi + fi; if (batchNorm) params += 2 * fi;
    const outSz = Math.floor(curSz / 2);
    stages.push({ inSz: curSz, outSz, inF: curF, outF: fi });
    depth += 2 + (batchNorm ? 2 : 0); curSz = outSz; curF = fi;
  }
  params += curSz * curSz * curF * fcSize + fcSize + fcSize * 10 + 10; depth += 2;
  const fmt = n => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`;

  const cvRef = useCanvas((ctx, W, H) => {
    ctx.fillStyle = "#0d0f13"; ctx.fillRect(0, 0, W, H);
    const stageW = (W - 80) / (stages.length + 2);
    const drawBox = (x, h, w, c, label) => {
      ctx.fillStyle = c; ctx.fillRect(x, H / 2 - h / 2, w, h);
      ctx.fillStyle = "#aaa"; ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillText(label, x + w / 2, H / 2 + h / 2 + 12);
    };
    const inputH = Math.min(110, (imgSize / 224) * 110);
    drawBox(10, inputH, 18, "rgba(100,120,255,0.6)", `${imgSize}²`);
    let x = 36;
    stages.forEach((s, i) => {
      const bh = Math.min(100, (s.inSz / 224) * 100);
      drawBox(x, bh, stageW - 4, `${color}55`, `${s.outF}f`);
      if (skipConn && i > 0) { ctx.strokeStyle = "rgba(255,180,70,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x - stageW, H / 2); ctx.lineTo(x + stageW / 2, H / 2); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = "rgba(255,100,100,0.4)"; const ph = bh / 2; ctx.fillRect(x + stageW - 4, H / 2 - ph / 2, 7, ph);
      x += stageW;
    });
    drawBox(x + 4, 45, 18, "rgba(255,180,70,0.5)", "FC");
    drawBox(x + 28, 28, 14, "rgba(255,100,100,0.5)", "out");
    ctx.textAlign = "left";
  }, [imgSize, blocks, initF, fcSize, skipConn, batchNorm, color]);

  return (
    <InteractiveWrap label="CNN ARCHITECTURE BUILDER" color={color}>
      <Slider label="Input image size" min={28} max={224} val={imgSize} step={4} onChange={setImgSize} color={color} />
      <Slider label="Conv blocks" min={1} max={6} val={blocks} step={1} onChange={setBlocks} color={color} />
      <Slider label="Initial filters" min={8} max={64} val={initF} step={8} onChange={setInitF} color={color} />
      <Slider label="FC hidden size" min={64} max={1024} val={fcSize} step={64} onChange={setFcSize} color={color} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[["Skip Connections", skipConn, setSkipConn], ["Batch Norm", batchNorm, setBatchNorm]].map(([lbl, val, set]) => (
          <button key={lbl} onClick={() => set(v => !v)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${color}`, background: val ? color : "transparent", color: val ? "#000" : color, fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>
            {lbl}{val ? " ✓" : ""}
          </button>
        ))}
      </div>
      <canvas ref={cvRef} width={420} height={140} style={{ width: "100%", maxWidth: 420, borderRadius: 8, display: "block", margin: "8px 0" }} />
      <OutputGrid cards={[
        { label: "Total Params", value: fmt(params), color },
        { label: "Final feat map", value: `${stages[stages.length - 1]?.outSz || "?"}×${stages[stages.length - 1]?.outSz || "?"}×${stages[stages.length - 1]?.outF || 3}`, color: "#aaa" },
        { label: "Depth", value: depth, color: "#888" }
      ]} />
    </InteractiveWrap>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: "ml", icon: "◈", color: "#4fffb0", title: "Machine Learning", sub: "Teaching machines from data",
    sections: [
      { title: "What is Learning?", concept: `A machine "learns" when it adjusts internal parameters to minimize the gap between what it predicts and what actually happened.\n\nThe core task: given input x, predict output y by finding a function f_θ(x) ≈ y, where θ (theta) are the learnable parameters.\n\nReal world: Netflix predicts your rating before you watch. Gmail predicts spam. Both are functions mapping inputs → outputs, found by minimizing error on millions of examples.`, math: String.raw`\text{Goal: find } \theta \text{ such that } f_\theta(\mathbf{x}) \approx y`, math2: String.raw`\text{Loss} = \mathcal{L}(\theta) = \frac{1}{n}\sum_{i=1}^n \ell(f_\theta(x_i),\, y_i)`, intuition: "Learning = optimization. You have a knob (θ) you can turn. The loss function tells you how wrong you are. Learning = finding the knob setting that makes you least wrong.", Lab: LossSurface },
      { title: "Linear Regression", concept: `The simplest model: predict a continuous value as a weighted sum of inputs.\n\n  ŷ = w·x + b\n  w = weight (slope)\n  b = bias (intercept)\n\nLoss = MSE:  (1/n) Σ(yᵢ - ŷᵢ)²\n\nReal world: Predict house price from sq. footage. Drag sliders to fit manually, then run gradient descent automatically.`, math: String.raw`\hat{y} = w \cdot x + b`, math2: String.raw`\mathcal{L}(w,b) = \frac{1}{n}\sum_{i=1}^{n}(y_i - (wx_i + b))^2`, intuition: "The loss landscape for linear regression is a perfect bowl (convex). Gradient descent always finds the global minimum — no risk of getting stuck in a local minimum.", Lab: LinearRegression },
      { title: "Gradient Descent", concept: `How does the model find good weights? By walking downhill on the loss surface.\n\n  θ ← θ − α · ∂L/∂θ\n\n  α = learning rate (step size)\n  ∂L/∂θ = gradient (direction of steepest ascent, go opposite)\n\nVariants: SGD (1 sample), Mini-batch (32-512 samples), Adam (adaptive per-param learning rates).\n\nReal world: GPT-4 trained with AdamW. Same math, incomprehensible scale.`, math: String.raw`\theta_{t+1} = \theta_t - \alpha \cdot \nabla_\theta \mathcal{L}(\theta_t)`, math2: String.raw`\text{Adam: } m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t,\quad \theta \leftarrow \theta - \frac{\alpha \hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon}`, intuition: "Too large α: overshoot the minimum and diverge. Too small: converge too slowly. Learning rate schedules (warmup + cosine decay) are standard in LLM training.", Lab: GradientDescent },
      { title: "Classification & Logistic Regression", concept: `Predict a category instead of a number. Squash linear output to [0,1] via sigmoid, interpret as probability.\n\n  P(y=1|x) = σ(wx+b) = 1/(1+e^{-z})\n\nLoss = Binary Cross-Entropy:\n  L = -[y·log(ŷ) + (1-y)·log(1-ŷ)]\n\nReal world: Credit card fraud. Adjust threshold to trade false positives vs false negatives.`, math: String.raw`\hat{y} = \sigma(wx+b) = \frac{1}{1+e^{-(wx+b)}}`, math2: String.raw`\mathcal{L} = -\frac{1}{n}\sum_i \bigl[y_i \log \hat{y}_i + (1-y_i)\log(1-\hat{y}_i)\bigr]`, intuition: "Sigmoid maps ℝ → (0,1). Input +4 → prob 0.98. Input -4 → 0.02. Input 0 → 0.5 (max uncertainty). The decision boundary is the hyperplane where z = 0.", Lab: Logistic }
    ]
  },
  { id: "nn", icon: "⬡", color: "#ff7043", title: "Neural Networks", sub: "Stacking layers for abstraction",
    sections: [
      { title: "The Artificial Neuron", concept: `A single compute unit: weighted sum of inputs + bias → activation function.\n\n  z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b\n  a = f(z)\n\nActivations:\n  ReLU: max(0,z) — fast, prevents vanishing gradients\n  Sigmoid: 1/(1+e⁻ᶻ) — squashes to (0,1)\n  Tanh: (eᶻ-e⁻ᶻ)/(eᶻ+e⁻ᶻ) — squashes to (-1,1)\n  GELU: z·Φ(z) — smooth, used in GPT/BERT\n\nReal world: Each neuron detects something — a curve, a phoneme, a keyword.`, math: String.raw`a = f\!\left(\mathbf{w}^\top \mathbf{x} + b\right) = f\!\left(\sum_{i=1}^{n} w_i x_i + b\right)`, math2: String.raw`\text{ReLU}(z) = \max(0,z) \qquad \text{GELU}(z) = z\cdot\Phi(z)`, intuition: "ReLU doesn't saturate for large positive inputs — gradient stays 1, not ~0. This prevents vanishing gradients in deep networks. The cost: 'dead neurons' where z < 0 always (gradient=0).", Lab: Neuron },
      { title: "Multi-Layer Perceptron (MLP)", concept: `Stack neurons in layers. Each layer learns increasingly abstract features.\n\n  h⁽ˡ⁾ = f(W⁽ˡ⁾ h⁽ˡ⁻¹⁾ + b⁽ˡ⁾)\n\nWhy depth works:\n  Layer 1: raw features (edges, bigrams)\n  Layer 2: local patterns (shapes, phrases)\n  Layer N: semantic concepts (faces, sentiment)\n\nUniversal Approximation Theorem: A 1-hidden-layer MLP with enough neurons can approximate any continuous function.\n\nReal world: Click-through rate at Google. Input: user×ad features. Output: P(click).`, math: String.raw`\mathbf{h}^{(l)} = f\!\left(W^{(l)} \mathbf{h}^{(l-1)} + \mathbf{b}^{(l)}\right), \quad l = 1,\ldots,L`, math2: String.raw`\text{params} = \sum_{l=1}^{L} \bigl(d_{l} \cdot d_{l-1} + d_{l}\bigr)`, intuition: "More layers = more abstraction. But too deep = vanishing gradients + overfitting. Dropout, BatchNorm, and residual connections are the tools that made very deep networks trainable.", Lab: MLP },
      { title: "Backpropagation", concept: `Train all weights by computing how each contributes to loss. Backprop applies the chain rule layer by layer.\n\n  Forward: compute ŷ → compute L\n  Backward: propagate ∂L/∂W backwards via chain rule\n\n  dz/dx = (dz/dg)·(dg/dx)\n\nReal world: PyTorch builds a computational graph during forward pass. .backward() traverses it in reverse. You never write backprop manually.`, math: String.raw`\frac{\partial \mathcal{L}}{\partial W^{(l)}} = \delta^{(l)} \bigl(\mathbf{h}^{(l-1)}\bigr)^\top, \quad \delta^{(l)} = \bigl(W^{(l+1)}\bigr)^\top \delta^{(l+1)} \odot f'(z^{(l)})`, math2: String.raw`W^{(l)} \leftarrow W^{(l)} - \alpha \frac{\partial \mathcal{L}}{\partial W^{(l)}}`, intuition: "The vanishing gradient problem: sigmoid/tanh gradients squash to near-zero for large inputs. After 10 layers, the gradient multiplied by ~0 ten times → effectively zero. ReLU and residual connections solve this.", Lab: Backprop },
      { title: "Overfitting & Regularization", concept: `A model that memorizes training data but fails on new data is overfit.\n\nRegularization techniques:\n  L2 (Weight Decay): add λ‖w‖² to loss → penalizes large weights\n  L1: add λ‖w‖₁ → sparse weights\n  Dropout: randomly zero p fraction of neurons during training\n  Early Stopping: halt when validation loss stops improving\n  BatchNorm: normalize activations per batch\n\nKey hyperparameters: α, batch size, hidden dims, layers, dropout, λ, optimizer.`, math: String.raw`\mathcal{L}_{\text{reg}} = \mathcal{L} + \lambda \sum_{l} \|W^{(l)}\|_F^2`, math2: String.raw`\text{Dropout: } \tilde{h}_i = \frac{h_i \cdot \text{Bernoulli}(1-p)}{1-p}`, intuition: "Dropout forces the network to learn redundant representations — it can't rely on any single neuron. At test time all neurons are active, equivalent to averaging an ensemble of thinned networks.", Lab: Regularization }
    ]
  },
  { id: "cnn", icon: "▦", color: "#7c83fd", title: "CNNs", sub: "Exploiting spatial structure",
    sections: [
      { title: "Why Not MLPs for Images?", concept: `224×224 RGB image = 150,528 inputs. One FC layer to 1000 units = 150M parameters. Problems:\n  1. Quadratic compute in image size\n  2. Overfitting: too many params, too few constraints\n  3. No spatial structure: distant pixels treated same as adjacent\n\nKey insight: Images have LOCAL structure. An edge detector works the same wherever in the image the edge appears.\n\nSolution: Share parameters spatially via a convolutional filter.`, math: String.raw`224 \times 224 \times 3 = 150{,}528 \;\xrightarrow{\;\text{vs}\;}\; 3{\times}3 \text{ conv filter} = 27 \text{ params (reused everywhere)}`, math2: String.raw`\text{Spatial translation equivariance: } f(T_\delta x) = T_\delta f(x)`, intuition: "Parameter sharing is the core innovation. The filter detecting a vertical edge in the top-left is identical to the one in the bottom-right. This is translation equivariance.", Lab: ParamSharing },
      { title: "The Convolution Operation", concept: `A filter (kernel) slides across the input, computing a dot product at each position.\n\n  output[i,j] = Σₘ Σₙ input[i+m, j+n] · kernel[m,n]\n\nKey parameters:\n  kernel_size: filter dims (3×3, 5×5)\n  stride: step size when sliding\n  padding: zeros around input to control output size\n  num_filters: output channels\n\nOutput size: ⌊(W - K + 2P) / S⌋ + 1\n\nReal world: First layers of ResNet learn edge detectors. Middle: curves, textures. Late: dog faces, car wheels.`, math: String.raw`(I * K)[i,j] = \sum_{m=0}^{k-1}\sum_{n=0}^{k-1} I[i{\cdot}s{+}m,\;j{\cdot}s{+}n] \cdot K[m,n]`, math2: String.raw`\text{output size} = \left\lfloor\frac{W - K + 2P}{S}\right\rfloor + 1`, intuition: "Each filter specializes. Filter 1: horizontal edges. Filter 2: vertical edges. Filter 3: color transitions. With 64 filters, you get 64 feature maps stacked as channels.", Lab: Convolution },
      { title: "Pooling & Full Architecture", concept: `Pooling reduces spatial resolution while retaining important activations.\n\n  Max pooling: take max in each k×k window\n  Average pooling: take mean\n  Global Average Pooling: collapse entire spatial dim\n\nFull CNN:\n  Input → [Conv → BN → ReLU → Pool]×N → GAP → FC → Softmax\n\nResNet skip connection: y = F(x) + x\n  Even if F(x)≈0, gradients flow through +x. Enables 152-layer networks.\n\nLandmarks: LeNet (1998), AlexNet (2012), VGG (2014), ResNet (2015), EfficientNet (2019).`, math: String.raw`\text{MaxPool: } y_{i,j} = \max_{(m,n) \in \mathcal{R}_{i,j}} X_{m,n}`, math2: String.raw`\mathbf{y} = \mathcal{F}(\mathbf{x}, \{W_i\}) + \mathbf{x} \quad \text{(ResNet skip connection)}`, intuition: "Skip connections reframe learning: instead of mapping H(x), learn residual F(x) = H(x)-x. If identity is already good, F(x)≈0 is easy. This is why ResNets can be 152 layers deep.", Lab: CNNArch }
    ]
  },
  { id: "transformer", icon: "◎", color: "#00d4ff", title: "Transformers", sub: "Attention is all you need",
    sections: [
      { title: "Problems with RNNs", concept: `Before 2017, sequences used Recurrent Neural Networks.\n\n  RNN: hₜ = f(Whₜ₋₁ + Wxₜ)  — hidden state carries memory\n\nProblems:\n  1. Sequential: can't parallelize. Step t needs step t-1.\n  2. Vanishing gradients: 1000 Jacobians multiplied → ~0\n  3. Fixed-size bottleneck: entire sequence compressed into one hₜ\n  4. Long-range: "The trophy didn't fit in the bag because it was too big" — what does 'it' refer to?\n\n2017 insight: replace recurrence with attention — directly connects any two positions.`, math: String.raw`h_t = \tanh(W_h h_{t-1} + W_x x_t + b) \quad \text{(sequential, limited range)}`, math2: String.raw`\text{Attention: connect position } i \text{ to } j \text{ in } O(1) \text{ steps regardless of distance}`, intuition: "Even LSTMs struggle at 500+ tokens. Transformers have no 'distance' problem: every token directly attends to every other via the attention matrix. The cost: O(n²) memory.", Lab: RNNvsTransformer },
      { title: "Self-Attention Mechanism", concept: `For each token, attention asks: "Which other tokens are most relevant to understanding me?"\n\nStep 1: Project each token x into Q, K, V vectors\n  Q = xWQ  ("What am I looking for?")\n  K = xWK  ("What do I offer?")\n  V = xWV  ("What will I pass on?")\n\nStep 2: Scores = QKᵀ / √dₖ  [scaling prevents softmax saturation]\n\nStep 3: Softmax → attention weights\n\nStep 4: Output = weighted sum of Values\n\nReal world: "The cat sat on the mat because it was comfortable" — 'it' attends strongly to 'mat'.`, math: String.raw`\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)\!V`, math2: String.raw`Q = XW^Q,\quad K = XW^K,\quad V = XW^V \quad W^Q,W^K,W^V \in \mathbb{R}^{d \times d_k}`, intuition: "QKᵀ is a dot product similarity matrix. High dot product = these tokens should attend to each other. Dividing by √dₖ prevents large dot products that push softmax into saturated near-zero gradient regions.", Lab: Attention },
      { title: "Multi-Head Attention & FFN", concept: `Run attention H times in parallel with different learned projections.\n\nWhy? Each head can specialize:\n  Head 1: syntax (subject-verb agreement)\n  Head 2: coreference (pronoun→antecedent)\n  Head 3: semantic similarity\n  Head H: positional patterns\n\nFull Transformer Block:\n  x → LayerNorm → MHA → +x\n  → LayerNorm → FFN → +x\n\nFFN: two linear layers, 4× expansion\n  FFN(x) = max(0, xW₁+b₁)W₂+b₂\n\nGPT-3: 96 layers, 96 heads, d_model=12288, 175B params total.`, math: String.raw`\text{MHA}(Q,K,V) = \text{Concat}(\text{head}_1,\ldots,\text{head}_h)W^O`, math2: String.raw`\text{FFN}(\mathbf{x}) = \max(0,\, \mathbf{x}W_1 + \mathbf{b}_1)W_2 + \mathbf{b}_2`, intuition: "The FFN is where most 'factual knowledge' is stored in LLMs. Attention routes information; FFN transforms it. The 4× expansion in FFN creates a high-dim workspace, then projects back.", Lab: MultiHead },
      { title: "Scaling, Pretraining & RLHF", concept: `Training objective: predict the next token. Simple, scalable.\n\nScaling Laws (Kaplan 2020): L(N) ∝ N^{-0.076}\n  Performance scales as power law with compute, data, params\n\nPipeline:\n  1. Pretrain: next-token prediction on internet text\n  2. SFT: supervised fine-tuning on curated examples\n  3. Reward Model: trained from human preference rankings\n  4. RLHF: PPO optimization against reward model\n\nFine-tuning (LoRA): instead of updating W (d×d), learn W + AB where A is (d×r), B is (r×d), r ≪ d\n  7B model: full FT = 28GB VRAM. QLoRA = 5GB. Same task performance.`, math: String.raw`\mathcal{L}_{\text{LM}} = -\sum_{t=1}^{T} \log P_\theta(x_t \mid x_1, \ldots, x_{t-1})`, math2: String.raw`\text{LoRA: } W' = W + \Delta W = W + \underbrace{A}_{d\times r}\underbrace{B}_{r\times d},\quad r \ll d`, intuition: "LoRA's insight: weight updates during fine-tuning have low intrinsic rank. Instead of updating a 4096×4096 matrix (16M params), learn A (4096×8) and B (8×4096) — 65K params. Same expressive power, 256× fewer trainable parameters.", Lab: Scaling }
    ]
  },
  { id: "multimodal", icon: "◉", color: "#ffb347", title: "Multimodal", sub: "Seeing, reading, hearing",
    sections: [
      { title: "Modality Fusion via Tokenization", concept: `Core challenge: how do you process images, audio, and text in one model?\n\nAnswer: convert everything to tokens in a shared embedding space.\n\n  Text → BPE tokens → embeddings ∈ ℝᵈ\n  Images → patch embeddings (ViT: 16×16 patches) → embeddings ∈ ℝᵈ\n  Audio → spectrogram patches → embeddings ∈ ℝᵈ\n\nOnce everything is tokens in ℝᵈ, a standard transformer processes them identically. The model doesn't care which modality a token came from.\n\nReal world: Gemini 1.5 Pro processes up to 1M tokens = ~1hr video + full codebase + book.`, math: String.raw`\mathbf{T} = \bigl[\phi_{\text{img}}(x_{\text{img}})\,;\, \phi_{\text{txt}}(x_{\text{txt}})\,;\, \phi_{\text{aud}}(x_{\text{aud}})\bigr] \in \mathbb{R}^{N \times d}`, math2: String.raw`\phi_{\text{img}}: \mathbb{R}^{H \times W \times 3} \to \mathbb{R}^{\frac{HW}{p^2} \times d} \quad \text{(patch size } p\text{)}`, intuition: "The key abstraction: modality-specific encoders convert raw pixels/audio/text into token vectors. After that, it's all just transformer attention on sequences of vectors.", Lab: Tokenization },
      { title: "ViT & CLIP", concept: `ViT (2020): apply transformers directly to image patches.\n  1. Split image into 16×16 patches → linear projection\n  2. Prepend [CLS] token, add position embeddings\n  3. Feed through transformer encoder\n  4. Use [CLS] for classification\n\nCLIP (OpenAI 2021): train image + text encoders jointly on 400M web image-text pairs.\n\n  Contrastive loss: maximize sim of matched pairs, minimize unmatched.\n\nCLIP zero-shot: compare image embedding to "a photo of a {class}" embeddings → pick highest sim.\n\nPowers: DALL-E, Stable Diffusion, GPT-4V, reverse image search.`, math: String.raw`\mathcal{L}_\text{CLIP} = -\frac{1}{N}\sum_i \log \frac{e^{\langle z_i^I, z_i^T\rangle/\tau}}{\sum_j e^{\langle z_i^I, z_j^T\rangle/\tau}}`, math2: String.raw`\text{ViT: } \frac{H \times W}{p^2} \text{ patch tokens} + 1\text{ [CLS] token}`, intuition: "CLIP's zero-shot power comes from aligning vision and language. Once aligned, anything expressible in language is a query: 'find images of a crowded marketplace at night' — no fine-tuning needed.", Lab: CLIP },
      { title: "Diffusion Models", concept: `Generate images by learning to reverse a noise process.\n\nForward process (fixed): gradually add Gaussian noise over T steps until image ≈ pure noise.\n\nReverse process (learned): train a U-Net to predict and remove noise at each step: noise → image.\n\nConditioning: inject text embedding via cross-attention. Network removes noise towards the described image.\n\nText-to-image pipeline:\n  1. CLIP text encoder → text embedding\n  2. Diffusion denoiser (U-Net) conditioned on embedding\n  3. Decode latents → pixels (Latent Diffusion)\n\nReal world: Stable Diffusion, DALL-E 3, Midjourney, Sora (video), drug discovery.`, math: String.raw`\mathcal{L} = \mathbb{E}_{t,x_0,\varepsilon}\!\left[\|\varepsilon - \varepsilon_\theta\!\left(\sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\varepsilon,\;t\right)\|^2\right]`, math2: String.raw`x_{t-1} = \frac{1}{\sqrt{\alpha_t}}\!\left(x_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\varepsilon_\theta\right) + \sigma_t z`, intuition: "Diffusion learns the score function: ∇_x log p(x) — the direction in pixel space that makes an image more realistic. At each step, it says 'change it this way to be more likely'. Classifier-free guidance amplifies this.", Lab: Diffusion },
      { title: "Frontier Models & Fine-Tuning", concept: `Modern frontier models (Claude 3.5, GPT-4o, Gemini 1.5):\n  • Native multimodal — vision+text in a single unified model\n  • Context windows: 128K–1M tokens\n  • Tool use, code execution, function calling\n  • RLHF + Constitutional AI for alignment\n\nFine-tuning a multimodal model (practical):\n  1. Choose base (Llava, Qwen-VL, InternVL)\n  2. Prepare instruction-following data (image+text pairs)\n  3. QLoRA fine-tune on 1-2 GPUs\n  4. Evaluate on task-specific benchmark\n  5. Deploy with quantization (4-bit GGUF)\n\nkarta use case: screenshot → patch embeddings + instruction text → joint attention → structured action output.`, math: String.raw`p(y \mid x_{\text{img}}, x_{\text{text}}) \approx \text{Transformer}\!\left([\phi_{\text{img}}(x)\,;\, \phi_{\text{txt}}(x)]\right)`, math2: String.raw`\text{QLoRA: quantize } W \text{ to 4-bit, add LoRA in } \mathbb{R}^{d \times r},\; r \in \{4,8,16,32\}`, intuition: "The entire landscape converges here: one transformer, trained with self-supervised objectives across all modalities, fine-tuned with RLHF, compressed with quantization, adapted with LoRA. Every concept from linear regression is still operating — just at scale.", Lab: FineTuning }
    ]
  }
];

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ section, color, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden", border: `1px solid ${open ? color + "44" : "#1a1a1a"}`, transition: "border 0.3s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", textAlign: "left", padding: "14px 18px", background: open ? `linear-gradient(90deg,${color}0d,transparent)` : "#0e1012", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color, fontFamily: "monospace", fontSize: 11, minWidth: 26 }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: open ? "#fff" : "#c8cdd8", fontSize: 14, fontWeight: 500, flex: 1, textAlign: "left" }}>{section.title}</span>
        <span style={{ color, fontSize: 18, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.3s", display: "block" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 20px", background: "#080a0d" }}>
          <div style={{ paddingTop: 14 }}>
            <div style={{ background: "#0f1115", borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 12, fontFamily: "monospace", fontSize: 12, color: "#c8cdd8", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {section.concept}
            </div>
            <div style={{ background: "#0a120a", border: "1px solid #142014", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#4a8a5a", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>The Math</div>
              <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                <MathEq tex={section.math} display />
                {section.math2 && <div style={{ marginTop: 10 }}><MathEq tex={section.math2} display /></div>}
              </div>
            </div>
            <div style={{ background: "#120f00", border: "1px solid #2a2000", borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#b07820", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>💡 Intuition</div>
              <p style={{ fontSize: 13, color: "#e0c878", lineHeight: 1.7 }}>{section.intuition}</p>
            </div>
            {section.Lab && <section.Lab color={color} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AILandscape() {
  const [activeChapter, setActiveChapter] = useState(0);
  const ch = CHAPTERS[activeChapter];

  return (
    <div style={{ minHeight: "100vh", background: "#07080a", color: "#d0d4de", fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#0d0f13,#07080a)", borderBottom: "1px solid #141820", padding: "28px 20px 22px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% -20%,rgba(79,255,176,0.06),transparent)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.3em", color: "#3a4050", marginBottom: 8, textTransform: "uppercase" }}>From First Principles</div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(28px,5vw,50px)", fontWeight: 900, margin: 0, background: "linear-gradient(135deg,#fff,#666)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.05 }}>
            The AI Landscape
          </h1>
          <p style={{ color: "#3a4050", margin: "8px 0 0", fontSize: 12, fontFamily: "monospace" }}>
            Linear regression → Neural nets → CNNs → Transformers → Multimodal · Rendered math + interactive labs
          </p>
        </div>
      </div>

      {/* Chapter nav */}
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "14px 14px 0", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
        {CHAPTERS.map((c, i) => (
          <button key={c.id} onClick={() => setActiveChapter(i)} style={{
            background: activeChapter === i ? `linear-gradient(135deg,${c.color}18,${c.color}06)` : "#0e1012",
            border: `1px solid ${activeChapter === i ? c.color : "#1a1a1a"}`,
            borderRadius: 10, padding: "11px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.25s"
          }}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: activeChapter === i ? c.color : "#c0c4cc", marginTop: 3 }}>{c.title}</div>
            <div style={{ fontSize: 9, color: "#404550", fontFamily: "monospace", marginTop: 2 }}>{c.sections.length} topics</div>
          </button>
        ))}
      </div>

      {/* Chapter content */}
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "14px 14px 60px" }}>
        <div style={{ background: "#0c0e12", borderRadius: 14, border: `1px solid ${ch.color}22`, overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 16px", background: `linear-gradient(135deg,${ch.color}0d,transparent)`, borderBottom: `1px solid ${ch.color}18`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 40 }}>{ch.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: ch.color, fontFamily: "'Georgia',serif", fontWeight: 700 }}>{ch.title}</h2>
              <p style={{ margin: "4px 0 0", color: "#3a4050", fontSize: 11, fontFamily: "monospace" }}>{ch.sub} · {ch.sections.length} interactive topics</p>
            </div>
          </div>
          <div style={{ padding: 14 }}>
            {ch.sections.map((sec, i) => <SectionCard key={sec.title} section={sec} color={ch.color} index={i} />)}
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))} disabled={activeChapter === 0} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: activeChapter === 0 ? "#333" : "#999", fontFamily: "monospace", fontSize: 12, cursor: activeChapter === 0 ? "not-allowed" : "pointer" }}>← Prev</button>
          <div style={{ display: "flex", gap: 6 }}>
            {CHAPTERS.map((c, i) => <div key={i} onClick={() => setActiveChapter(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: activeChapter === i ? c.color : "#222", cursor: "pointer", transition: "background 0.3s" }} />)}
          </div>
          <button onClick={() => setActiveChapter(Math.min(CHAPTERS.length - 1, activeChapter + 1))} disabled={activeChapter === CHAPTERS.length - 1} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: activeChapter === CHAPTERS.length - 1 ? "#333" : "#999", fontFamily: "monospace", fontSize: 12, cursor: activeChapter === CHAPTERS.length - 1 ? "not-allowed" : "pointer" }}>Next →</button>
        </div>
      </div>
    </div>
  );
}