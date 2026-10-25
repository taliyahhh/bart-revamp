const svg = document.getElementById("map");
const NS = "http://www.w3.org/2000/svg";
let mode = "day";
let focusedLine = null;

const el = (tag, attrs = {}, parent = svg) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent.appendChild(n);
  return n;
};

const activeLines = () => SERVICE[mode].lines.map(id => ({ id, ...LINES[id] }));

// Small per-line offset so overlapping lines sit side by side instead of on top.
const OFFSETS = { red: -9, orange: -3, yellow: 3, yellowNight: 3, green: 9, blue: 15, oak: 0 };

function draw() {
  svg.innerHTML = "";
  const lines = activeLines();

  for (const line of lines) {
    const o = OFFSETS[line.id] || 0;
    const pts = line.stations.map(s => `${STATIONS[s].x + o},${STATIONS[s].y}`).join(" ");
    el("polyline", { points: pts, stroke: line.color, class: "line-path", "data-line": line.id });
  }

  const served = new Set(lines.flatMap(l => l.stations));
  for (const [id, s] of Object.entries(STATIONS)) {
    if (!served.has(id)) continue;
    const g = el("g", { class: "station", "data-id": id });
    el("circle", { cx: s.x + 3, cy: s.y, r: 6 }, g);
    const pos = {
      l: { x: s.x - 14, y: s.y + 4, a: "end" },
      t: { x: s.x + 3, y: s.y - 14, a: "middle" },
      b: { x: s.x + 3, y: s.y + 24, a: "middle" }
    }[s.label] || { x: s.x + 20, y: s.y + 4, a: "start" };
    const t = el("text", { x: pos.x, y: pos.y, "text-anchor": pos.a }, g);
    t.textContent = s.name;
    g.addEventListener("click", () => pickStation(id));
  }
}

function renderLineList() {
  const list = document.getElementById("line-list");
  list.innerHTML = "";
  document.getElementById("service-label").textContent = SERVICE[mode].label;
  for (const line of activeLines()) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="swatch" style="background:${line.color}"></span>
      <div>${line.name}<small>${line.ends}${line.note ? " · " + line.note : ""}</small></div>`;
    li.onclick = () => focusLine(focusedLine === line.id ? null : line.id);
    li.classList.toggle("on", focusedLine === line.id);
    list.appendChild(li);
  }
}

function focusLine(id) {
  focusedLine = id;
  clearTrip(false);
  svg.classList.toggle("focus", !!id);
  if (id) {
    svg.querySelectorAll(`[data-line="${id}"]`).forEach(p => p.classList.add("hl"));
    LINES[id].stations.forEach(s => svg.querySelector(`.station[data-id="${s}"]`)?.classList.add("hl"));
  }
  renderLineList();
}

// ---- Trip planner: fewest-stops path, preferring fewer transfers ----
function buildGraph() {
  const g = {};
  for (const line of activeLines()) {
    line.stations.forEach((s, i) => {
      const next = line.stations[i + 1];
      if (!next) return;
      (g[s] ||= []).push({ to: next, line: line.id });
      (g[next] ||= []).push({ to: s, line: line.id });
    });
  }
  return g;
}

function findRoute(from, to) {
  // Dijkstra over (station, line) states. Cost: 1 per stop, +4 per transfer.
  const g = buildGraph();
  const key = (s, l) => s + "|" + l;
  const dist = {}, prev = {};
  const queue = [{ s: from, l: null, c: 0 }];
  dist[key(from, null)] = 0;
  while (queue.length) {
    queue.sort((a, b) => a.c - b.c);
    const cur = queue.shift();
    if (cur.s === to) {
      const path = [];
      let k = key(cur.s, cur.l);
      while (k) { path.unshift(k.split("|")); k = prev[k]; }
      return path.map(([s, l]) => ({ s, l: l === "null" ? null : l }));
    }
    for (const e of g[cur.s] || []) {
      const c = cur.c + 1 + (cur.l && cur.l !== e.line ? 4 : 0);
      const k = key(e.to, e.line);
      if (dist[k] === undefined || c < dist[k]) {
        dist[k] = c; prev[k] = key(cur.s, cur.l);
        queue.push({ s: e.to, l: e.line, c });
      }
    }
  }
  return null;
}

function showTrip() {
  const from = fromSel.value, to = toSel.value;
  const out = document.getElementById("trip");
  svg.querySelectorAll(".route-path").forEach(n => n.remove());
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  if (!from || !to || from === to) { out.innerHTML = ""; svg.classList.remove("focus"); return; }

  focusedLine = null; renderLineList();
  const route = findRoute(from, to);
  if (!route) { out.textContent = "No route in this service period."; return; }

  svg.classList.add("focus");
  const usedLines = [...new Set(route.map(r => r.l).filter(Boolean))];
  usedLines.forEach(id => svg.querySelectorAll(`[data-line="${id}"]`).forEach(p => p.classList.add("hl")));
  route.forEach(r => svg.querySelector(`.station[data-id="${r.s}"]`)?.classList.add("hl"));
  el("polyline", { class: "route-path", points: route.map(r => `${STATIONS[r.s].x + 3},${STATIONS[r.s].y}`).join(" ") });

  // Group into legs by line.
  const legs = [];
  route.slice(1).forEach((r, i) => {
    const last = legs[legs.length - 1];
    if (last && last.line === r.l) { last.end = r.s; last.stops++; }
    else legs.push({ line: r.l, start: route[i].s, end: r.s, stops: 1 });
  });
  out.innerHTML = legs.map(leg => `<div class="leg"><span class="swatch" style="background:${LINES[leg.line].color}"></span>
    <span>${LINES[leg.line].name}: ${STATIONS[leg.start].name} to ${STATIONS[leg.end].name} (${leg.stops} stop${leg.stops > 1 ? "s" : ""})</span></div>`).join("")
    + `<div class="hint">${legs.length - 1} transfer${legs.length === 2 ? "" : "s"}</div>`;
}

function pickStation(id) {
  if (!fromSel.value || (fromSel.value && toSel.value)) { fromSel.value = id; toSel.value = ""; }
  else toSel.value = id;
  showTrip();
}

function clearTrip(redraw = true) {
  fromSel.value = ""; toSel.value = "";
  document.getElementById("trip").innerHTML = "";
  svg.querySelectorAll(".route-path").forEach(n => n.remove());
  svg.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
  if (redraw) svg.classList.remove("focus");
}

// ---- Setup ----
const fromSel = document.getElementById("from");
const toSel = document.getElementById("to");
const options = `<option value="">Pick a station</option>` +
  Object.entries(STATIONS).sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, s]) => `<option value="${id}">${s.name}</option>`).join("");
fromSel.innerHTML = toSel.innerHTML = options;
fromSel.onchange = toSel.onchange = showTrip;
document.getElementById("clear").onclick = () => { focusedLine = null; clearTrip(); renderLineList(); };

document.querySelectorAll(".toggle button").forEach(b => b.onclick = () => {
  mode = b.dataset.mode;
  document.body.dataset.service = mode;
  document.querySelectorAll(".toggle button").forEach(x => x.classList.toggle("active", x === b));
  focusedLine = null;
  draw(); renderLineList(); showTrip();
});

// Default to night mode if it's actually after 9pm.
const h = new Date().getHours();
if (h >= 21 || h < 4) document.querySelector('[data-mode="night"]').click();
else { draw(); renderLineList(); }
