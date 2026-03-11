"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── KaTeX ─────────────────────────────────────────────────────────────────────
function useMath() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.katex) { setReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}
function MathEq({ tex, display = false, style = {} }) {
  const ref = useRef(null);
  const ready = useMath();
  useEffect(() => {
    if (ready && ref.current && window.katex) {
      try { window.katex.render(tex, ref.current, { displayMode: display, throwOnError: false }); } catch (e) {}
    }
  }, [ready, tex, display]);
  return <span ref={ref} style={{ color: display ? "#90ee90" : "#a8d8a8", fontSize: display ? "1.1em" : "0.95em", ...style }} />;
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────
function Slider({ label, min, max, val, step = 1, onChange, color = "#4fffb0" }) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#556", minWidth: 140 }}>{label}</span>
      <input type="range" min={min} max={max} value={val} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: color, cursor: "pointer" }} />
      <span style={{ fontFamily: "monospace", fontSize: 11, color, minWidth: 48, textAlign: "right" }}>
        {Number(val).toFixed(decimals)}
      </span>
    </div>
  );
}
function BtnRow({ options, active, onSelect, color = "#4fffb0" }) {
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
function StatBox({ label, val, unit = "", color = "#4fffb0" }) {
  return (
    <div style={{ background: "#0a0c0e", border: `1px solid ${color}22`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 90 }}>
      <div style={{ fontFamily: "monospace", fontSize: 18, color, fontWeight: 700 }}>{val}<span style={{ fontSize: 10, color: color + "99" }}>{unit}</span></div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}
function Quote({ text, source, color }) {
  return (
    <div style={{ background: "#0c0d0f", border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", margin: "10px 0", fontStyle: "italic", fontSize: 12, color: "#b0b8c4", lineHeight: 1.7 }}>
      "{text}"
      {source && <div style={{ fontStyle: "normal", fontSize: 10, color: color + "99", marginTop: 4 }}>— {source}</div>}
    </div>
  );
}
function LabWrap({ title, color, children }) {
  return (
    <div style={{ marginTop: 14, background: "#06080a", border: `1px solid ${color}22`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(90deg,${color}18,transparent)`, padding: "8px 14px", borderBottom: `1px solid ${color}18`, fontFamily: "monospace", fontSize: 10, color, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        ⚗ Interactive Lab · {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}
function useCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    draw(ctx, W, H);
  }, deps);
  return ref;
}

// ─── LAB: Basis Function Regression ───────────────────────────────────────────
function LabBasisRegression({ color }) {
  const [K, setK] = useState(5);
  const [noise, setNoise] = useState(0.3);
  const seed = useRef(42);
  const rng = useCallback(() => { seed.current = (seed.current * 1664525 + 1013904223) % 4294967296; return seed.current / 4294967296; }, []);

  const ref = useCanvas((ctx, W, H) => {
    seed.current = 42;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const N = 24;
    const trueF = x => Math.sin(x * 2.5) * 0.7 + x * 0.3;
    const xs = Array.from({ length: N }, () => (rng() * 2 - 1));
    const ys = xs.map(x => trueF(x) + (rng() - 0.5) * noise * 2);
    const toX = x => (x + 1.2) / 2.4 * (W - 40) + 20;
    const toY = y => H / 2 - y * (H / 3.5);
    // axes
    ctx.strokeStyle = "#1e222a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, H - 10); ctx.stroke();
    // basis functions (gaussians)
    const centers = Array.from({ length: K }, (_, i) => -1 + 2 * i / (K - 1));
    const sigma = 2.5 / K;
    const phi = x => centers.map(c => Math.exp(-((x - c) ** 2) / (2 * sigma ** 2)));
    // solve w* via least squares (Φᵀ Φ w = Φᵀ y)
    const Phi = xs.map(x => phi(x));
    const PhiT_Phi = Array.from({ length: K }, (_, i) => Array.from({ length: K }, (_, j) => xs.reduce((s, _, n) => s + Phi[n][i] * Phi[n][j], 0)));
    const PhiT_y = Array.from({ length: K }, (_, i) => xs.reduce((s, _, n) => s + Phi[n][i] * ys[n], 0));
    // Gauss-Jordan
    const M = PhiT_Phi.map((row, i) => [...row, PhiT_y[i]]);
    for (let i = 0; i < K; i++) {
      let max = i;
      for (let j = i + 1; j < K; j++) if (Math.abs(M[j][i]) > Math.abs(M[max][i])) max = j;
      [M[i], M[max]] = [M[max], M[i]];
      if (Math.abs(M[i][i]) < 1e-10) continue;
      for (let j = 0; j < K; j++) if (j !== i) { const f = M[j][i] / M[i][i]; for (let l = i; l <= K; l++) M[j][l] -= f * M[i][l]; }
    }
    const w = Array.from({ length: K }, (_, i) => M[i][K] / M[i][i]);
    // draw individual basis functions (dim)
    centers.forEach((c, k) => {
      ctx.beginPath(); ctx.strokeStyle = color + "25"; ctx.lineWidth = 1;
      for (let px = 0; px <= W - 40; px++) {
        const x = px / (W - 40) * 2.4 - 1.2;
        const y = Math.exp(-((x - c) ** 2) / (2 * sigma ** 2)) * w[k];
        const method = px === 0 ? "moveTo" : "lineTo";
        ctx[method](toX(x), toY(y));
      }
      ctx.stroke();
    });
    // true function
    ctx.beginPath(); ctx.strokeStyle = "#334466"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    for (let px = 0; px <= W - 40; px++) {
      const x = px / (W - 40) * 2.4 - 1.2;
      const method = px === 0 ? "moveTo" : "lineTo";
      ctx[method](toX(x), toY(trueF(x)));
    }
    ctx.stroke(); ctx.setLineDash([]);
    // fitted curve
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (let px = 0; px <= W - 40; px++) {
      const x = px / (W - 40) * 2.4 - 1.2;
      const y = phi(x).reduce((s, v, i) => s + v * w[i], 0);
      const method = px === 0 ? "moveTo" : "lineTo";
      ctx[method](toX(x), toY(y));
    }
    ctx.stroke();
    // data points
    xs.forEach((x, i) => {
      ctx.beginPath(); ctx.arc(toX(x), toY(ys[i]), 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1; ctx.stroke();
    });
    // MSE
    const fitted = xs.map(x => phi(x).reduce((s, v, i) => s + v * w[i], 0));
    const mse = xs.reduce((s, _, i) => s + (ys[i] - fitted[i]) ** 2, 0) / N;
    ctx.fillStyle = color + "cc"; ctx.font = "monospace 11px monospace";
    ctx.fillText(`K=${K} basis fns  MSE=${mse.toFixed(3)}`, 28, 18);
    ctx.fillStyle = "#334466"; ctx.fillText("--- true f(x)", W - 100, 18);
  }, [K, noise]);

  return (
    <LabWrap title="Basis Function Regression §1.2" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 220, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <Slider label="K (# basis functions)" min={2} max={18} val={K} onChange={setK} color={color} />
      <Slider label="Noise σ" min={0.05} max={1.5} step={0.05} val={noise} onChange={setNoise} color={color} />
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "6px 0 0" }}>
        White dots = training data. Colored curve = fitted model. Dim curves = individual weighted basis fns.
        Increase K → more flexible → risk of overfitting.
      </p>
    </LabWrap>
  );
}

// ─── LAB: Overfitting ─────────────────────────────────────────────────────────
function LabOverfitting({ color }) {
  const [capacity, setCapacity] = useState(6);
  const [dataSize, setDataSize] = useState(20);
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const maxEpochs = 80;
    const trainLoss = [], valLoss = [];
    for (let e = 0; e < maxEpochs; e++) {
      const t = e / maxEpochs;
      const capFactor = capacity / 10;
      const dataFactor = dataSize / 50;
      const tl = 0.9 * Math.exp(-t * (3 + capFactor * 2)) + 0.05;
      const overfit = capFactor * Math.max(0, t - 0.3 / dataFactor) * (1 - dataFactor) * 1.2;
      const vl = tl + overfit + 0.02 * Math.sin(e * 0.4);
      trainLoss.push(Math.max(0.04, tl));
      valLoss.push(Math.max(0.05, Math.min(1.5, vl)));
    }
    const toX = e => e / maxEpochs * (W - 40) + 20;
    const toY = v => H - 24 - v / 1.2 * (H - 40);
    // axes
    ctx.strokeStyle = "#1e222a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, H - 24); ctx.lineTo(W - 10, H - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(20, H - 24); ctx.stroke();
    ctx.fillStyle = "#334"; ctx.font = "10px monospace";
    ctx.fillText("epochs →", W - 80, H - 8);
    ctx.fillText("loss", 24, 18);
    // overfitting zone highlight
    const overStart = Math.floor(0.3 / (dataSize / 50) * maxEpochs);
    if (overStart < maxEpochs && capacity > 5 && dataSize < 35) {
      ctx.fillStyle = "rgba(255,80,80,0.04)";
      ctx.fillRect(toX(overStart), 10, toX(maxEpochs - 1) - toX(overStart), H - 34);
      ctx.fillStyle = "#ff505066"; ctx.font = "9px monospace";
      ctx.fillText("OVERFITTING", toX(overStart) + 4, 24);
    }
    // train loss
    ctx.beginPath(); ctx.strokeStyle = "#4a9aff"; ctx.lineWidth = 2;
    trainLoss.forEach((v, e) => { const m = e === 0 ? "moveTo" : "lineTo"; ctx[m](toX(e), toY(v)); });
    ctx.stroke();
    ctx.fillStyle = "#4a9aff"; ctx.font = "10px monospace"; ctx.fillText("train", W - 60, 36);
    // val loss
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    valLoss.forEach((v, e) => { const m = e === 0 ? "moveTo" : "lineTo"; ctx[m](toX(e), toY(v)); });
    ctx.stroke();
    ctx.fillStyle = color; ctx.fillText("val", W - 60, 50);
  }, [capacity, dataSize]);

  const overfit = capacity > 7 && dataSize < 25;
  const underfit = capacity < 3;

  return (
    <LabWrap title="Bias-Variance Tradeoff §1.3" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 200, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <Slider label="Model capacity" min={1} max={10} val={capacity} onChange={setCapacity} color={color} />
      <Slider label="Training data size" min={5} max={50} val={dataSize} onChange={setDataSize} color={color} />
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {underfit && <div style={{ background: "#ff881122", border: "1px solid #ff881144", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: "monospace", color: "#ff8811" }}>⚠ Underfitting: capacity too low</div>}
        {overfit && <div style={{ background: "#ff444422", border: "1px solid #ff444444", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: "monospace", color: "#ff6666" }}>🔥 Overfitting: val loss diverging</div>}
        {!underfit && !overfit && <div style={{ background: "#44ff8822", border: "1px solid #44ff8844", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: "monospace", color: "#44ff88" }}>✓ Good generalization</div>}
      </div>
    </LabWrap>
  );
}

// ─── LAB: Gradient Descent ────────────────────────────────────────────────────
function LabGradientDescent({ color }) {
  const [lr, setLr] = useState(0.08);
  const [opt, setOpt] = useState("SGD");
  const [step, setStep] = useState(0);
  const maxSteps = 60;
  const landscape = useCallback((x, y) => {
    return Math.sin(x * 1.5) * Math.cos(y) * 0.8 + 0.3 * (x * x + y * y) * 0.12 + 0.5 * Math.cos(x * 2.5 + 0.5) * 0.4;
  }, []);
  const grad = useCallback((x, y) => {
    const h = 0.001;
    return [(landscape(x + h, y) - landscape(x - h, y)) / (2 * h), (landscape(x, y + h) - landscape(x, y - h)) / (2 * h)];
  }, [landscape]);

  const pathsRef = useRef({});
  useEffect(() => {
    const computed = {};
    ["SGD", "Momentum", "Adam"].forEach(o => {
      let x = 2.2, y = 1.8;
      let mx = 0, my = 0, vx = 0, vy = 0, t = 0;
      const pts = [[x, y]];
      for (let i = 0; i < maxSteps; i++) {
        t++;
        const [gx, gy] = grad(x, y);
        if (o === "SGD") { x -= lr * gx; y -= lr * gy; }
        else if (o === "Momentum") {
          const beta = 0.9;
          mx = beta * mx + (1 - beta) * gx; my = beta * my + (1 - beta) * gy;
          x -= lr * mx * 2; y -= lr * my * 2;
        } else {
          const b1 = 0.9, b2 = 0.999, eps = 1e-8;
          mx = b1 * mx + (1 - b1) * gx; my = b1 * my + (1 - b1) * gy;
          vx = b2 * vx + (1 - b2) * gx * gx; vy = b2 * vy + (1 - b2) * gy * gy;
          const mxHat = mx / (1 - b1 ** t), myHat = my / (1 - b1 ** t);
          const vxHat = vx / (1 - b2 ** t), vyHat = vy / (1 - b2 ** t);
          x -= lr * mxHat / (Math.sqrt(vxHat) + eps);
          y -= lr * myHat / (Math.sqrt(vyHat) + eps);
        }
        pts.push([Math.max(-3, Math.min(3, x)), Math.max(-3, Math.min(3, y))]);
      }
      computed[o] = pts;
    });
    pathsRef.current = computed;
  }, [lr, grad]);
  const paths = pathsRef.current;

  const pathColors = { SGD: "#4a9aff", Momentum: "#ffb347", Adam: color };

  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    // draw landscape as heatmap
    const res = 4;
    for (let px = 0; px < W; px += res) {
      for (let py = 0; py < H; py += res) {
        const x = (px / W) * 6 - 3, y = (py / H) * 6 - 3;
        const v = landscape(x, y);
        const norm = (v + 1) / 2;
        const r = Math.floor(7 + norm * 20), g = Math.floor(9 + norm * 12), b = Math.floor(14 + norm * 30);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, res, res);
      }
    }
    const toX = x => (x + 3) / 6 * W;
    const toY = y => (y + 3) / 6 * H;
    // draw contours
    ctx.strokeStyle = "#ffffff10"; ctx.lineWidth = 0.5;
    for (let v = -0.5; v < 1.5; v += 0.25) {
      ctx.beginPath();
      let first = true;
      for (let px = 0; px < W; px++) {
        const x = (px / W) * 6 - 3;
        for (let py = 0; py < H; py++) {
          const y = (py / H) * 6 - 3;
          if (Math.abs(landscape(x, y) - v) < 0.04) {
            if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
    }
    // draw paths up to current step
    Object.entries(paths).forEach(([name, pts]) => {
      if (name !== opt && step > 0) return;
      const c = pathColors[name];
      const end = Math.min(step + 1, pts.length);
      ctx.beginPath(); ctx.strokeStyle = c + (name === opt ? "ee" : "55"); ctx.lineWidth = name === opt ? 2.5 : 1;
      pts.slice(0, end).forEach(([x, y], i) => { const m = i === 0 ? "moveTo" : "lineTo"; ctx[m](toX(x), toY(y)); });
      ctx.stroke();
      if (end > 1) {
        const [x, y] = pts[end - 1];
        ctx.beginPath(); ctx.arc(toX(x), toY(y), name === opt ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.fill();
      }
    });
    ctx.fillStyle = "#ffffffcc"; ctx.font = "11px monospace";
    ctx.fillText(`step ${step}/${maxSteps}   lr=${lr}`, 10, 18);
  }, [step, opt, lr, paths]);

  return (
    <LabWrap title="Gradient Descent §3.3" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 230, display: "block", borderRadius: 8, marginBottom: 10, cursor: "pointer" }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <button onClick={() => setStep(0)} style={{ padding: "5px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, color: "#aaa", fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>↩ Reset</button>
        <button onClick={() => setStep(s => Math.min(s + 1, maxSteps))} style={{ padding: "5px 12px", background: color + "22", border: `1px solid ${color}`, borderRadius: 6, color, fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>Step →</button>
        <button onClick={() => { let s = 0; const id = setInterval(() => { s++; setStep(s); if (s >= maxSteps) clearInterval(id); }, 60); }} style={{ padding: "5px 12px", background: color + "22", border: `1px solid ${color}`, borderRadius: 6, color, fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>▶ Run</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {Object.entries(pathColors).map(([n, c]) => (
            <button key={n} onClick={() => { setOpt(n); setStep(0); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${c}`, background: opt === n ? c : "transparent", color: opt === n ? "#000" : c, fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
      </div>
      <Slider label="Learning rate η" min={0.01} max={0.3} step={0.01} val={lr} onChange={v => { setLr(v); setStep(0); }} color={color} />
    </LabWrap>
  );
}

// ─── LAB: Backpropagation / Vanishing Gradient ────────────────────────────────
function LabBackprop({ color }) {
  const [depth, setDepth] = useState(8);
  const [skipConn, setSkipConn] = useState(false);
  const [activation, setActivation] = useState("Tanh");
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    // gradient magnitude at each layer (simplified model)
    const grads = Array.from({ length: depth }, (_, i) => {
      const layer = depth - 1 - i;
      let g;
      if (activation === "Tanh") g = Math.pow(0.6, layer) * (skipConn ? Math.pow(1.1, layer * 0.4) : 1);
      else if (activation === "ReLU") g = Math.pow(0.92, layer) * (skipConn ? Math.pow(1.05, layer * 0.5) : 1);
      else g = Math.pow(0.98, layer) * (skipConn ? Math.pow(1.02, layer * 0.2) : 1);
      return Math.min(1, Math.max(0.001, g));
    });
    const barW = (W - 40) / depth - 4;
    const maxH = H - 50;
    grads.forEach((g, i) => {
      const x = 20 + i * ((W - 40) / depth);
      const h = g * maxH;
      const norm = Math.log(g + 0.001) / Math.log(1.001);
      const red = g < 0.05 ? 1 : 0;
      const r = Math.floor(red * 200 + (1 - red) * parseInt(color.slice(1, 3) || "4f", 16));
      ctx.fillStyle = g < 0.01 ? "#ff4444" : g < 0.1 ? "#ff8844" : color;
      ctx.fillRect(x, H - 30 - h, barW, h);
      // skip connection indicators
      if (skipConn && i > 0 && i % 2 === 0) {
        ctx.strokeStyle = "#4a9aff44"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
        ctx.beginPath();
        const px = x - (W - 40) / depth * 2 + barW / 2;
        ctx.moveTo(px, H - 30 - grads[i - 2] * maxH);
        ctx.lineTo(x + barW / 2, H - 30 - h);
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = "#445"; ctx.font = "9px monospace";
      ctx.fillText(`L${i + 1}`, x + barW / 2 - 6, H - 14);
    });
    ctx.fillStyle = "#ffffffcc"; ctx.font = "11px monospace";
    ctx.fillText("← output layer                         input layer →", 20, 16);
    ctx.fillText("gradient magnitude flowing backward", 20, H - 2);
    const vanished = grads[grads.length - 1] < 0.05;
    if (vanished) {
      ctx.fillStyle = "#ff444488";
      ctx.fillText("⚠ VANISHING GRADIENT", W / 2 - 70, H / 2);
    }
  }, [depth, skipConn, activation]);

  return (
    <LabWrap title="Backprop & Vanishing Gradient §3.4" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 200, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <Slider label="Network depth" min={2} max={20} val={depth} onChange={setDepth} color={color} />
      <BtnRow options={["Tanh", "ReLU", "GELU"]} active={activation} onSelect={setActivation} color={color} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 11, color, cursor: "pointer" }}>
        <input type="checkbox" checked={skipConn} onChange={e => setSkipConn(e.target.checked)} style={{ accentColor: color }} />
        Enable skip/residual connections (ResNet-style)
      </label>
    </LabWrap>
  );
}

// ─── LAB: Cross-Entropy Loss ──────────────────────────────────────────────────
function LabCrossEntropy({ color }) {
  const [logits, setLogits] = useState([2.0, 0.5, -0.3]);
  const classes = ["cat 🐱", "dog 🐶", "bird 🐦"];
  const softmax = ls => { const exps = ls.map(l => Math.exp(l)); const sum = exps.reduce((a, b) => a + b, 0); return exps.map(e => e / sum); };
  const probs = softmax(logits);
  const ceTrue = -Math.log(probs[0]);
  return (
    <LabWrap title="Cross-Entropy Loss §3.1" color={color}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#556", marginBottom: 8, textTransform: "uppercase" }}>Logits (model output)</div>
          {logits.map((l, i) => (
            <Slider key={i} label={classes[i]} min={-4} max={4} step={0.1} val={l} onChange={v => setLogits(ls => ls.map((x, j) => j === i ? v : x))} color={i === 0 ? color : "#7a7aaa"} />
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#556", marginBottom: 8, textTransform: "uppercase" }}>Softmax Probabilities</div>
          {probs.map((p, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11, color: i === 0 ? color : "#667", marginBottom: 3 }}>
                <span>{classes[i]}</span><span>{(p * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: "#111", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p * 100}%`, background: i === 0 ? color : "#334", borderRadius: 4, transition: "width 0.2s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatBox label="CE Loss (cat)" val={ceTrue.toFixed(3)} color={color} />
        <StatBox label="P(cat)" val={(probs[0] * 100).toFixed(1)} unit="%" color={color} />
        <StatBox label="log P(cat)" val={(-ceTrue).toFixed(3)} color="#7a7aaa" />
      </div>
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "8px 0 0" }}>
        True class = cat. CE = −log P̂(cat). Lower logit → lower probability → higher loss.
      </p>
    </LabWrap>
  );
}

// ─── LAB: Activation Functions ────────────────────────────────────────────────
function LabActivations({ color }) {
  const [fn, setFn] = useState("ReLU");
  const [showDeriv, setShowDeriv] = useState(true);
  const fns = {
    ReLU: { f: x => Math.max(0, x), d: x => x > 0 ? 1 : 0, note: "Dead neuron risk for x<0. Fast, widely used." },
    Tanh: { f: x => Math.tanh(x), d: x => 1 - Math.tanh(x) ** 2, note: "Saturates → vanishing gradient. Classic." },
    Sigmoid: { f: x => 1 / (1 + Math.exp(-x)), d: x => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, note: "Output ∈(0,1). Severe saturation at extremes." },
    GELU: { f: x => x * 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3))), d: x => { const t = Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)); return 0.5 * (1 + t) + x * 0.5 * (1 - t ** 2) * 0.7978845608 * (1 + 3 * 0.044715 * x ** 2); }, note: "Used in GPT, BERT. Smooth, non-zero for x<0." },
    "Leaky ReLU": { f: x => x > 0 ? x : 0.1 * x, d: x => x > 0 ? 1 : 0.1, note: "α=0.1 for x<0. Prevents dead neurons." },
  };
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const toX = x => (x + 3) / 6 * (W - 40) + 20;
    const toY = y => H / 2 - y * (H / 5);
    ctx.strokeStyle = "#1a1f26"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, H - 10); ctx.stroke();
    // grid
    [-2, -1, 1, 2].forEach(v => {
      ctx.fillStyle = "#223"; ctx.font = "9px monospace";
      ctx.fillText(v, toX(v) - 4, H / 2 + 14);
      ctx.beginPath(); ctx.strokeStyle = "#1a1f26"; ctx.lineWidth = 0.5;
      ctx.moveTo(toX(v), 10); ctx.lineTo(toX(v), H - 10); ctx.stroke();
    });
    const { f, d } = fns[fn];
    // derivative
    if (showDeriv) {
      ctx.beginPath(); ctx.strokeStyle = "#ff884488"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      for (let px = 0; px <= W - 40; px++) {
        const x = (px / (W - 40)) * 6 - 3;
        try { const m = px === 0 ? "moveTo" : "lineTo"; ctx[m](toX(x), toY(d(x))); } catch (e) {}
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // function
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (let px = 0; px <= W - 40; px++) {
      const x = (px / (W - 40)) * 6 - 3;
      try { const m = px === 0 ? "moveTo" : "lineTo"; ctx[m](toX(x), toY(f(x))); } catch (e) {}
    }
    ctx.stroke();
    ctx.fillStyle = color; ctx.font = "11px monospace";
    ctx.fillText(fn, 28, 20);
    if (showDeriv) { ctx.fillStyle = "#ff884488"; ctx.fillText("f'(x)", 28, 34); }
  }, [fn, showDeriv]);

  return (
    <LabWrap title="Activation Functions §4.3" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 200, display: "block", borderRadius: 8, marginBottom: 8 }} />
      <BtnRow options={Object.keys(fns)} active={fn} onSelect={setFn} color={color} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 11, color: "#ff884499", cursor: "pointer" }}>
        <input type="checkbox" checked={showDeriv} onChange={e => setShowDeriv(e.target.checked)} style={{ accentColor: "#ff8844" }} />
        Show derivative f'(x)
      </label>
      <p style={{ fontSize: 11, color: "#7a7a8a", fontFamily: "monospace", margin: "6px 0 0" }}>{fns[fn].note}</p>
    </LabWrap>
  );
}

// ─── LAB: Multi-Head Attention ────────────────────────────────────────────────
function LabAttention({ color }) {
  const [temp, setTemp] = useState(1.0);
  const [heads, setHeads] = useState(2);
  const tokens = ["The", "cat", "sat", "on", "mat"];
  const N = tokens.length;
  const raw = useRef([
    [1.2, 0.8, 0.3, 0.1, 0.2],
    [0.9, 1.5, 0.7, 0.2, 0.3],
    [0.4, 0.8, 1.3, 0.6, 0.4],
    [0.2, 0.3, 0.5, 1.2, 0.9],
    [0.3, 0.4, 0.5, 0.8, 1.4]
  ]);
  const softmaxRow = row => { const exps = row.map(v => Math.exp(v / temp)); const sum = exps.reduce((a, b) => a + b, 0); return exps.map(e => e / sum); };
  const attn = raw.current.map(r => softmaxRow(r));
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const pad = 52, cell = (Math.min(W, H) - pad - 20) / N;
    attn.forEach((row, i) => {
      row.forEach((v, j) => {
        const hue = v;
        ctx.fillStyle = `rgba(${Math.floor(parseInt(color.slice(1, 3), 16) * v * 1.2)},${Math.floor(parseInt(color.slice(3, 5), 16) * v)},${Math.floor(parseInt(color.slice(5, 7), 16) * v * 0.3)},${0.15 + v * 0.85})`;
        ctx.fillRect(pad + j * cell, pad + i * cell, cell - 2, cell - 2);
        ctx.fillStyle = v > 0.3 ? "#000" : "#667";
        ctx.font = "10px monospace";
        ctx.fillText(v.toFixed(2), pad + j * cell + cell / 2 - 14, pad + i * cell + cell / 2 + 4);
      });
    });
    tokens.forEach((t, i) => {
      ctx.fillStyle = color; ctx.font = "11px monospace";
      ctx.fillText(t, pad + i * cell + 4, pad - 6);
      ctx.save(); ctx.translate(pad - 6, pad + i * cell + cell / 2 + 4);
      ctx.rotate(-Math.PI / 2); ctx.fillText(t, -16, 0); ctx.restore();
    });
    ctx.fillStyle = "#334"; ctx.font = "10px monospace";
    ctx.fillText(`τ = ${temp.toFixed(1)}`, W - 60, 18);
  }, [temp, heads]);

  return (
    <LabWrap title="Self-Attention Heatmap §4.8" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 280, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <Slider label="Temperature τ (√d_QK in practice)" min={0.1} max={4} step={0.1} val={temp} onChange={setTemp} color={color} />
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "4px 0 0" }}>
        Row i = where token i attends. Low τ → sharper (argmax-like). High τ → uniform attention.
        A_q,k = softmax(Q·K^T / √d_QK)
      </p>
    </LabWrap>
  );
}

// ─── LAB: Positional Encoding ─────────────────────────────────────────────────
function LabPositionalEncoding({ color }) {
  const [T, setT] = useState(32);
  const [D, setD] = useState(64);
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const cellW = (W - 4) / T, cellH = (H - 4) / Math.min(D, 32);
    for (let t = 0; t < T; t++) {
      for (let d = 0; d < Math.min(D, 32); d++) {
        const enc = d % 2 === 0
          ? Math.sin(t / Math.pow(10000, d / D))
          : Math.cos(t / Math.pow(10000, (d - 1) / D));
        const v = (enc + 1) / 2;
        const r = Math.floor(v * parseInt(color.slice(1, 3), 16));
        const g = Math.floor(v * parseInt(color.slice(3, 5), 16));
        const b = Math.floor(v * parseInt(color.slice(5, 7), 16));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(2 + t * cellW, 2 + d * cellH, cellW - 0.5, cellH - 0.5);
      }
    }
    ctx.fillStyle = color + "bb"; ctx.font = "10px monospace";
    ctx.fillText("← position t →", W / 2 - 50, H - 4);
    ctx.save(); ctx.translate(10, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("dimension d ↑", -40, 0); ctx.restore();
  }, [T, D]);

  return (
    <LabWrap title="Sinusoidal Positional Encoding §4.10" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 200, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <Slider label="Sequence length T" min={8} max={64} val={T} onChange={setT} color={color} />
      <Slider label="Embedding dim D" min={16} max={256} step={8} val={D} onChange={setD} color={color} />
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "4px 0 0" }}>
        pos-enc[t,d] = sin(t/10000^(d/D)) or cos(…). Different frequencies encode position uniquely.
        Brightness = value (−1 to 1).
      </p>
    </LabWrap>
  );
}

// ─── LAB: Transformer Architecture ───────────────────────────────────────────
function LabTransformer({ color }) {
  const [model, setModel] = useState("GPT");
  const [d, setD] = useState(768);
  const [heads, setHeads] = useState(12);
  const [layers, setLayers] = useState(12);
  const [seqLen, setSeqLen] = useState(1024);
  const params = () => {
    const attnParams = layers * (4 * d * d + 4 * d); // Q,K,V,O projections
    const mlpParams = layers * (8 * d * d + 5 * d); // 2 FC + biases
    const embedParams = 50257 * d; // vocab embed
    return attnParams + mlpParams + embedParams;
  };
  const flops = () => params() * 2 * seqLen;
  const fmt = n => n > 1e9 ? (n / 1e9).toFixed(1) + "B" : n > 1e6 ? (n / 1e6).toFixed(0) + "M" : n > 1e3 ? (n / 1e3).toFixed(0) + "K" : n;
  const kvCache = layers * 2 * seqLen * d * 2 / 1e9; // fp16 bytes → GB

  const models = {
    GPT: { desc: "Causal decoder-only. Predicts next token.", arch: "embed → [causal-self-att + ffn] × N → lm-head" },
    BERT: { desc: "Bidirectional encoder. Masked LM pre-training.", arch: "embed → [self-att + ffn] × N → [CLS] → head" },
    ViT: { desc: "Image patches as tokens. Classification.", arch: "patch-embed → [self-att + ffn] × N → [CLS] → MLP" },
  };

  return (
    <LabWrap title="Transformer Architecture §5.3" color={color}>
      <BtnRow options={["GPT", "BERT", "ViT"]} active={model} onSelect={setModel} color={color} />
      <div style={{ background: "#0a0c10", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontFamily: "monospace", fontSize: 11, color: "#667" }}>
        <div style={{ color, marginBottom: 4 }}>{models[model].desc}</div>
        <div>{models[model].arch}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Slider label="d_model" min={64} max={2048} step={64} val={d} onChange={setD} color={color} />
        <Slider label="Heads H" min={1} max={32} val={heads} onChange={setHeads} color={color} />
        <Slider label="Layers N" min={1} max={96} val={layers} onChange={setLayers} color={color} />
        <Slider label="Seq len T" min={64} max={4096} step={64} val={seqLen} onChange={setSeqLen} color={color} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <StatBox label="Params" val={fmt(params())} color={color} />
        <StatBox label="d/head" val={Math.floor(d / heads)} color={color} />
        <StatBox label="KV-cache" val={kvCache.toFixed(2)} unit="GB" color="#7a7aff" />
        <StatBox label="FLOPs/tok" val={fmt(flops() / seqLen)} color="#ff8844" />
      </div>
    </LabWrap>
  );
}

// ─── LAB: GPU & Batches ────────────────────────────────────────────────────────
function LabGPU({ color }) {
  const [batch, setBatch] = useState(32);
  const [dtype, setDtype] = useState("FP16");
  const [modelM, setModelM] = useState(7);
  const bytesPerParam = { FP32: 4, FP16: 2, INT8: 1, INT4: 0.5 };
  const bpp = bytesPerParam[dtype];
  const modelGB = modelM * 1e9 * bpp / 1e9;
  const activGB = batch * 512 * 1024 * bpp / 1e9; // rough estimate
  const totalGB = modelGB + activGB;
  const rtx4050Limit = 6;
  const fits = totalGB < rtx4050Limit;

  return (
    <LabWrap title="GPU Memory & Batches §2.1" color={color}>
      <Slider label="Batch size B" min={1} max={128} val={batch} onChange={setBatch} color={color} />
      <Slider label="Model size (B params)" min={0.1} max={70} step={0.1} val={modelM} onChange={setModelM} color={color} />
      <BtnRow options={["FP32", "FP16", "INT8", "INT4"]} active={dtype} onSelect={setDtype} color={color} />
      <div style={{ margin: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11, color: "#667", marginBottom: 4 }}>
          <span>VRAM usage</span><span>{totalGB.toFixed(1)} / {rtx4050Limit} GB</span>
        </div>
        <div style={{ height: 16, background: "#111", borderRadius: 6, overflow: "hidden", position: "relative" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (modelGB / rtx4050Limit) * 100)}%`, background: color, transition: "width 0.3s" }} />
          <div style={{ position: "absolute", top: 0, left: `${Math.min(100, (modelGB / rtx4050Limit) * 100)}%`, height: "100%", width: `${Math.min(100 - (modelGB / rtx4050Limit) * 100, (activGB / rtx4050Limit) * 100)}%`, background: "#7a7aff", transition: "all 0.3s" }} />
          <div style={{ position: "absolute", top: 0, left: `${(rtx4050Limit / rtx4050Limit) * 100}%`, transform: "translateX(-50%)", height: "100%", width: 2, background: "#ff4444" }} />
        </div>
        <div style={{ display: "flex", gap: 12, fontFamily: "monospace", fontSize: 9, color: "#445", marginTop: 4 }}>
          <span style={{ color }}>■ Model {modelGB.toFixed(1)}GB</span>
          <span style={{ color: "#7a7aff" }}>■ Activations ~{activGB.toFixed(2)}GB</span>
          <span style={{ color: "#ff4444" }}>| RTX 4050 limit 6GB</span>
        </div>
      </div>
      <div style={{ background: fits ? "#0a1a0a" : "#1a0a0a", border: `1px solid ${fits ? "#44ff8844" : "#ff444444"}`, borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: fits ? "#44ff88" : "#ff6666" }}>
        {fits ? `✓ Fits in RTX 4050 6GB — batch=${batch}` : `✗ OOM — reduce batch, use INT4/INT8, or gradient checkpointing`}
      </div>
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "8px 0 0" }}>
        "A GPU processes a batch that fits in memory almost as quickly as a single sample." — §2.1
      </p>
    </LabWrap>
  );
}

// ─── LAB: Scaling Laws ────────────────────────────────────────────────────────
function LabScaling({ color }) {
  const [tokens, setTokens] = useState(300);
  const models = [
    { name: "GPT", year: 2018, params: 0.117, compute: 1.5 },
    { name: "GPT-2", year: 2019, params: 1.5, compute: 50 },
    { name: "BERT", year: 2018, params: 0.34, compute: 40 },
    { name: "GPT-3", year: 2020, params: 175, compute: 3640 },
    { name: "PaLM", year: 2022, params: 540, compute: 250000 },
  ];
  const loss = p => Math.max(1.8, 4.5 - 0.6 * Math.log10(p * tokens));

  return (
    <LabWrap title="Scaling Laws (Kaplan et al. 2020) §3.7" color={color}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 380 }}>
          {models.map(m => {
            const l = loss(m.params);
            return (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color, minWidth: 55 }}>{m.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#445", minWidth: 36 }}>{m.params}B</span>
                <div style={{ flex: 1, height: 14, background: "#111", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(m.params / 540) * 100}%`, background: `linear-gradient(90deg,${color},${color}66)`, borderRadius: 4, minWidth: 4 }} />
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#ff8844", minWidth: 48 }}>loss≈{l.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <Slider label="Training tokens (B)" min={10} max={2000} step={10} val={tokens} onChange={setTokens} color={color} />
      <div style={{ background: "#0a0c0e", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: "#667", marginTop: 6 }}>
        Chinchilla rule: ~20 tokens per parameter for optimal compute efficiency.<br />
        {Math.round(tokens / 20)}B params optimal for {tokens}B tokens.
      </div>
    </LabWrap>
  );
}

// ─── LAB: Normalization ───────────────────────────────────────────────────────
function LabNorm({ color }) {
  const [mode, setMode] = useState("BatchNorm");
  const [B, setB] = useState(4);
  const [D, setD] = useState(6);
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const cellW = (W - 60) / D, cellH = (H - 40) / B;
    for (let b = 0; b < B; b++) {
      for (let d = 0; d < D; d++) {
        const isBatch = mode === "BatchNorm" ? d === 2 : b === 1;
        ctx.fillStyle = isBatch ? color + "55" : "#1a1f26";
        ctx.fillRect(30 + d * cellW, 20 + b * cellH, cellW - 2, cellH - 2);
        ctx.fillStyle = isBatch ? color : "#445";
        ctx.font = "10px monospace";
        ctx.fillText(`x`, 30 + d * cellW + cellW / 2 - 5, 20 + b * cellH + cellH / 2 + 4);
      }
    }
    for (let d = 0; d < D; d++) { ctx.fillStyle = "#445"; ctx.font = "9px monospace"; ctx.fillText(`d${d + 1}`, 30 + d * cellW + cellW / 2 - 5, 16); }
    for (let b = 0; b < B; b++) { ctx.fillStyle = "#445"; ctx.font = "9px monospace"; ctx.fillText(`b${b + 1}`, 4, 20 + b * cellH + cellH / 2 + 4); }
    ctx.fillStyle = color; ctx.font = "11px monospace";
    const label = mode === "BatchNorm" ? "↕ normalized across batch" : "↔ normalized across features";
    ctx.fillText(label, 30, H - 6);
  }, [mode, B, D]);

  return (
    <LabWrap title="BatchNorm vs LayerNorm §4.6" color={color}>
      <BtnRow options={["BatchNorm", "LayerNorm"]} active={mode} onSelect={setMode} color={color} />
      <canvas ref={ref} style={{ width: "100%", height: 180, display: "block", borderRadius: 8, marginBottom: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Slider label="Batch size B" min={1} max={8} val={B} onChange={setB} color={color} />
        <Slider label="Feature dim D" min={2} max={10} val={D} onChange={setD} color={color} />
      </div>
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "6px 0 0" }}>
        BatchNorm normalizes across the batch dimension (highlighted column). LayerNorm normalizes across features per sample (highlighted row). LN works with batch=1 — essential for Transformers.
      </p>
    </LabWrap>
  );
}

// ─── LAB: CLIP Contrastive ────────────────────────────────────────────────────
function LabCLIP({ color }) {
  const [tau, setTau] = useState(0.07);
  const N = 4;
  const images = ["🐱 cat photo", "🐶 dog photo", "🚗 car photo", "🌊 ocean photo"];
  const texts = ["a photo of a cat", "a cute dog", "sports car", "ocean waves"];
  // Simulated similarity matrix (diagonal = matched pairs)
  const sim = images.map((_, i) => texts.map((_, j) => {
    const base = i === j ? 1.0 : 0.1 + Math.random() * 0.3;
    return base;
  }));
  const softmaxRow = row => { const exps = row.map(v => Math.exp(v / tau)); const s = exps.reduce((a, b) => a + b, 0); return exps.map(e => e / s); };
  const attn = sim.map(softmaxRow);
  const avgDiag = attn.reduce((s, row, i) => s + row[i], 0) / N;

  return (
    <LabWrap title="CLIP Contrastive Training §6.6" color={color}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445", marginBottom: 6, textTransform: "uppercase" }}>Image-Text Similarity Matrix</div>
          {attn.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 3, marginBottom: 3, alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: color, minWidth: 50 }}>{images[i].split(" ")[0]}</span>
              {row.map((v, j) => (
                <div key={j} style={{ flex: 1, height: 22, background: i === j ? color : `rgba(100,100,200,${v * 2})`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "monospace", color: i === j ? "#000" : "#667" }}>
                  {(v * 100).toFixed(0)}%
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445", marginBottom: 6, textTransform: "uppercase" }}>Text labels</div>
          {texts.map((t, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 10, color: "#667", marginBottom: 6, padding: "4px 8px", background: "#0f1115", borderRadius: 4 }}>{t}</div>)}
        </div>
      </div>
      <Slider label="Temperature τ" min={0.01} max={1} step={0.01} val={tau} onChange={setTau} color={color} />
      <div style={{ display: "flex", gap: 8 }}>
        <StatBox label="Avg match prob" val={(avgDiag * 100).toFixed(0)} unit="%" color={color} />
        <StatBox label="Temperature τ" val={tau.toFixed(2)} color={color} />
      </div>
    </LabWrap>
  );
}

// ─── LAB: Diffusion ───────────────────────────────────────────────────────────
function LabDiffusion({ color }) {
  const [diffSteps, setDiffSteps] = useState(1000);
  const [schedule, setSchedule] = useState("cosine");
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07090b"; ctx.fillRect(0, 0, W, H);
    const toX = t => t / diffSteps * (W - 40) + 20;
    const toY = v => H - 20 - v * (H - 30);
    // axes
    ctx.strokeStyle = "#1e222a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(20, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    // ᾱ_t for cosine
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100 * diffSteps;
      const s = 0.008;
      const alpha = schedule === "cosine"
        ? Math.cos((t / diffSteps + s) / (1 + s) * Math.PI / 2) ** 2
        : Math.exp(-0.0001 * t);
      const m = i === 0 ? "moveTo" : "lineTo";
      ctx[m](toX(t), toY(alpha));
    }
    ctx.stroke();
    // linear
    ctx.beginPath(); ctx.strokeStyle = "#4a9aff88"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 100; i++) {
      const t = i / 100 * diffSteps;
      const alpha = 1 - t / diffSteps * 0.9999;
      const m = i === 0 ? "moveTo" : "lineTo";
      ctx[m](toX(t), toY(alpha));
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.font = "11px monospace"; ctx.fillText("ᾱₜ (signal retained)", 30, 18);
    ctx.fillStyle = "#4a9aff88"; ctx.fillText("linear schedule", 30, 34);
    ctx.fillStyle = "#445"; ctx.fillText("t=0 (clean)", 26, H - 4);
    ctx.fillText("t=T (noise)", W - 80, H - 4);
  }, [diffSteps, schedule]);

  return (
    <LabWrap title="Diffusion Noise Schedule §7.2" color={color}>
      <canvas ref={ref} style={{ width: "100%", height: 180, display: "block", borderRadius: 8, marginBottom: 10 }} />
      <BtnRow options={["cosine", "linear"]} active={schedule} onSelect={setSchedule} color={color} />
      <Slider label="T (diffusion steps)" min={100} max={2000} step={100} val={diffSteps} onChange={setDiffSteps} color={color} />
      <p style={{ fontSize: 11, color: "#556", fontFamily: "monospace", margin: "6px 0 0" }}>
        ᾱₜ = product of (1−βₜ). As t→T, signal → pure noise. The model learns to reverse this process.
        Cosine schedule (Ho et al.) degrades signal more gradually than linear.
      </p>
    </LabWrap>
  );
}

// ─── LAB: Quantization & LoRA ─────────────────────────────────────────────────
function LabQuantLoRA({ color }) {
  const [modelB, setModelB] = useState(7);
  const [rank, setRank] = useState(16);
  const [mode, setMode] = useState("Quantization");

  if (mode === "Quantization") {
    const dtypes = [
      { name: "FP32", bpp: 4, color: "#ff6666", note: "Full precision training" },
      { name: "FP16", bpp: 2, color: "#ff8844", note: "Standard inference" },
      { name: "INT8", bpp: 1, color: "#ffbb44", note: "GPTQ / llama.cpp Q8" },
      { name: "Q4_1", bpp: 0.625, color: color, note: "llama.cpp: d,m in FP16 + 4-bit entries" },
      { name: "INT4", bpp: 0.5, color: "#44ffbb", note: "Aggressive — marginal quality loss" },
    ];
    const limit = 6;
    return (
      <LabWrap title="Quantization §8.2" color={color}>
        <BtnRow options={["Quantization", "LoRA"]} active={mode} onSelect={setMode} color={color} />
        <Slider label="Model size (B params)" min={1} max={70} step={0.5} val={modelB} onChange={setModelB} color={color} />
        <div style={{ marginTop: 8 }}>
          {dtypes.map(dt => {
            const gb = modelB * 1e9 * dt.bpp / 1e9;
            const fits = gb < limit;
            return (
              <div key={dt.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: dt.color, minWidth: 40 }}>{dt.name}</span>
                <div style={{ flex: 1, height: 18, background: "#111", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (gb / limit) * 100)}%`, background: dt.color, opacity: 0.7, borderRadius: 4, transition: "width 0.3s" }} />
                  <div style={{ position: "absolute", right: 6, top: 2, fontFamily: "monospace", fontSize: 10, color: "#fff" }}>{gb.toFixed(1)}GB {!fits && "⚠"}</div>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: fits ? "#44ff88" : "#ff4444", minWidth: 16 }}>{fits ? "✓" : "✗"}</span>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid #222", marginTop: 6, paddingTop: 6, fontFamily: "monospace", fontSize: 9, color: "#445" }}>
            Q4_1 detail: 32-entry blocks → 2 FP16 (d,m) + 16 bytes (4-bit entries) = 20 bytes vs 64 bytes (FP16). 3.2× compression.
          </div>
        </div>
      </LabWrap>
    );
  }

  // LoRA view
  const d = 4096;
  const fullParams = d * d;
  const loraParams = 2 * rank * d;
  const ratio = loraParams / fullParams;
  const fullGB = modelB * 1e9 * 2 / 1e9; // FP16
  const loraGB = modelB * 1e9 * 0.5 / 1e9 + loraParams * 4 / 1e9; // INT4 base + FP32 LoRA

  return (
    <LabWrap title="LoRA & QLoRA §8.3" color={color}>
      <BtnRow options={["Quantization", "LoRA"]} active={mode} onSelect={setMode} color={color} />
      <div style={{ background: "#0a0c10", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontFamily: "monospace", fontSize: 12 }}>
        <div style={{ color }}>W' = W + <span style={{ color: "#4a9aff" }}>B</span><span style={{ color: "#ff8844" }}>A</span></div>
        <div style={{ color: "#445", fontSize: 10, marginTop: 4 }}>W ∈ ℝ^(d×d) frozen · A ∈ ℝ^(r×d) · B ∈ ℝ^(d×r) trainable</div>
      </div>
      <Slider label="Model size (B params)" min={1} max={70} step={0.5} val={modelB} onChange={setModelB} color={color} />
      <Slider label="LoRA rank r" min={1} max={64} val={rank} onChange={setRank} color={color} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <StatBox label="LoRA params" val={`${(loraParams / 1e6).toFixed(1)}M`} color={color} />
        <StatBox label="% of full FT" val={(ratio * 100).toFixed(2)} unit="%" color={color} />
        <StatBox label="Full FT VRAM" val={`${fullGB.toFixed(0)}GB`} color="#ff4444" />
        <StatBox label="QLoRA VRAM" val={`${loraGB.toFixed(1)}GB`} color="#44ff88" />
      </div>
    </LabWrap>
  );
}

// ─── LAB: Prompt Engineering & CoT ───────────────────────────────────────────
function LabPrompting({ color }) {
  const [mode, setMode] = useState("Zero-shot");
  const examples = {
    "Zero-shot": {
      prompt: `Q: I prepare 53 pancakes, eat 5 and give 7 to Gina. 
I then prepare 26 more. How many pancakes are left?
A:`,
      response: "67 pancakes are left.",
      correct: false,
      note: "Direct question — model often fails on multi-step arithmetic."
    },
    "Few-shot": {
      prompt: `Q: Gina has 105 beans, gives 23 to Bob, uses 53 in soup. Left?
A: 29 beans. 

Q: I prepare 53 pancakes, eat 5, give 7. Then make 26 more. Left?
A:`,
      response: "67 pancakes are left.",
      correct: false,
      note: "Examples help format but don't guide reasoning steps."
    },
    "Chain-of-Thought": {
      prompt: `Q: Gina has 105 beans, gives 23 to Bob, uses 53 in soup. Left?
A: Step by step: 105 − 23 = 82. 82 − 53 = 29. So 29 beans left.

Q: I prepare 53 pancakes, eat 5, give 7. Then make 26 more. Left?
A:`,
      response: "Step by step: 53 − 5 = 48. 48 − 7 = 41. 41 + 26 = 67. So 67 pancakes left. ✓",
      correct: true,
      note: "CoT forces the model to generate intermediate steps — Wei et al. 2022."
    },
    "RAG": {
      prompt: `[Retrieved context: Today's weather in Paris is sunny, 22°C]

User: What should I wear in Paris today?
Assistant:`,
      response: "Based on today's sunny 22°C weather in Paris, I'd suggest light clothing — a t-shirt and maybe a light jacket for the evening.",
      correct: true,
      note: "Retrieval-Augmented Generation: inject fresh knowledge into the context window."
    },
  };
  const ex = examples[mode];
  return (
    <LabWrap title="Prompt Engineering §8.1" color={color}>
      <BtnRow options={Object.keys(examples)} active={mode} onSelect={setMode} color={color} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445", marginBottom: 4, textTransform: "uppercase" }}>Prompt</div>
          <div style={{ background: "#0a0c10", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: "#667", lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 100 }}>{ex.prompt}</div>
        </div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#445", marginBottom: 4, textTransform: "uppercase" }}>Model Response</div>
          <div style={{ background: ex.correct ? "#0a1a0a" : "#1a0e0a", border: `1px solid ${ex.correct ? "#44ff8844" : "#ff884444"}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: ex.correct ? "#44ff88" : "#ff8844", lineHeight: 1.7, minHeight: 100 }}>{ex.response}</div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#7a7a8a", fontFamily: "monospace", margin: 0 }}>{ex.note}</p>
    </LabWrap>
  );
}

// ─── CHAPTERS DATA ────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: "foundations", title: "Foundations", icon: "🧮", color: "#4fffb0",
    sub: "ML · Computation · Training",
    sections: [
      {
        title: "1.1 Learning from Data",
        concept: "A parametric model f(x;w) maps input x to prediction ŷ. We collect a training set 𝒟 = {(xₙ,yₙ)} and find w* that minimizes a loss ℒ(w). Parameters are often called 'weights' by analogy with synaptic weights.",
        math: "\\hat{y} = f(x; w^*), \\quad w^* = \\arg\\min_w \\mathcal{L}(w)",
        intuition: "The model is just code with dials (w). Training turns those dials until predictions match data. Everything else in deep learning is about making this work at scale.",
        quote: { text: "Most of the content of this book is about the definition of f, which in realistic scenarios is a complex combination of pre-defined sub-modules.", src: "Fleuret §1.1" },
      },
      {
        title: "1.2 Basis Function Regression",
        concept: "Express f as a linear combination of fixed basis functions f₁,...,f_K. Since f(xₙ;w) is linear in w and ℒ is quadratic in f, finding w* reduces to solving a linear system — a closed-form solution exists!",
        math: "f(x;w) = \\sum_{k=1}^K w_k f_k(x), \\quad \\mathcal{L}(w) = \\frac{1}{N}\\sum_n (y_n - f(x_n;w))^2",
        intuition: "Gaussian bumps placed along the x-axis, each scaled by a learned weight. More bumps = more expressive = risk of overfitting. This is the simplest 'neural network' you can train.",
        Lab: LabBasisRegression,
      },
      {
        title: "1.3 Underfitting & Overfitting",
        concept: "Model capacity determines flexibility. Too low → underfitting (high train error). Too high relative to data → overfitting (low train error, high validation error). The art of ML is finding the right inductive bias.",
        math: "\\text{Generalization gap} = \\mathcal{L}_{\\text{val}}(w^*) - \\mathcal{L}_{\\text{train}}(w^*)",
        intuition: "Like memorizing exam answers vs. understanding the subject. A model that memorizes the training set fails on new data. Regularization and more data both help.",
        quote: { text: "A large part of the art of applied machine learning is to design models that are not too flexible yet still able to fit the data.", src: "Fleuret §1.3" },
        Lab: LabOverfitting,
      },
      {
        title: "3.1 Loss Functions",
        concept: "The loss is a proxy for what we truly want to optimize. MSE for regression, cross-entropy for classification (logits → softmax → −log P̂(true class)), contrastive loss for metric learning.",
        math: "\\mathcal{L}_{ce}(w) = -\\frac{1}{N}\\sum_n \\log \\frac{e^{f(x_n;w)_{y_n}}}{\\sum_z e^{f(x_n;w)_z}}",
        intuition: "Cross-entropy punishes confident wrong predictions harshly. It's the log probability assigned to the true class — gradient flows even when the model is slightly wrong.",
        Lab: LabCrossEntropy,
      },
      {
        title: "3.3 Gradient Descent & Adam",
        concept: "No closed form for deep nets. We iteratively subtract a fraction of the gradient: w ← w − η∇ℒ. SGD uses mini-batches. Adam tracks running mean and variance of each gradient component, normalizing them automatically.",
        math: "w_{n+1} = w_n - \\eta \\nabla\\mathcal{L}|_w(w_n)",
        math2: "\\text{Adam: } w \\leftarrow w - \\eta \\frac{\\hat{m}}{\\sqrt{\\hat{v}} + \\epsilon}",
        intuition: "SGD is a blindfolded hiker taking steps downhill. Adam is a hiker with memory — it moves faster in low-gradient directions and slows in erratic ones.",
        Lab: LabGradientDescent,
      },
      {
        title: "3.4 Backpropagation",
        concept: "Chain rule applied to nested functions: the backward pass multiplies gradients by Jacobians, propagating the loss signal back through every layer. The forward pass costs 1×, backward ~2×.",
        math: "\\nabla\\mathcal{\\ell}|_{x^{(d-1)}} = J_{f^{(d)}}|_x^\\top \\cdot \\nabla\\mathcal{\\ell}|_{x^{(d)}}",
        intuition: "Think of each layer as a relay: the backward pass passes a 'blame signal' upstream. Tanh saturates → signal vanishes. Skip connections create gradient highways.",
        quote: { text: "The gradient decreasing exponentially is called the vanishing gradient, and it may make training impossible.", src: "Fleuret §3.4" },
        Lab: LabBackprop,
      },
      {
        title: "3.7 Scaling Laws",
        concept: "Performance improves predictably with compute, data, and model size following power laws (Kaplan et al. 2020). Chinchilla showed optimal training: ~20 tokens per parameter. This insight drives all modern LLM training budgets.",
        math: "\\mathcal{L}(N,D) \\approx \\left(\\frac{N_c}{N}\\right)^{\\alpha_N} + \\left(\\frac{D_c}{D}\\right)^{\\alpha_D} + L_\\infty",
        intuition: "More parameters help, but only if you have enough data. GPT-3 was undertrained by Chinchilla's standards. This is why Llama-7B trained on 1T tokens beats GPT-3 175B on many benchmarks.",
        Lab: LabScaling,
      },
    ]
  },
  {
    id: "computation", title: "Computation", icon: "⚡", color: "#00ffff",
    sub: "GPUs · Tensors · Memory",
    sections: [
      {
        title: "2.1 GPUs & Batches",
        concept: "GPUs have thousands of parallel CUDA cores and their own VRAM. The bottleneck is memory bandwidth, not compute. Processing a batch of B samples costs roughly the same as 1 sample — so maximize batch size.",
        math: "\\text{Throughput} \\propto B, \\quad \\text{Memory} = B \\times T \\times D \\times \\text{bytes/param}",
        intuition: "GPUs are like wide highways — great for parallel traffic (batches), terrible for single cars (batch=1). Memory bandwidth, not FLOPS, is usually the real bottleneck.",
        quote: { text: "A GPU processes a batch that fits in memory almost as quickly as it would process a single sample.", src: "Fleuret §2.1" },
        Lab: LabGPU,
      },
      {
        title: "2.2 Tensors",
        concept: "Tensors are N-dimensional arrays: scalars (0D), vectors (1D), matrices (2D), image batches (4D: B×C×H×W). PyTorch/JAX separate shape from memory layout, making reshape/transpose nearly free — crucial for efficiency.",
        math: "X \\in \\mathbb{R}^{N_1 \\times N_2 \\times \\cdots \\times N_D}, \\quad \\text{e.g. batch of images: } B \\times C \\times H \\times W",
        intuition: "Every operation in a neural net — attention, convolution, normalization — is just tensor algebra. The entire training loop is orchestrated tensor ops, enabling GPU parallelism.",
      },
    ]
  },
  {
    id: "components", title: "Components", icon: "🔧", color: "#7c83fd",
    sub: "Layers · Attention · Norms",
    sections: [
      {
        title: "4.2 Linear Layers",
        concept: "The fully connected (affine) layer computes y = Wx + b. Despite seeming limited to geometric transforms, it computes dot-product similarity scores between input vectors and weight rows — a key operation in attention.",
        math: "y = Wx + b, \\quad W \\in \\mathbb{R}^{D' \\times D}, \\quad b \\in \\mathbb{R}^{D'}",
        intuition: "Every matrix multiplication is asking 'how much does input x match each pattern stored in W?' The output dimension D' is like having D' pattern detectors.",
      },
      {
        title: "4.3 Activation Functions",
        concept: "Without nonlinearities, deep nets collapse to a single linear layer. ReLU (most common), Tanh (classical), GELU (transformers), Leaky ReLU (prevents dead neurons).",
        math: "\\text{ReLU}(x) = \\max(0, x), \\quad \\text{GELU}(x) = x\\,\\Phi(x)",
        intuition: "Activations are the 'creativity' of neural nets. Without them, depth is useless. GELU is favored in transformers because it's smooth and slightly stochastic-like.",
        Lab: LabActivations,
      },
      {
        title: "4.5 Dropout",
        concept: "During training, randomly zero out activations with probability p and rescale by 1/(1-p). Disabled at test time. Forces the network to learn redundant representations — a form of implicit ensemble.",
        math: "y_i = \\frac{1}{1-p} \\cdot m_i \\cdot x_i, \\quad m_i \\sim \\text{Bernoulli}(1-p)",
        intuition: "Like studying with earplugs — you can't rely on one sense, so you learn them all. For 2D signals, drop entire channels (not individual pixels) since neighbors can reconstruct single values.",
      },
      {
        title: "4.6 Normalizing Layers",
        concept: "BatchNorm normalizes across the batch dimension (requires large batches). LayerNorm normalizes across the feature dimension per sample (works with batch=1 — essential for Transformers).",
        math: "\\text{BN: } z_{b,d} = \\frac{x_{b,d}-\\hat{m}_d}{\\sqrt{\\hat{v}_d+\\epsilon}}, \\quad \\text{LN: } z_{b,d} = \\frac{x_{b,d}-\\hat{m}_b}{\\sqrt{\\hat{v}_b+\\epsilon}}",
        intuition: "Normalization is a 'reset button' — it prevents early layers from inadvertently scaling later layers. BN has a regularization effect as a bonus.",
        Lab: LabNorm,
      },
      {
        title: "4.7 Skip Connections",
        concept: "Transport the signal unchanged across multiple layers: y = f(x) + x. This creates direct gradient highways, preventing vanishing gradients. Makes training hundreds of layers feasible (ResNet, Transformer).",
        math: "y^{(d)} = f^{(d)}(x^{(d-1)}) + x^{(d-1)}",
        intuition: "It's easier to learn a small correction (residual) than a full transformation. If f learns zero, the layer just passes the signal through — a safe initialization.",
      },
      {
        title: "4.8 Multi-Head Attention",
        concept: "For each query Qq, compute dot-product similarity against all keys Kk, normalize with softmax, then aggregate values Vk by those scores. H heads run in parallel, each attending to different aspects.",
        math: "A_{q,k} = \\text{softmax}\\!\\left(\\frac{Q_q \\cdot K_k}{\\sqrt{D_{QK}}}\\right), \\quad Y_q = \\sum_k A_{q,k}\\, V_k",
        intuition: "Each head is a soft lookup: 'which other tokens are most relevant to me?' Multiple heads capture different types of relationships (syntactic, semantic, positional).",
        Lab: LabAttention,
      },
      {
        title: "4.10 Positional Encoding",
        concept: "Attention is permutation-equivariant — it ignores position. Sinusoidal positional encodings inject position info at different frequencies, letting the model distinguish 'the cat sat' from 'sat the cat'.",
        math: "\\text{PE}[t,d] = \\begin{cases}\\sin\\!\\left(\\frac{t}{10^{4d/D}}\\right) & d \\text{ even}\\\\ \\cos\\!\\left(\\frac{t}{10^{4(d-1)/D}}\\right) & d \\text{ odd}\\end{cases}",
        intuition: "Different frequencies = different clocks. Low frequencies encode absolute position (slow-changing), high frequencies encode local offsets (fast-changing). The model can attend to 'words 3 apart' via learned attention patterns.",
        Lab: LabPositionalEncoding,
      },
    ]
  },
  {
    id: "architectures", title: "Architectures", icon: "🏗", color: "#a855f7",
    sub: "MLPs · CNNs · Transformers",
    sections: [
      {
        title: "5.1 Multi-Layer Perceptrons",
        concept: "Alternating fully connected layers and activations. Universal approximation theorem (Cybenko 1989): a single hidden layer MLP can approximate any continuous function on a compact domain — if width is unbounded.",
        math: "f = \\ell_2 \\circ \\sigma \\circ \\ell_1 \\circ \\sigma \\circ \\cdots",
        intuition: "The universal approx theorem is often misunderstood — it says you *can* represent anything, not that gradient descent will *find* it. Depth helps learning, not just representational power.",
      },
      {
        title: "5.2 Convolutional Networks",
        concept: "Conv layers apply the same small filter everywhere (translation equivariance). ResNets (He et al. 2015) add residual connections between bottleneck blocks. LeNet → AlexNet → VGG → ResNet-50 (25M params, 49 GFLOP).",
        math: "Y[d', h, w] = \\sum_{d,k,l} X[d, h{+}k, w{+}l] \\cdot W[d', d, k, l] + b[d']",
        intuition: "Local feature detectors → combination detectors → semantic detectors. Each layer doubles channels and halves spatial size. The receptive field grows with depth.",
      },
      {
        title: "5.3 Transformers (GPT / BERT / ViT)",
        concept: "Stacked self-attention + feedforward blocks. GPT: causal decoder (next-token prediction). BERT: bidirectional encoder (masked LM). ViT: split image into 16×16 patches treated as tokens.",
        math: "\\text{Transformer block: } y = x + \\text{FFN}(\\text{LayerNorm}(x + \\text{MHA}(\\text{LayerNorm}(x))))",
        intuition: "The transformer is brutally simple: attention is a soft dictionary lookup, FFN is a memory bank. The magic is that scaling this simple recipe to billions of parameters + trillions of tokens works extraordinarily well.",
        Lab: LabTransformer,
      },
    ]
  },
  {
    id: "applications", title: "Applications", icon: "🌍", color: "#00d4ff",
    sub: "Vision · Language · Multimodal",
    sections: [
      {
        title: "6.2 Image Classification",
        concept: "Input image → CNN/ViT → logits → softmax → cross-entropy loss. ResNets pre-trained on ImageNet (1.2M images, 1000 classes) are fine-tuned for most vision tasks. Data augmentation is essential.",
        math: "\\hat{y} = \\arg\\max_c f(x;w)_c, \\quad \\mathcal{L} = \\mathcal{L}_{ce}(f(x;w), y)",
        intuition: "ImageNet pre-training gives 'visual concepts for free'. The same ResNet backbone powers object detection, segmentation, and medical imaging with minimal fine-tuning.",
      },
      {
        title: "6.6 CLIP — Text-Image Matching",
        concept: "Train image encoder f (ViT) and text encoder g (GPT) jointly on 400M image-text pairs. The N×N similarity matrix is trained to be diagonal. Enables zero-shot classification by comparing image to text descriptions.",
        math: "\\ell_{m,n} = f(i_m) \\cdot g(t_n), \\quad \\mathcal{L} = \\text{cross-entropy on diagonal}",
        intuition: "CLIP is the bridge between vision and language. Instead of discrete labels, it learns a joint embedding space. 'A photo of a dog' is closer to dog images than 'A photo of a cat' — without ever being trained on the task.",
        Lab: LabCLIP,
      },
      {
        title: "7.1 Text Generation (LLMs)",
        concept: "GPT-style autoregressive generation: predict next token from all previous tokens. GPT-3 = 175B params, 96 layers, 96 heads, d=12288. Fine-tuning with RLHF aligns raw next-token predictors to helpful assistants.",
        math: "P(X_1,...,X_T) = \\prod_{t=1}^T P(X_t | X_1,...,X_{t-1})",
        intuition: "A language model is a probability distribution over text. Generating a sentence is repeated sampling from this distribution. RLHF trains a reward model from human preferences, then uses RL to maximize expected reward.",
        Lab: LabPrompting,
      },
      {
        title: "7.2 Diffusion Models",
        concept: "Gradually corrupt an image with noise (forward process), then train a denoiser to reverse it. Sampling = start from Gaussian noise, apply learned denoiser T times. The cosine schedule degrades signal more gently.",
        math: "q(x_t|x_0) = \\mathcal{N}(\\sqrt{\\bar{\\alpha}_t}\\,x_0,\\,(1-\\bar{\\alpha}_t)I)",
        intuition: "Diffusion models are like a sculptor who starts with a marble block (noise) and gradually chips away to reveal the image. The denoiser learns 'what usually comes next when de-noising this blurry thing'.",
        Lab: LabDiffusion,
      },
    ]
  },
  {
    id: "compute", title: "Compute Edge", icon: "🔬", color: "#ff69b4",
    sub: "Quantization · LoRA · Prompting",
    sections: [
      {
        title: "8.1 Prompt Engineering",
        concept: "Craft the input to bias the autoregressive process without touching weights. Zero-shot = direct question. Few-shot = examples in context. Chain-of-Thought = force intermediate reasoning steps. RAG = inject retrieved knowledge.",
        math: "P(Y|X) \\approx P(Y|\\text{prompt}(X, \\text{examples}), \\theta)",
        intuition: "The prompt is the cheapest possible way to adapt an LLM. CoT works because intermediate steps are independently more likely to be correct — the model has seen more step-by-step reasoning than direct answers.",
        Lab: LabPrompting,
      },
      {
        title: "8.2 Quantization",
        concept: "Store weights in fewer bits: FP32→FP16→INT8→INT4. During inference, averaging effect mitigates precision loss. Q4_1 (llama.cpp): blocks of 32 entries → scale d + bias m in FP16 + 4-bit entries = 20 bytes vs 64 bytes.",
        math: "\\tilde{x} = d \\cdot q + m, \\quad q \\in \\{0,...,2^b-1\\}, \\quad \\text{Q4\\_1: 20B vs 64B per block}",
        intuition: "LLM inference is memory-bandwidth bound, not compute-bound. Halving bits → 2× throughput and 2× context length for the same VRAM. Quality degrades gracefully — INT4 is often indistinguishable from FP16.",
        Lab: LabQuantLoRA,
      },
      {
        title: "8.3 LoRA & QLoRA",
        concept: "Instead of full fine-tuning (update all W), add low-rank correction matrices: W' = W + BA. Rank r=16 reduces trainable params from d² to 2rd — typically 0.1% of model. QLoRA = INT4 frozen base + FP16 LoRA adapters.",
        math: "W' = W + BA, \\quad B \\in \\mathbb{R}^{d \\times r},\\; A \\in \\mathbb{R}^{r \\times d},\\; r \\ll d",
        intuition: "Fine-tuning is mostly redundant. Low-rank hypothesis: important adaptations live in a low-dimensional subspace. QLoRA makes it possible to fine-tune a 7B model on an RTX 4050 6GB.",
        Lab: LabQuantLoRA,
      },
    ]
  },
];

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ section, color, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8, borderRadius: 12, overflow: "hidden", border: `1px solid ${open ? color + "44" : "#161a20"}`, transition: "border 0.3s" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", textAlign: "left", padding: "13px 16px",
        background: open ? `linear-gradient(90deg,${color}10,transparent)` : "#0c0e12",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ color, fontFamily: "monospace", fontSize: 10, minWidth: 28, background: color + "15", padding: "2px 6px", borderRadius: 4 }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: open ? "#fff" : "#b0b8c4", fontSize: 13, fontWeight: 500, flex: 1 }}>{section.title}</span>
        {section.Lab && <span style={{ fontFamily: "monospace", fontSize: 9, color: color + "88", background: color + "15", padding: "2px 8px", borderRadius: 10 }}>⚗ lab</span>}
        <span style={{ color, fontSize: 16, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.25s" }}>›</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 18px", background: "#080a0d" }}>
          <div style={{ paddingTop: 12 }}>
            {/* Concept */}
            <div style={{ background: "#0c0e14", border: `1px solid ${color}18`, borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#b0b8c4", lineHeight: 1.85, fontFamily: "Georgia, serif" }}>
              {section.concept}
            </div>
            {/* Math */}
            <div style={{ background: "#080e0a", border: "1px solid #0e1e0e", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#3a7a4a", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>The Math</div>
              <div style={{ overflowX: "auto", textAlign: "center" }}>
                <MathEq tex={section.math} display />
                {section.math2 && <div style={{ marginTop: 8 }}><MathEq tex={section.math2} display /></div>}
              </div>
            </div>
            {/* Intuition */}
            {section.intuition && (
              <div style={{ background: "#100d00", border: "1px solid #1e1800", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#8a6820", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>💡 Intuition</div>
                <p style={{ fontSize: 12, color: "#c0a860", lineHeight: 1.75, margin: 0, fontFamily: "Georgia, serif" }}>{section.intuition}</p>
              </div>
            )}
            {/* Quote */}
            {section.quote && <Quote text={section.quote.text} source={section.quote.src} color={color} />}
            {/* Lab */}
            {section.Lab && <section.Lab color={color} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AILandscape() {
  const [ch, setCh] = useState(0);
  const chapter = CHAPTERS[ch];

  return (
    <div style={{ minHeight: "100vh", background: "#060709", color: "#d0d4de", fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#0d0f15,#060709)", borderBottom: "1px solid #10141c", padding: "26px 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(79,255,176,0.05),transparent)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.3em", color: "#2a3040", marginBottom: 6, textTransform: "uppercase" }}>
            Based on "The Little Book of Deep Learning" · François Fleuret, U. Geneva
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(26px,5vw,48px)", fontWeight: 900, margin: 0, background: "linear-gradient(135deg,#ffffff,#556688)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.05 }}>
            The AI Landscape
          </h1>
          <p style={{ color: "#2a3548", margin: "6px 0 0", fontSize: 11, fontFamily: "monospace" }}>
            Basis regression → Backprop → Attention → Transformers → Diffusion → QLoRA · Rendered math + interactive labs
          </p>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div style={{ background: "#060709", borderBottom: "1px solid #0e1018", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", overflowX: "auto", padding: "0 8px" }}>
          {CHAPTERS.map((c, i) => (
            <button key={c.id} onClick={() => setCh(i)} style={{
              padding: "12px 14px", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 11, fontWeight: 600,
              background: ch === i ? `linear-gradient(180deg,${c.color}14,transparent)` : "transparent",
              color: ch === i ? c.color : "#3a4050",
              borderBottom: ch === i ? `2px solid ${c.color}` : "2px solid transparent",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6
            }}>
              <span>{c.icon}</span><span>{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "18px 12px 60px" }}>
        <div style={{ background: "#0a0b0f", borderRadius: 14, border: `1px solid ${chapter.color}18`, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "18px 20px 14px", background: `linear-gradient(135deg,${chapter.color}0c,transparent)`, borderBottom: `1px solid ${chapter.color}14`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 36 }}>{chapter.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: chapter.color, fontFamily: "Georgia,serif", fontWeight: 700 }}>{chapter.title}</h2>
              <p style={{ margin: "3px 0 0", color: "#2a3548", fontSize: 10, fontFamily: "monospace" }}>{chapter.sub} · {chapter.sections.length} topics</p>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            {chapter.sections.map((sec, i) => <SectionCard key={sec.title} section={sec} color={chapter.color} index={i} />)}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setCh(Math.max(0, ch - 1))} disabled={ch === 0} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #1e2228", borderRadius: 8, color: ch === 0 ? "#222" : "#778", fontFamily: "monospace", fontSize: 11, cursor: ch === 0 ? "not-allowed" : "pointer" }}>← Prev</button>
          <div style={{ display: "flex", gap: 8 }}>
            {CHAPTERS.map((c, i) => (
              <button key={i} onClick={() => setCh(i)} style={{ width: 10, height: 10, borderRadius: "50%", background: ch === i ? c.color : "#1a1f26", border: "none", cursor: "pointer", transition: "background 0.25s", padding: 0 }} />
            ))}
          </div>
          <button onClick={() => setCh(Math.min(CHAPTERS.length - 1, ch + 1))} disabled={ch === CHAPTERS.length - 1} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #1e2228", borderRadius: 8, color: ch === CHAPTERS.length - 1 ? "#222" : "#778", fontFamily: "monospace", fontSize: 11, cursor: ch === CHAPTERS.length - 1 ? "not-allowed" : "pointer" }}>Next →</button>
        </div>
      </div>
    </div>
  );
}