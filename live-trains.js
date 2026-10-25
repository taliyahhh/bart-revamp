// Mini trains on the map.
// Live mode: BART's real-time departures for every station (etd orig=ALL) are turned into
// approximate train positions. A train due at station S in m minutes sits between S and the
// station before it, m minutes out. If live data can't load, trains are estimated from a
// simple timetable model instead, and the map says so.

const ABBR_TO_ID = Object.fromEntries(Object.entries(STATION_INFO).map(([id, i]) => [i.abbr, id]));
const COLOR_TO_LINE = { RED: "red", ORANGE: "orange", GREEN: "green", BLUE: "blue" };
const HEADWAY_MIN = 20; // used only for the estimated fallback

let showTrains = true;
let live = { items: [], fetchedAt: 0, source: "loading" };
let trainLayer = null;

const lineIdFor = color => color === "YELLOW" ? (mode === "night" ? "yellowNight" : "yellow") : COLOR_TO_LINE[color];
const realIdx = (path, i, dir) => { for (let j = i; j >= 0 && j < path.length; j += dir) if (!STATIONS[path[j]].wp) return j; return -1; };

// Rough minutes between two stations, from map distance (the Transbay Tube is the long one).
function segMinutes(path, a, b) {
  const ids = [path[a], path[b]];
  if (ids.includes("westoakland") && ids.includes("embarcadero")) return 7;
  let len = 0;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  for (let j = lo; j < hi; j++) len += Math.hypot(STATIONS[path[j + 1]].x - STATIONS[path[j]].x, STATIONS[path[j + 1]].y - STATIONS[path[j]].y);
  return Math.max(1.5, len / 20);
}

// ---------- Live data ----------
async function loadLive() {
  try {
    const r = await fetch(`${API}/etd.aspx?cmd=etd&orig=ALL&key=${BART_KEY}&json=y`);
    const data = await r.json();
    const items = [];
    for (const st of data.root?.station || []) {
      const S = ABBR_TO_ID[st.abbr];
      if (!S) continue;
      for (const e of st.etd || []) {
        const T = ABBR_TO_ID[e.abbreviation];
        const est = (e.estimate || [])[0];
        if (!T || !est) continue;
        const id = lineIdFor(est.color);
        const line = LINES[id];
        if (!line) continue;
        const path = line.path, iS = path.indexOf(S), iT = path.indexOf(T);
        if (iS < 0 || iT < 0 || iS === iT) continue;
        const dir = Math.sign(iT - iS);
        const iP = realIdx(path, iS - dir, -dir);
        if (iP < 0) continue;
        const seg = segMinutes(path, iP, iS);
        const m = est.minutes === "Leaving" ? 0 : +est.minutes;
        if (!(m <= seg)) continue; // further back: the previous station's estimate covers it
        items.push({ line: id, iP, iS, seg, m, dest: e.destination, cars: est.length });
      }
    }
    live = { items, fetchedAt: Date.now(), source: "live" };
  } catch (err) {
    console.warn("Live trains unavailable:", err);
    live = { items: [], fetchedAt: Date.now(), source: "estimated" };
  }
  renderTrains();
}

// ---------- Estimated fallback (timetable model) ----------
function estimatedItems() {
  const out = [];
  const now = new Date();
  const clock = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (const line of activeLines()) {
    if (line.id === "oak") continue;
    for (const dir of [1, -1]) {
      const real = line.path.map((id, i) => i).filter(i => !STATIONS[line.path[i]].wp);
      if (dir < 0) real.reverse();
      const times = [0];
      for (let k = 1; k < real.length; k++) times.push(times[k - 1] + segMinutes(line.path, real[k - 1], real[k]));
      const total = times[times.length - 1];
      for (let t = (clock + (dir < 0 ? HEADWAY_MIN / 2 : 0)) % HEADWAY_MIN; t < total; t += HEADWAY_MIN) {
        const k = times.findIndex(x => x > t);
        if (k < 1) continue;
        const seg = times[k] - times[k - 1];
        const endId = line.path[real[real.length - 1]];
        out.push({ line: line.id, iP: real[k - 1], iS: real[k], seg, frac: (t - times[k - 1]) / seg, dest: STATIONS[endId].short || STATIONS[endId].name });
      }
    }
  }
  return out;
}

