const svg = document.getElementById("map");
const panel = document.getElementById("panel");
const sheet = document.getElementById("sheet");
const NS = "http://www.w3.org/2000/svg";

// BART's public API key (published by BART for open use). Swap in your own from api.bart.gov.
const BART_KEY = "MW9S-E7SL-26DU-VV8V";
const API = "https://api.bart.gov/api";

let mode = "day";
let tab = "station";
let focusedLine = null;
let selected = null;

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
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const activeLines = () => SERVICE[mode].lines.map(id => ({ id, ...LINES[id] }));
const linesAt = id => activeLines().filter(l => l.path.includes(id));
const isSmall = () => matchMedia("(max-width: 1099px)").matches;

// ======================= Map drawing =======================
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

function drawBackground() {
  el("path", { class: "water", d: "M0,170 C60,220 110,280 118,340 C104,420 96,520 92,640 C92,760 104,880 120,1008 L0,1008 Z" });
  el("path", { class: "water", d:
    "M150,0 L470,0 C480,30 470,55 420,70 C370,85 330,100 320,130 C340,170 380,215 420,250 " +
    "C450,290 462,330 468,372 C470,392 476,400 490,410 C520,445 560,490 610,545 C660,600 720,660 770,720 " +
    "C805,770 818,815 806,850 C780,870 740,860 700,842 C640,825 580,815 520,800 C470,780 440,750 420,705 " +
    "C395,660 370,620 350,580 C335,540 330,500 335,455 C338,420 330,395 300,380 C250,360 190,350 140,345 " +
    "C150,320 185,300 200,270 C220,220 235,170 220,120 C205,80 175,40 150,0 Z" });
  el("path", { class: "rail", d: "M340,500 C350,600 380,700 430,780 C500,860 600,900 720,915" });
  el("path", { class: "rail", d: "M560,40 L470,60 C480,200 470,330 478,420 C560,520 680,640 760,700 L900,780" });
  for (const [t, x, y] of [["SAN FRANCISCO", 145, 388], ["OAKLAND", 586, 398], ["EAST BAY", 683, 276], ["PENINSULA", 361, 855], ["SAN JOSÉ", 980, 898]])
    el("text", { class: "region", x, y }).textContent = t;
}

let layer, hitLayer;
function drawNetwork() {
  layer?.remove();
  hitLayer?.remove();
  layer = el("g", { id: "network" });
  hitLayer = el("g", { id: "station-hits" }); // invisible tap targets kept above the mini trains
  const lines = activeLines();
  const at = {};

  for (const line of [...lines].sort((a, b) => (a.id === "oak" ? -1 : b.id === "oak" ? 1 : 0))) {
    const pts = offsetPoints(line);
    const poly = el("polyline", { class: "line-path", stroke: line.color, "data-line": line.id,
      points: pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") }, layer);
    poly.addEventListener("click", () => focusLine(focusedLine === line.id ? null : line.id));
    line.path.forEach((id, i) => { if (!STATIONS[id].wp) (at[id] ||= []).push(pts[i]); });
  }

  for (const [id, pts] of Object.entries(at)) {
    const s = STATIONS[id];
    const g = el("g", { class: "station" + (selected === id ? " selected" : ""), "data-id": id }, layer);
    let a = pts[0], b = pts[0], best = 0;
    for (const p of pts) for (const q of pts) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d > best) { best = d; a = p; b = q; }
    }
    for (const cls of ["halo", "fill"]) el("line", { class: cls, x1: a.x, y1: a.y, x2: b.x + 0.01, y2: b.y }, g);
    const hit = el("line", { class: "hit", x1: a.x, y1: a.y, x2: b.x + 0.01, y2: b.y, "data-id": id }, hitLayer);
    hit.addEventListener("mouseenter", () => g.classList.add("hover"));
    hit.addEventListener("mouseleave", () => g.classList.remove("hover"));

    const minX = Math.min(a.x, b.x) - 6, maxX = Math.max(a.x, b.x) + 6;
    const minY = Math.min(a.y, b.y) - 6, maxY = Math.max(a.y, b.y) + 6;
    const cy = (a.y + b.y) / 2, cx = (a.x + b.x) / 2;
    const rows = MULTILINE[id] || [s.name];
    const lh = s.bold ? 18 : 15.5, gap = s.gap || 0;
    let x, y0, anchor;
    if (s.label === "L") { x = minX - 6 - gap; anchor = "end"; y0 = cy + 5 - (rows.length - 1) * lh / 2; }
    else if (s.label === "R") { x = maxX + 6; anchor = "start"; y0 = cy + 5 - (rows.length - 1) * lh / 2; }
    else if (s.label === "TL") { x = maxX + 4; anchor = "end"; y0 = minY - 6 - (rows.length - 1) * lh; }
    else if (s.label === "T") { x = cx; anchor = "middle"; y0 = minY - 6 - (rows.length - 1) * lh; }
    else { x = cx; anchor = "middle"; y0 = maxY + 14; }
    rows.forEach((r, i) => {
      el("text", { x, y: y0 + i * lh, "text-anchor": anchor, class: s.bold ? "bold" : "" }, g).textContent = r;
    });
    if (s.note && !s.panelOnly) {
      const nb = g.querySelector("text").getBBox();
      el("text", { x: nb.x + nb.width + 6, y: y0, class: "note" }, g).textContent = s.note.toUpperCase();
    }
    hit.addEventListener("click", () => {
      const pick = selected === id ? null : id;
      selectStation(pick);
      if (pick) focusPoint(STATIONS[id]);
    });
  }
  applyFocus();
}

