const svg = document.getElementById("map");
const NS = "http://www.w3.org/2000/svg";
let mode = "day";
let focusedLine = null;

// How names break onto multiple lines on the map (dropdowns use the plain name).
const MULTILINE = {
  westoakland: ["West", "Oakland"],
  sfo: ["San Francisco", "International Airport (SFO)"],
  oak: ["Oakland", "International", "Airport (OAK)"],
  northconcord: ["North Concord/", "Martinez"],
  pittsburgbp: ["Pittsburg/", "Bay Point"],
  pittsburgcenter: ["Pittsburg", "Center"],
  castrovalley: ["Castro", "Valley"],
  westdublin: ["West Dublin/", "Pleasanton"]
};

const el = (tag, attrs = {}, parent = svg) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent.appendChild(n);
  return n;
};
const activeLines = () => SERVICE[mode].lines.map(id => ({ id, ...LINES[id] }));

// ---------- Geometry: offset each line sideways so shared track shows parallel lines ----------
function offsetPoints(line) {
  const P = line.path.map(id => STATIONS[id]);
  const slot = i => line.slots[P[i].g] ?? 0;
  const normal = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  };
  return P.map((p, i) => {
    const n1 = i > 0 ? normal(P[i - 1], p) : null;
    const n2 = i < P.length - 1 ? normal(p, P[i + 1]) : null;
    let m = n1 && n2 ? { x: n1.x + n2.x, y: n1.y + n2.y } : (n1 || n2);
    const len = Math.hypot(m.x, m.y);
    m = len < 1e-6 ? (n1 || n2) : { x: m.x / len, y: m.y / len };
    const ref = n1 || n2;
    const k = slot(i) / Math.max(0.35, m.x * ref.x + m.y * ref.y);
    return { x: p.x + m.x * k, y: p.y + m.y * k };
  });
}

// ---------- Static background ----------
function drawBackground() {
  // Pacific Ocean and San Francisco Bay (simplified shorelines)
  el("path", { class: "water", d: "M0,170 C60,220 110,280 118,340 C104,420 96,520 92,640 C92,760 104,880 120,1008 L0,1008 Z" });
  el("path", { class: "water", d:
    "M150,0 L470,0 C480,30 470,55 420,70 C370,85 330,100 320,130 C340,170 380,215 420,250 " +
    "C450,290 462,330 468,372 C470,392 476,400 490,410 C520,445 560,490 610,545 C660,600 720,660 770,720 " +
    "C805,770 818,815 806,850 C780,870 740,860 700,842 C640,825 580,815 520,800 C470,780 440,750 420,705 " +
    "C395,660 370,620 350,580 C335,540 330,500 335,455 C338,420 330,395 300,380 C250,360 190,350 140,345 " +
    "C150,320 185,300 200,270 C220,220 235,170 220,120 C205,80 175,40 150,0 Z" });

  // Neighboring rail (Caltrain, Capitol Corridor), muted like the original
  el("path", { class: "rail", d: "M340,500 C350,600 380,700 430,780 C500,860 600,900 720,915" });
  el("path", { class: "rail", d: "M560,40 L470,60 C480,200 470,330 478,420 C560,520 680,640 760,700 L900,780" });

  for (const [t, x, y] of [["SAN FRANCISCO", 145, 388], ["OAKLAND", 586, 398], ["EAST BAY", 683, 276], ["PENINSULA", 361, 855], ["SAN JOSÉ", 980, 898]])
    el("text", { class: "region", x, y }).textContent = t;
}

// ---------- Lines + stations ----------
let layer;
function drawNetwork() {
  layer?.remove();
  layer = el("g", { id: "network" });
  const lines = activeLines();
  const at = {}; // station id -> offset points of every active line serving it

  // OAK connector first so it sits under the main lines
  for (const line of [...lines].sort((a, b) => (a.id === "oak" ? -1 : b.id === "oak" ? 1 : 0))) {
    const pts = offsetPoints(line);
    const poly = el("polyline", { class: "line-path", stroke: line.color, "data-line": line.id,
      points: pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") }, layer);
    poly.addEventListener("click", () => focusLine(focusedLine === line.id ? null : line.id));
    line.path.forEach((id, i) => { if (!STATIONS[id].wp) (at[id] ||= []).push(pts[i]); });
  }

  for (const [id, pts] of Object.entries(at)) {
    const s = STATIONS[id];
    const g = el("g", { class: "station", "data-id": id }, layer);
    let a = pts[0], b = pts[0], best = 0;
    for (const p of pts) for (const q of pts) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d > best) { best = d; a = p; b = q; }
    }
    for (const cls of ["halo", "fill"]) el("line", { class: cls, x1: a.x, y1: a.y, x2: b.x + 0.01, y2: b.y }, g);

    const minX = Math.min(a.x, b.x) - 6, maxX = Math.max(a.x, b.x) + 6;
    const minY = Math.min(a.y, b.y) - 6, maxY = Math.max(a.y, b.y) + 6;
    const cy = (a.y + b.y) / 2, cx = (a.x + b.x) / 2;
    const rows = MULTILINE[id] || [s.name];
    const lh = s.bold ? 18 : 15.5;
    let x, y0, anchor;
    const gap = s.gap || 0;
    if (s.label === "L") { x = minX - 6 - gap; anchor = "end"; y0 = cy + 5 - (rows.length - 1) * lh / 2; }
    else if (s.label === "R") { x = maxX + 6; anchor = "start"; y0 = cy + 5 - (rows.length - 1) * lh / 2; }
    else if (s.label === "TL") { x = maxX + 4; anchor = "end"; y0 = minY - 6 - (rows.length - 1) * lh; }
    else if (s.label === "T") { x = cx; anchor = "middle"; y0 = minY - 6 - (rows.length - 1) * lh; }
    else { x = cx; anchor = "middle"; y0 = maxY + 14; }
    rows.forEach((r, i) => {
      const t = el("text", { x, y: y0 + i * lh, "text-anchor": anchor, class: s.bold ? "bold" : "" }, g);
      t.textContent = r;
    });
    if (s.note) {
      const nameBox = g.querySelector("text").getBBox();
      const t = el("text", { x: nameBox.x + nameBox.width + 6, y: y0, class: "note" }, g);
      t.textContent = s.note.toUpperCase();
    }
    g.addEventListener("click", () => pickStation(id));
  }
}