// ---------- Drawing ----------
function pointAlong(pts, a, b, frac) {
  const dir = Math.sign(b - a) || 1, chain = [];
  for (let j = a; j !== b + dir; j += dir) chain.push(pts[j]);
  let total = 0;
  for (let j = 1; j < chain.length; j++) total += Math.hypot(chain[j].x - chain[j - 1].x, chain[j].y - chain[j - 1].y);
  let want = total * Math.min(1, Math.max(0, frac));
  for (let j = 1; j < chain.length; j++) {
    const p = chain[j - 1], q = chain[j], d = Math.hypot(q.x - p.x, q.y - p.y);
    if (want <= d || j === chain.length - 1) {
      const t = d ? Math.min(1, want / d) : 0;
      return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, angle: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI };
    }
    want -= d;
  }
  return { ...chain[0], angle: 0 };
}

function renderTrains() {
  if (!trainLayer || !trainLayer.isConnected) trainLayer = el("g", { id: "trains" });
  svg.appendChild(trainLayer); // keep trains above the network after redraws
  if (typeof hitLayer !== "undefined" && hitLayer) svg.appendChild(hitLayer); // station taps stay on top
  trainLayer.innerHTML = "";
  updatePill();
  if (!showTrains) return;

  const active = new Set(SERVICE[mode].lines);
  const elapsed = (Date.now() - live.fetchedAt) / 60000;
  const items = live.source === "live"
    ? live.items.map(t => ({ ...t, frac: 1 - Math.max(0, t.m - elapsed) / t.seg }))
    : live.source === "estimated" ? estimatedItems() : [];

  const ptsCache = {};
  for (const t of items) {
    if (!active.has(t.line)) continue;
    const line = { id: t.line, ...LINES[t.line] };
    const pts = ptsCache[t.line] ||= offsetPoints(line);
    const p = pointAlong(pts, t.iP, t.iS, t.frac);
    const g = el("g", { class: "train" + (focusedLine === t.line ? " hl" : ""), transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})` }, trainLayer);
    // Bullet-nosed mini train; the nose points the way it's heading.
    const body = "M-13,-5.5 L6,-5.5 Q13,-5.5 14,0 Q13,5.5 6,5.5 L-13,5.5 Q-15,5.5 -15,3.5 L-15,-3.5 Q-15,-5.5 -13,-5.5 Z";
    el("path", { d: body, fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linejoin": "round" }, g);
    el("path", { d: body, fill: line.color, stroke: "#231f20", "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
    for (const x of [-11, -5, 1]) el("rect", { x, y: -2.5, width: 4, height: 5, rx: 1, fill: "#231f20", opacity: .75 }, g);
    el("path", { d: "M8,-3 Q11.5,-2.5 12,0 Q11.5,2.5 8,3 Z", fill: "#231f20", opacity: .8 }, g);
    const next = STATIONS[line.path[t.iS]];
    const when = live.source === "live" ? (t.m - elapsed <= 0.5 ? "arriving now" : `in ${Math.ceil(t.m - elapsed)} min`) : "";
    el("title", {}, g).textContent = `${line.name} to ${t.dest}. Next stop ${next.short || next.name}${when ? ", " + when : ""}${t.cars ? ` (${t.cars} cars)` : ""}`;
  }
}

// ---------- Status pill ----------
const pill = document.createElement("button");
pill.className = "live-pill";
document.querySelector(".map-wrap").appendChild(pill);
pill.onclick = () => { showTrains = !showTrains; renderTrains(); };

function updatePill() {
  let text;
  if (!showTrains) text = "Show trains";
  else if (live.source === "live") text = `Live trains · ${live.items.filter(t => SERVICE[mode].lines.includes(t.line)).length} running`;
  else if (live.source === "estimated") text = "Estimated trains · live data unavailable";
  else text = "Loading trains...";
  pill.innerHTML = `<span class="pulse ${showTrains && live.source === "live" ? "on" : ""}"></span>${text}`;
  pill.title = showTrains ? "Hide trains" : "Show trains";
}

// ---------- Run ----------
loadLive();
setInterval(loadLive, 30000);
setInterval(() => { if (document.body.dataset.view === "map") renderTrains(); }, 2000);
