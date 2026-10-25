const svg = document.getElementById("map");
const panel = document.getElementById("panel");
const NS = "http://www.w3.org/2000/svg";

// BART's public API key (published by BART for open use). Swap in your own from api.bart.gov.
const BART_KEY = "MW9S-E7SL-26DU-VV8V";

let mode = "day";
let version = new URLSearchParams(location.search).get("v") || "station";
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
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const activeLines = () => SERVICE[mode].lines.map(id => ({ id, ...LINES[id] }));
const linesAt = id => activeLines().filter(l => l.path.includes(id));
const nameOf = id => STATIONS[id].short || STATIONS[id].name;

// ---------- Geometry ----------
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

let layer;
function drawNetwork() {
  layer?.remove();
  layer = el("g", { id: "network" });
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
    if (s.note) {
      const nb = g.querySelector("text").getBBox();
      el("text", { x: nb.x + nb.width + 6, y: y0, class: "note" }, g).textContent = s.note.toUpperCase();
    }
    g.addEventListener("click", () => selectStation(selected === id ? null : id));
  }
  applyFocus();
}

// ---------- Header ----------
function renderHeader() {
  document.querySelectorAll(".toggle button").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  document.querySelectorAll(".versions button").forEach(b => b.classList.toggle("active", b.dataset.v === version));

  const now = new Date(), h = now.getHours();
  const live = h >= 21 ? "night" : h >= 5 ? "day" : null;
  let text;
  if (live === "day") {
    const mins = (21 - h) * 60 - now.getMinutes();
    text = `Evening service in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else if (live === "night") text = "Last trains around midnight";
  else text = "No service right now, trains resume in the morning";
  const tag = live === mode ? "<b>RUNNING NOW</b>" : "";
  document.getElementById("status").innerHTML = tag + text;

  const chips = document.getElementById("chips");
  chips.innerHTML = "";
  for (const line of activeLines()) {
    const c = document.createElement("button");
    c.className = "chip" + (focusedLine === line.id ? " on" : "");
    const dark = line.id.startsWith("yellow") ? "color:#231f20;" : "color:#fff;";
    c.innerHTML = `<span class="badge" style="background:${line.color};${dark}">${line.letter}</span>${esc(line.name)}`;
    c.title = line.ends;
    c.onclick = () => focusLine(focusedLine === line.id ? null : line.id);
    chips.appendChild(c);
  }
  for (const [id, name, a, b] of SERVICE[mode].gone || []) {
    const c = document.createElement("button");
    c.className = "chip off";
    c.title = `No evening service. Use the ${a === "O" ? "Orange" : a} or ${b === "Y" ? "Yellow" : "Blue"} Line.`;
    c.innerHTML = `<span class="badge" style="background:${LINES[id].color};color:#fff">${LINES[id].letter}</span>${name} <small>off tonight</small>`;
    chips.appendChild(c);
  }
}

// ---------- Focus / selection ----------
function applyFocus() {
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  svg.classList.toggle("focus", !!focusedLine);
  if (focusedLine) {
    svg.querySelectorAll(`[data-line="${focusedLine}"]`).forEach(p => p.classList.add("hl"));
    LINES[focusedLine].path.forEach(s => svg.querySelector(`.station[data-id="${s}"]`)?.classList.add("hl"));
  }
}
function focusLine(id) { focusedLine = id; applyFocus(); renderHeader(); }
function selectStation(id) {
  selected = id;
  svg.querySelectorAll(".station.selected").forEach(n => n.classList.remove("selected"));
  if (id) svg.querySelector(`.station[data-id="${id}"]`)?.classList.add("selected");
  renderPanel();
}

// ---------- Panel versions ----------
function lineTags(id) {
  return `<div class="line-tags">${linesAt(id).map(l => {
    const fg = l.id.startsWith("yellow") ? "color:#231f20" : "";
    return `<span class="tag"><span class="badge" style="background:${l.color};${fg}">${l.letter}</span>${esc(l.name)}</span>`;
  }).join("")}</div>`;
}
const emptyState = (title, body) => `<div class="empty"><strong>${title}</strong>${body}</div>`;

function renderPanel() {
  clearInterval(renderPanel.timer);
  if (version === "station") panel.innerHTML = stationPanel();
  else if (version === "departures") departuresPanel();
  else alertsPanel();
}

// Version A: station card
function stationPanel() {
  if (!selected) return emptyState("Pick a station", "Click any station on the map to see which lines stop there, what you can connect to, and what's nearby.");
  const info = STATION_INFO[selected] || {};
  const s = STATIONS[selected];
  const ends = Object.values(LINES).some(l => l.path[0] === selected || l.path[l.path.length - 1] === selected);
  return `
    <h2>${esc(s.name)}</h2>
    <p class="sub">${ends ? "End of the line" : linesAt(selected).length > 1 ? "Transfer station" : "Station"}${s.note ? " · " + esc(s.note) : ""}</p>
    <h3>Lines</h3>${lineTags(selected) || '<p class="sub">No service during this period.</p>'}
    ${info.connects ? `<h3>Connections</h3><ul>${info.connects.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    ${info.spots ? `<h3>Nearby</h3><ul>${info.spots.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}`;
}

// Version B: live departures from the BART API
async function departuresPanel() {
  if (!selected) { panel.innerHTML = emptyState("Live departures", "Click any station to see the next trains leaving it, updated every 30 seconds."); return; }
  const id = selected, info = STATION_INFO[id];
  panel.innerHTML = `<h2>${esc(STATIONS[id].name)}</h2><p class="sub">Next trains</p><div id="deps"><p class="sub">Loading...</p></div>`;
  const load = async () => {
    const box = document.getElementById("deps");
    if (!box || selected !== id) return;
    try {
      const r = await fetch(`https://api.bart.gov/api/etd.aspx?cmd=etd&orig=${info.abbr}&key=${BART_KEY}&json=y`);
      const data = await r.json();
      const etds = data.root?.station?.[0]?.etd || [];
      const rows = etds.flatMap(e => (e.estimate || []).map(est => ({ dest: e.destination, ...est })))
        .map(r => ({ ...r, n: r.minutes === "Leaving" ? 0 : +r.minutes }))
        .sort((a, b) => a.n - b.n).slice(0, 10);
      box.innerHTML = rows.length ? rows.map(r => `
        <div class="dep"><span class="bar" style="background:${esc(r.hexcolor)}"></span>
          <div class="dest">${esc(r.dest)}<small>Platform ${esc(r.platform)} · ${esc(r.length)} cars</small></div>
          <div class="mins">${r.n === 0 ? "Now" : r.n + " min"}${r.delay > 0 ? `<small>${Math.round(r.delay / 60)} min late</small>` : ""}</div></div>`).join("")
        : `<p class="sub">No upcoming trains right now.</p>`;
      box.insertAdjacentHTML("beforeend", `<div class="refresh"><span>Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><button id="reload">Refresh</button></div>`);
      document.getElementById("reload").onclick = load;
    } catch {
      box.innerHTML = `<p class="sub">Couldn't reach BART's live data right now. Try again in a minute.</p>`;
    }
  };
  load();
  renderPanel.timer = setInterval(load, 30000);
}