// ---------- Legend, same layout as the official map ----------
let legendLayer;
function drawLegend() {
  legendLayer?.remove();
  legendLayer = el("g", { class: "legend" });
  const X = 842, W = 262;
  let y = 196;
  for (const key of ["day", "night"]) {
    const svc = SERVICE[key];
    const rows = svc.lines.map(id => ({ id, ...LINES[id] }));
    const h = 26 + (rows.length + (svc.gone?.length || 0)) * 18 + 8;
    const box = el("g", { class: "mode" + (mode === key ? "" : " off") }, legendLayer);
    el("rect", { class: "box", x: X, y, width: W, height: h }, box);
    el("rect", { class: "head", x: X, y, width: W, height: 26 }, box);
    const ht = el("text", { class: "htext", x: X + 9, y: y + 17 }, box);
    ht.innerHTML = `${svc.title} <tspan>(${svc.sub})</tspan>`;
    box.querySelector(".head").addEventListener("click", () => setMode(key));
    ht.addEventListener("click", () => setMode(key));
    if (mode !== key) box.addEventListener("click", () => setMode(key));

    let ry = y + 32;
    for (const line of rows) {
      const r = el("g", { class: "row" + (focusedLine === line.id ? " on" : "") }, box);
      el("rect", { class: "bg", x: X + 4, y: ry - 2, width: W - 8, height: 17, fill: "transparent" }, r);
      badge(r, X + 12, ry, line.color, line.letter);
      el("text", { x: X + 32, y: ry + 10, "font-weight": 700 }, r).textContent = line.name;
      el("text", { x: X + 96, y: ry + 10, "font-size": 8.5 }, r).textContent = line.ends;
      if (mode === key) r.addEventListener("click", e => { e.stopPropagation(); focusLine(focusedLine === line.id ? null : line.id); });
      ry += 18;
    }
    for (const [id, name, a, b] of svc.gone || []) {
      const r = el("g", { opacity: 0.6 }, box);
      badge(r, X + 12, ry, LINES[id].color, LINES[id].letter, 0.5);
      el("text", { x: X + 32, y: ry + 10, "font-weight": 700, "font-size": 8 }, r).textContent = name;
      el("text", { x: X + 96, y: ry + 10, "font-size": 8 }, r).textContent = "No Service - Use";
      badge(r, X + 172, ry + 1, LINES.orange.color, a, 0.85);
      badge(r, X + 186, ry + 1, LINES[b === "Y" ? "yellow" : "blue"].color, b, 0.85);
      ry += 18;
    }
    y += h + 14;
  }
}
function badge(parent, x, y, color, letter, scale = 1) {
  const s = 13 * scale;
  const g = el("g", { class: "badge" }, parent);
  el("rect", { x, y, width: s, height: s, fill: color, rx: 1.5 }, g);
  const t = el("text", { x: x + s / 2, y: y + s * 0.74, "text-anchor": "middle", "font-size": 9 * scale }, g);
  t.textContent = letter;
  if (color === LINES.yellow.color) t.setAttribute("style", "fill:#231f20");
}

// ---------- Spotlight a line ----------
function focusLine(id) {
  focusedLine = id;
  clearTrip(false);
  svg.classList.toggle("focus", !!id);
  if (id) {
    svg.querySelectorAll(`[data-line="${id}"]`).forEach(p => p.classList.add("hl"));
    LINES[id].path.forEach(s => svg.querySelector(`.station[data-id="${s}"]`)?.classList.add("hl"));
  }
  drawLegend();
}