// ======================= Pan + zoom (mouse, trackpad, touch) =======================
// The view always stays inside the map: you can zoom into any part and pan around,
// but never drag off into empty space.
const BASE = { x: 50, y: 40, w: 1120, h: 900 };
const MIN_W = 220; // closest zoom
let vb = { ...BASE };
let dragged = false;

function aspect() {
  const r = svg.getBoundingClientRect();
  return r.width && r.height ? r.width / r.height : BASE.w / BASE.h;
}
const maxW = () => Math.max(BASE.w, BASE.h * aspect()); // whole map visible

function setVB(next) {
  const a = aspect();
  const w = Math.min(maxW(), Math.max(MIN_W, next.w));
  const h = w / a;
  // Center on an axis when the whole map fits; otherwise keep the edges inside the map.
  const x = w >= BASE.w ? BASE.x + (BASE.w - w) / 2 : Math.min(BASE.x + BASE.w - w, Math.max(BASE.x, next.x));
  const y = h >= BASE.h ? BASE.y + (BASE.h - h) / 2 : Math.min(BASE.y + BASE.h - h, Math.max(BASE.y, next.y));
  vb = { x, y, w, h };
  svg.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}
function toSvg(cx, cy) {
  const pt = svg.createSVGPoint();
  pt.x = cx; pt.y = cy;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function zoomAt(k, cx, cy) {
  const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : toSvg(cx, cy);
  const w = Math.min(maxW(), Math.max(MIN_W, vb.w * k)), r = w / vb.w;
  setVB({ x: p.x - (p.x - vb.x) * r, y: p.y - (p.y - vb.y) * r, w });
}
function unitsPerPx() { return vb.w / svg.getBoundingClientRect().width; }

// Smoothly glide to a new view (used by buttons, double-tap and tapping a station).
let anim = null;
function animateTo(target, ms = 380) {
  cancelAnimationFrame(anim);
  const from = { ...vb }, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => {
    const t = Math.min(1, (now - t0) / ms), k = ease(t);
    setVB({ x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k, w: from.w + (target.w - from.w) * k });
    if (t < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function zoomTo(k, p) {
  p ||= { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
  const w = Math.min(maxW(), Math.max(MIN_W, vb.w * k)), r = w / vb.w;
  animateTo({ x: p.x - (p.x - vb.x) * r, y: p.y - (p.y - vb.y) * r, w });
}
// Center a station in the part of the map you can actually see (not behind the panel),
// zooming in a bit if we're far out.
function focusPoint(s) {
  const r = svg.getBoundingClientRect();
  let fx = 0.5, fy = 0.5;
  if (isSmall() && !sheet.classList.contains("collapsed")) {
    const sr = sheet.getBoundingClientRect();
    if (sr.left > r.left + r.width * 0.3) fx = Math.max(0.2, (sr.left - r.left) / r.width / 2); // floating card on the right
    else fy = Math.max(0.15, (sr.top - r.top) / r.height / 2);                               // bottom sheet
  }
  const portrait = aspect() < 0.9;
  const w = portrait ? Math.min(vb.w, 340) : (vb.w > 640 ? 520 : vb.w);
  const h = w / aspect();
  animateTo({ x: s.x - fx * w, y: s.y - fy * h, w });
}

svg.addEventListener("wheel", e => {
  e.preventDefault();
  cancelAnimationFrame(anim);
  zoomAt(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
}, { passive: false });

const pointers = new Map();
let start = null, lastTap = { t: 0, x: 0, y: 0 };
svg.addEventListener("pointerdown", e => {
  cancelAnimationFrame(anim);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragged = false;
  start = snapshot();
});
window.addEventListener("pointermove", e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const now = snapshot();
  if (!start || now.n !== start.n) { start = now; return; }
  const moved = Math.hypot(now.cx - start.cx, now.cy - start.cy);
  if (!dragged && moved < 8 && Math.abs(now.dist - start.dist) < 8) return;
  if (!dragged) { dragged = true; svg.classList.add("grabbing"); }
  if (now.n >= 2 && start.dist > 0) zoomAt(start.dist / now.dist, now.cx, now.cy);
  const u = unitsPerPx();
  setVB({ x: vb.x - (now.cx - start.cx) * u, y: vb.y - (now.cy - start.cy) * u, w: vb.w });
  start = now;
});
const endPointer = e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  // double-tap (or double-click) on empty map zooms in there
  if (!dragged && !pointers.size && e.type === "pointerup" && !e.target.closest(".station, .line-path, .train")) {
    const now = performance.now();
    if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      zoomTo(0.5, toSvg(e.clientX, e.clientY));
      lastTap.t = 0;
    } else lastTap = { t: now, x: e.clientX, y: e.clientY };
  }
  start = pointers.size ? snapshot() : null;
  if (!pointers.size) svg.classList.remove("grabbing");
};
window.addEventListener("pointerup", endPointer);
window.addEventListener("pointercancel", endPointer);
function snapshot() {
  const ps = [...pointers.values()];
  const cx = ps.reduce((s, p) => s + p.x, 0) / (ps.length || 1);
  const cy = ps.reduce((s, p) => s + p.y, 0) / (ps.length || 1);
  const dist = ps.length >= 2 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0;
  return { n: ps.length, cx, cy, dist };
}
// A drag shouldn't count as a click on a station or line.
svg.addEventListener("click", e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);

document.querySelectorAll("[data-zoom]").forEach(b => b.onclick = () => {
  if (b.dataset.zoom === "in") zoomTo(0.6);
  else if (b.dataset.zoom === "out") zoomTo(1 / 0.6);
  else fitView(true);
});
// Keyboard: + / - to zoom, 0 to reset, arrows to pan (map tab only).
addEventListener("keydown", e => {
  if (document.body.dataset.view !== "map" || e.target.closest("input, select, textarea")) return;
  const step = vb.w * 0.15;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (e.key === "+" || e.key === "=") zoomTo(0.6);
  else if (e.key === "-" || e.key === "_") zoomTo(1 / 0.6);
  else if (e.key === "0") fitView(true);
  else if (moves[e.key]) { e.preventDefault(); animateTo({ x: vb.x + moves[e.key][0], y: vb.y + moves[e.key][1], w: vb.w }, 200); }
});

// Starting view: the whole map on wide screens; on tall phones, fill the height so it isn't tiny.
function fitView(smooth) {
  const a = aspect();
  const portrait = a < 0.9;
  const w = portrait ? Math.max(BASE.h * a, Math.min(660, maxW())) : maxW();
  const target = { x: BASE.x + (BASE.w - w) / 2 + (portrait ? 10 : 0), y: BASE.y + (BASE.h - w / a) / 2, w };
  smooth ? animateTo(target) : setVB(target);
}

// ======================= Bottom bar =======================
function renderBar() {
  document.querySelectorAll(".toggle button").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));

  const { h, m } = bayClock();
  const live = h >= 21 ? "night" : h >= 5 ? "day" : null;
  // Flip to evening (and dark mode) on its own when 9pm hits, unless the rider picked a mode.
  if (!manualMode && live && live !== mode && typeof applyTheme === "function") { setMode(live); return; }
  let text;
  if (live === "day") {
    const mins = (21 - h) * 60 - m;
    text = `Evening service in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else if (live === "night") text = "Last trains around midnight";
  else text = "No service right now, trains resume in the morning";
  document.getElementById("status").innerHTML = (live === mode ? "<b>RUNNING NOW</b>" : "") + text;
  document.querySelectorAll(".toggle button").forEach(b => b.classList.toggle("live", b.dataset.mode === live));

  const chips = document.getElementById("chips");
  chips.innerHTML = "";
  for (const line of activeLines()) {
    const c = document.createElement("button");
    c.className = "chip" + (focusedLine === line.id ? " on" : "");
    c.title = line.ends;
    const fg = line.id.startsWith("yellow") ? "#231f20" : "#fff";
    c.innerHTML = `<span class="badge" style="background:${line.color};color:${fg}">${line.letter}</span>${esc(line.name)}`;
    c.onclick = () => focusLine(focusedLine === line.id ? null : line.id);
    chips.appendChild(c);
  }
}

// ======================= Focus + selection =======================
function applyFocus() {
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  svg.classList.toggle("focus", !!focusedLine);
  if (focusedLine) {
    svg.querySelectorAll(`[data-line="${focusedLine}"]`).forEach(p => p.classList.add("hl"));
    LINES[focusedLine].path.forEach(s => svg.querySelector(`.station[data-id="${s}"]`)?.classList.add("hl"));
  }
}
function focusLine(id) { focusedLine = id; applyFocus(); renderBar(); if (typeof renderTrains === "function") renderTrains(); }
function selectStation(id) {
  selected = id;
  svg.querySelectorAll(".station.selected").forEach(n => n.classList.remove("selected"));
  if (id) {
    svg.querySelector(`.station[data-id="${id}"]`)?.classList.add("selected");
    tab = "station";
    sheet.classList.remove("collapsed");
  }
  renderPanel();
}

// ======================= Panel (Station + departures / Alerts) =======================
function setTab(t) {
  if (t === tab && !sheet.classList.contains("collapsed") && isSmall()) { sheet.classList.add("collapsed"); return; }
  tab = t;
  sheet.classList.remove("collapsed");
  renderPanel();
}
document.querySelectorAll(".ptabs button").forEach(b => b.onclick = () => setTab(b.dataset.tab));
document.querySelector(".grab").onclick = () => sheet.classList.toggle("collapsed");

function renderPanel() {
  clearInterval(renderPanel.timer);
  document.querySelectorAll(".ptabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  if (tab === "station") stationPanel(); else alertsPanel();
}

function lineTags(id) {
  const ls = linesAt(id);
  if (!ls.length) return '<p class="sub">No service during this period.</p>';
  return `<div class="line-tags">${ls.map(l => {
    const fg = l.id.startsWith("yellow") ? "color:#231f20" : "";
    return `<span class="tag"><span class="badge" style="background:${l.color};${fg}">${l.letter}</span>${esc(l.name)}</span>`;
  }).join("")}</div>`;
}

function stationPanel() {
  if (!selected) {
    panel.innerHTML = `<div class="empty"><strong>Pick a station</strong>Tap any station on the map to see its lines, the next trains leaving it, and what's nearby.</div>
      <p class="credit-link">Live data from BART's public API · <a href="#sources">Data &amp; Sources</a></p>`;
    return;
  }
  const id = selected, s = STATIONS[id], info = STATION_INFO[id] || {};
  const ends = Object.values(LINES).some(l => l.path[0] === id || l.path[l.path.length - 1] === id);
  const kind = ends ? "End of the line" : linesAt(id).length > 1 ? "Transfer station" : "Station";
  panel.innerHTML = `
    <h2>${esc(s.name)}</h2>
    <p class="sub">${kind}${s.note ? " · " + esc(s.note) : ""}</p>
    <h3>Lines</h3>${lineTags(id)}
    <h3>Next trains</h3><div id="deps"><p class="sub">Loading live departures...</p></div>
    ${info.connects ? `<h3>Connections</h3><ul>${info.connects.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    ${info.spots ? `<h3>Nearby</h3><ul>${info.spots.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}`;

  const load = async () => {
    const box = document.getElementById("deps");
    if (!box || selected !== id || tab !== "station") return;
    try {
      const r = await fetch(`${API}/etd.aspx?cmd=etd&orig=${info.abbr}&key=${BART_KEY}&json=y`);
      const data = await r.json();
      const etds = data.root?.station?.[0]?.etd || [];
      const rows = etds.flatMap(e => (e.estimate || []).map(est => ({ dest: e.destination, ...est })))
        .map(r => ({ ...r, n: r.minutes === "Leaving" ? 0 : +r.minutes }))
        .sort((a, b) => a.n - b.n).slice(0, 8);
      box.innerHTML = (rows.length ? rows.map(r => `
        <div class="dep"><span class="bar" style="background:${esc(r.hexcolor)}"></span>
          <div class="dest">${esc(r.dest)}<small>Platform ${esc(r.platform)} · ${esc(r.length)} cars</small></div>
          <div class="mins">${r.n === 0 ? "Now" : r.n + " min"}${r.delay > 0 ? `<small>${Math.round(r.delay / 60)} min late</small>` : ""}</div></div>`).join("")
        : `<p class="sub">No upcoming trains right now.</p>`)
        + `<div class="refresh"><span>Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><button id="reload">Refresh</button></div>`;
      document.getElementById("reload").onclick = load;
    } catch {
      box.innerHTML = `<p class="sub">Couldn't reach BART's live data right now. Try again in a minute.</p>`;
    }
  };
  load();
  renderPanel.timer = setInterval(load, 30000);
}

const cdata = d => d?.["#cdata-section"] ?? (typeof d === "string" ? d : "");
const getBsa = cmd => fetch(`${API}/bsa.aspx?cmd=${cmd}&key=${BART_KEY}&json=y`).then(r => r.json());

async function alertsPanel() {
  const local = [];
  if (mode === "night") {
    local.push({ cls: "warn", text: "From 9pm to midnight, Yellow Line trains end at SFO. For Millbrae, cross the platform at SFO to the Millbrae shuttle." });
    local.push({ cls: "warn", text: "No Red or Green Line after 9pm. Richmond to SF: ride Orange and switch to Yellow at MacArthur or 19th St. Daly City to Fremont or San José: ride Blue and switch to Orange at Bay Fair." });
    if (["Sun", "Mon", "Tue", "Wed", "Thu"].includes(bayClock().day))
      local.push({ cls: "warn", text: "Sunday through Thursday nights after 9pm, train control work between Daly City and Millbrae can slow trains. Allow extra time." });
  }
  local.push({ text: mode === "night"
    ? "Blue trains end at Daly City. Going to SFO or Millbrae? Switch to a Yellow train at Balboa Park, on the same platform."
    : "Blue and Green trains end at Daly City. Going to SFO or Millbrae? Switch to a Red or Yellow train at Balboa Park, on the same platform." });
  local.push({ text: "Timed transfers: trains meet across the platform at MacArthur and 19th St/Oakland, and at Bay Fair between Blue and Orange, so you can switch lines without a long wait." });

  panel.innerHTML = `<h2>Service alerts</h2><p class="sub">Systemwide, updated live</p>
    <h3>Right now</h3><div id="bsa"><p class="sub">Loading...</p></div>
    <h3>Elevators</h3><div id="elev"><p class="sub">Loading...</p></div>
    <h3>Good to know</h3>${local.map(a => `<div class="alert ${a.cls || ""}">${esc(a.text)}</div>`).join("")}`;

  try {
    const d = await getBsa("bsa");
    const items = (d.root?.bsa || []).filter(b => cdata(b.description));
    document.getElementById("bsa").innerHTML = items.map(b => {
      const t = cdata(b.description), calm = /no delays/i.test(t);
      return `<div class="alert ${calm ? "ok" : "warn"}">${esc(t)}${b.posted ? `<small>${esc(b.posted)}</small>` : ""}</div>`;
    }).join("") || `<div class="alert ok">No delays reported.</div>`;
  } catch { document.getElementById("bsa").innerHTML = `<p class="sub">Couldn't load live advisories.</p>`; }
  try {
    const d = await getBsa("elev");
    const t = cdata(d.root?.bsa?.[0]?.description);
    document.getElementById("elev").innerHTML = `<div class="alert ${!t || /no elevator/i.test(t) ? "ok" : ""}">${esc(t || "All elevators in service.")}</div>`;
  } catch { document.getElementById("elev").innerHTML = `<p class="sub">Couldn't load elevator status.</p>`; }
}

// Orange dot on the Alerts tab when there's a real delay.
async function checkAlertDot() {
  try {
    const d = await getBsa("bsa");
    const bad = (d.root?.bsa || []).some(b => { const t = cdata(b.description); return t && !/no delays/i.test(t); });
    document.getElementById("alert-dot").hidden = !bad;
  } catch { /* ignore */ }
}

// ======================= Views (Map / About) =======================
function route() {
  const hash = location.hash.slice(1);
  const view = hash === "sources" ? "sources" : ["about", "karl"].includes(hash) ? "about" : "map";
  document.body.dataset.view = view;
  document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("active", a.dataset.view === view));
  if (view === "sources") document.getElementById("view-sources").scrollTop = 0;
  if (view === "about") {
    const target = hash === "about" ? null : document.getElementById(hash);
    requestAnimationFrame(() => target ? target.scrollIntoView({ behavior: "smooth" }) : (document.getElementById("view-about").scrollTop = 0));
  }
  else if (layer) { drawNetwork(); fitView(); } // label sizes need the map to be visible
}
window.addEventListener("hashchange", route);
document.getElementById("view-sources").appendChild(document.querySelector(".site-footer").cloneNode(true));

// ======================= Setup =======================
// Evening service = dark theme, across every page.
function applyTheme() { document.documentElement.dataset.theme = mode === "night" ? "night" : "day"; }

let manualMode = false; // once someone taps Day/Evening, stop auto-switching at 9pm
function setMode(m) {
  if (m === mode) return;
  mode = m; focusedLine = null;
  applyTheme();
  drawNetwork(); renderBar(); renderPanel();
}
document.querySelectorAll(".toggle button").forEach(b => b.onclick = () => { manualMode = true; setMode(b.dataset.mode); });

const hour = bayClock().h;
mode = hour >= 21 || hour < 5 ? "night" : "day";
applyTheme();
if (isSmall()) sheet.classList.add("collapsed");
route();
drawBackground(); drawNetwork(); renderBar(); renderPanel(); fitView();
checkAlertDot();
let lastW = innerWidth;
addEventListener("resize", () => {
  if (Math.abs(innerWidth - lastW) > 80) { lastW = innerWidth; fitView(); }
  else setVB(vb); // re-clamp to the new shape
});
setInterval(renderBar, 60000);
setInterval(checkAlertDot, 120000);