// Version C: service alerts
async function alertsPanel() {
  const local = [];
  if (mode === "night") {
    local.push({ cls: "warn", text: "After 9pm, change trains at SFO for Millbrae service." });
    local.push({ cls: "warn", text: "No Red or Green Line in the evening. Use Orange or Yellow toward Richmond and SF, Orange or Blue toward the South Bay." });
  }
  if (selected) {
    const s = STATIONS[selected];
    if (s.note) local.push({ text: `${s.name}: ${s.note}. Trains wait for each other here.` });
  }
  panel.innerHTML = `<h2>Service alerts</h2><p class="sub">${selected ? "Showing notes for " + esc(STATIONS[selected].name) : "Systemwide"}</p>
    <h3>Right now</h3><div id="bsa"><p class="sub">Loading...</p></div>
    <h3>Elevators</h3><div id="elev"><p class="sub">Loading...</p></div>
    ${local.length ? `<h3>Good to know</h3>${local.map(a => `<div class="alert ${a.cls || ""}">${esc(a.text)}</div>`).join("")}` : ""}`;

  const text = d => d?.["#cdata-section"] ?? d ?? "";
  const get = cmd => fetch(`https://api.bart.gov/api/bsa.aspx?cmd=${cmd}&key=${BART_KEY}&json=y`).then(r => r.json());
  try {
    const d = await get("bsa");
    const items = (d.root?.bsa || []).filter(b => text(b.description));
    document.getElementById("bsa").innerHTML = items.map(b => {
      const t = text(b.description), calm = /no delays/i.test(t);
      return `<div class="alert ${calm ? "ok" : "warn"}">${esc(t)}${b.posted ? `<small>${esc(b.posted)}</small>` : ""}</div>`;
    }).join("") || `<div class="alert ok">No delays reported.</div>`;
  } catch { document.getElementById("bsa").innerHTML = `<p class="sub">Couldn't load live advisories.</p>`; }
  try {
    const d = await get("elev");
    const t = text(d.root?.bsa?.[0]?.description);
    document.getElementById("elev").innerHTML = `<div class="alert ${/no elevator/i.test(t) || !t ? "ok" : ""}">${esc(t || "All elevators in service.")}</div>`;
  } catch { document.getElementById("elev").innerHTML = `<p class="sub">Couldn't load elevator status.</p>`; }
}

// ---------- Setup ----------
function setMode(m) {
  if (m === mode) return;
  mode = m; focusedLine = null;
  drawNetwork(); renderHeader(); renderPanel();
}
function setVersion(v) {
  version = v;
  history.replaceState(null, "", "?v=" + v);
  renderHeader(); renderPanel();
}
document.querySelectorAll(".toggle button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll(".versions button").forEach(b => b.onclick = () => setVersion(b.dataset.v));

const hour = new Date().getHours();
mode = hour >= 21 || hour < 4 ? "night" : "day";
drawBackground(); drawNetwork(); renderHeader(); renderPanel();
setInterval(renderHeader, 60000);