// ---------- Trip planner: fewest stops, with a penalty for each transfer ----------
const TIMED = new Set(["macarthur", "19th"]); // timed cross-platform transfers
function buildGraph() {
  const g = {};
  for (const line of activeLines()) {
    const real = line.path.filter(id => !STATIONS[id].wp);
    real.forEach((s, i) => {
      const n = real[i + 1];
      if (!n) return;
      (g[s] ||= []).push({ to: n, line: line.id });
      (g[n] ||= []).push({ to: s, line: line.id });
    });
  }
  return g;
}
function findRoute(from, to) {
  const g = buildGraph(), key = (s, l) => s + "|" + l;
  const dist = { [key(from, null)]: 0 }, prev = {};
  const q = [{ s: from, l: null, c: 0 }];
  while (q.length) {
    q.sort((a, b) => a.c - b.c);
    const cur = q.shift();
    if (cur.s === to) {
      const out = [];
      for (let k = key(cur.s, cur.l); k; k = prev[k]) {
        const [s, l] = k.split("|");
        out.unshift({ s, l: l === "null" ? null : l });
      }
      return out;
    }
    for (const e of g[cur.s] || []) {
      const c = cur.c + 1 + (cur.l && cur.l !== e.line ? (TIMED.has(cur.s) ? 3 : 4) : 0), k = key(e.to, e.line);
      if (dist[k] === undefined || c < dist[k]) { dist[k] = c; prev[k] = key(cur.s, cur.l); q.push({ s: e.to, l: e.line, c }); }
    }
  }
  return null;
}
const plainName = id => STATIONS[id].short || STATIONS[id].name;

function showTrip() {
  const from = fromSel.value, to = toSel.value, out = document.getElementById("trip");
  svg.querySelectorAll(".route-path").forEach(n => n.remove());
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  if (!from || !to || from === to) { out.innerHTML = ""; if (!focusedLine) svg.classList.remove("focus"); return; }
  focusedLine = null; drawLegend();

  const route = findRoute(from, to);
  if (!route) { out.innerHTML = `<span class="muted">No route during ${SERVICE[mode].title.toLowerCase()}.</span>`; return; }
  svg.classList.add("focus");
  const used = [...new Set(route.map(r => r.l).filter(Boolean))];
  used.forEach(id => svg.querySelectorAll(`[data-line="${id}"]`).forEach(p => p.classList.add("hl")));
  route.forEach(r => svg.querySelector(`.station[data-id="${r.s}"]`)?.classList.add("hl"));

  // Draw the dotted route along the real track, including bends.
  const pts = [];
  route.forEach((r, i) => {
    if (i === 0) { pts.push(STATIONS[r.s]); return; }
    const path = LINES[r.l].path, a = path.indexOf(route[i - 1].s), b = path.indexOf(r.s);
    const step = a < b ? 1 : -1;
    for (let j = a + step; j !== b + step; j += step) pts.push(STATIONS[path[j]]);
  });
  el("polyline", { class: "route-path", points: pts.map(p => `${p.x},${p.y}`).join(" ") }, layer);

  const legs = [];
  route.slice(1).forEach((r, i) => {
    const last = legs[legs.length - 1];
    if (last && last.line === r.l) { last.end = r.s; last.stops++; }
    else legs.push({ line: r.l, start: route[i].s, end: r.s, stops: 1 });
  });
  out.innerHTML = legs.map(l => `<div class="leg"><span class="dot" style="background:${LINES[l.line].color}"></span>
    <span><b>${LINES[l.line].name}</b><br>${plainName(l.start)} to ${plainName(l.end)} · ${l.stops} stop${l.stops > 1 ? "s" : ""}</span></div>`).join("")
    + `<div class="muted">${legs.length - 1 === 0 ? "No transfers" : legs.length - 1 + " transfer" + (legs.length > 2 ? "s" : "")}</div>`;
}
function pickStation(id) {
  if (!fromSel.value || toSel.value) { fromSel.value = id; toSel.value = ""; }
  else toSel.value = id;
  showTrip();
}
function clearTrip(full = true) {
  fromSel.value = ""; toSel.value = "";
  document.getElementById("trip").innerHTML = "";
  svg.querySelectorAll(".route-path").forEach(n => n.remove());
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  if (full) svg.classList.remove("focus");
}

function setMode(m) {
  if (m === mode) return;
  mode = m; focusedLine = null;
  const keepFrom = fromSel.value, keepTo = toSel.value;
  drawNetwork(); drawLegend();
  fromSel.value = keepFrom; toSel.value = keepTo;
  svg.classList.remove("focus");
  showTrip();
}

// ---------- Setup ----------
const fromSel = document.getElementById("from"), toSel = document.getElementById("to");
const opts = `<option value="">Select a station</option>` + Object.entries(STATIONS).filter(([, s]) => !s.wp)
  .sort((a, b) => plainName(a[0]).localeCompare(plainName(b[0])))
  .map(([id]) => `<option value="${id}">${plainName(id)}</option>`).join("");
fromSel.innerHTML = toSel.innerHTML = opts;
fromSel.onchange = toSel.onchange = showTrip;
document.getElementById("clear").onclick = () => { focusedLine = null; clearTrip(); drawLegend(); };

const hour = new Date().getHours();
mode = hour >= 21 || hour < 4 ? "night" : "day";
drawBackground(); drawNetwork(); drawLegend();
