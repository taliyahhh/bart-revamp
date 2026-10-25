// Side-view train illustrations (original drawings, 1000 x 200 canvas) and the About page carousel.

function legacyCar() {
  const windows = [[70, 150], [160, 240], [360, 450], [470, 560], [580, 670], [800, 890]];
  const doors = [[270, 330], [700, 760]];
  return `
    <path d="M14,48 L928,48 Q972,48 984,76 L990,150 L14,150 Z" fill="#d9dcdf" stroke="#9fa4a8" stroke-width="2"/>
    <path d="M14,48 L928,48 Q972,48 984,76 L986,92 L14,92 Z" fill="#e6e8ea"/>
    ${[18, 24, 30, 36].map(x => `<line x1="${x}" y1="56" x2="${x}" y2="146" stroke="#a7acb0" stroke-width="2"/>`).join("")}
    ${windows.map(([a, b]) => `<rect x="${a}" y="66" width="${b - a}" height="38" rx="3" fill="#a9d8f3" stroke="#6f8796" stroke-width="2"/>`).join("")}
    ${doors.map(([a, b]) => `
      <rect x="${a}" y="58" width="${b - a}" height="92" fill="#d2d5d8" stroke="#7d8388" stroke-width="2"/>
      <line x1="${(a + b) / 2}" y1="58" x2="${(a + b) / 2}" y2="150" stroke="#7d8388" stroke-width="2"/>
      <rect x="${a + 6}" y="66" width="${(b - a) / 2 - 12}" height="38" rx="2" fill="#a9d8f3" stroke="#6f8796" stroke-width="1.5"/>
      <rect x="${(a + b) / 2 + 6}" y="66" width="${(b - a) / 2 - 12}" height="38" rx="2" fill="#a9d8f3" stroke="#6f8796" stroke-width="1.5"/>`).join("")}
    <rect x="906" y="62" width="34" height="44" rx="4" fill="#a9d8f3" stroke="#6f8796" stroke-width="2"/>
    <rect x="14" y="112" width="970" height="5" fill="#2a7fc0"/>
    <rect x="14" y="120" width="970" height="2" fill="#2a7fc0" opacity=".6"/>
    ${undercarriage()}`;
}

function futureCar() {
  const windows = [[70, 140], [160, 230], [370, 440], [460, 530], [700, 770], [880, 920]];
  const doors = [[250, 330], [560, 640]];
  return `
    <path d="M14,44 L900,44 C950,44 978,62 986,96 L990,150 L14,150 Z" fill="#e4e6e8" stroke="#a3a8ac" stroke-width="2"/>
    <path d="M790,44 L860,44 L830,150 L760,150 Z" fill="#1f7fd6"/>
    <path d="M900,44 C950,44 978,62 986,96 L990,150 L930,150 L930,44 Z" fill="#f6f7f8" stroke="#a3a8ac" stroke-width="2"/>
    <path d="M948,52 C968,58 978,72 982,96 L946,96 Z" fill="#2b3036"/>
    <path d="M14,138 C200,132 420,110 760,104" fill="none" stroke="#3a3f46" stroke-width="2.5"/>
    ${windows.map(([a, b]) => `<rect x="${a}" y="62" width="${b - a}" height="42" rx="9" fill="#2b3036"/>`).join("")}
    ${doors.map(([a, b]) => `
      <rect x="${a}" y="54" width="${b - a}" height="96" rx="3" fill="#dcdfe2" stroke="#7d8388" stroke-width="2"/>
      <line x1="${(a + b) / 2}" y1="54" x2="${(a + b) / 2}" y2="150" stroke="#7d8388" stroke-width="2"/>
      <rect x="${a + 8}" y="62" width="${(b - a) / 2 - 16}" height="46" rx="6" fill="#2b3036"/>
      <rect x="${(a + b) / 2 + 8}" y="62" width="${(b - a) / 2 - 16}" height="46" rx="6" fill="#2b3036"/>`).join("")}
    <rect x="820" y="54" width="44" height="96" rx="3" fill="none" stroke="#e8f2fb" stroke-width="2" opacity=".8"/>
    ${undercarriage()}`;
}

function undercarriage() {
  const truck = cx => `
    <rect x="${cx - 62}" y="156" width="124" height="12" rx="3" fill="#3b3f44"/>
    <circle cx="${cx - 34}" cy="172" r="14" fill="#9aa0a6" stroke="#4a4f55" stroke-width="3"/>
    <circle cx="${cx + 34}" cy="172" r="14" fill="#9aa0a6" stroke="#4a4f55" stroke-width="3"/>
    <circle cx="${cx - 34}" cy="172" r="4" fill="#4a4f55"/><circle cx="${cx + 34}" cy="172" r="4" fill="#4a4f55"/>`;
  return `
    <rect x="200" y="150" width="600" height="14" fill="#2f3337"/>
    <rect x="300" y="150" width="120" height="22" rx="2" fill="#3b3f44"/>
    <rect x="560" y="150" width="90" height="20" rx="2" fill="#3b3f44"/>
    ${truck(130)}${truck(870)}`;
}

const SLIDES = [
  {
    name: "Legacy fleet",
    years: "1972 – 2024",
    thumb: "Legacy cars",
    draw: legacyCar,
    p1: "When BART opened in 1972, its aluminum cars looked like the future: low, sleek and built for a wide 5 ft 6 in track gauge you won't find on most American railways.",
    p2: "Four generations of these cars (A, B, C1 and C2) carried riders for more than 50 years, through the Transbay Tube and out to every corner of the Bay. The last of them retired in April 2024."
  },
  {
    name: "Fleet of the Future",
    years: "2018 – today",
    thumb: "Fleet of the Future",
    draw: futureCar,
    p1: "The new cars started carrying riders in 2018. They're quieter and cooler inside, with three doors on each side instead of two, so crowds get on and off faster.",
    p2: "Inside you'll find digital screens showing the next stop, space for bikes and priority seating, all wrapped in the blue and white look that's become the new face of BART."
  }
];

let slide = 0;
const carSVG = (fn, vb) => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${fn()}</svg>`;

function renderAbout() {
  const s = SLIDES[slide];
  const set = (id, html) => { const n = document.getElementById(id); n.classList.remove("in"); n.innerHTML = html; void n.offsetWidth; n.classList.add("in"); };
  set("car-front", carSVG(s.draw, "50 34 475 154"));
  set("car-rear", carSVG(s.draw, "525 34 475 154"));
  document.getElementById("a-years").textContent = s.years;
  document.getElementById("a-name").textContent = s.name;
  document.getElementById("a-p1").textContent = s.p1;
  document.getElementById("a-p2").textContent = s.p2;
  document.getElementById("thumbs").innerHTML = SLIDES.map((t, i) => `
    <button class="thumb${i === slide ? " active" : ""}" data-i="${i}" aria-label="${t.name}">
      ${carSVG(t.draw, "0 36 1000 152")}<span>${t.thumb}</span>
    </button>`).join("");
  document.querySelectorAll(".thumb").forEach(b => b.onclick = () => { slide = +b.dataset.i; renderAbout(); });
}
document.getElementById("prev").onclick = () => { slide = (slide + SLIDES.length - 1) % SLIDES.length; renderAbout(); };
document.getElementById("next").onclick = () => { slide = (slide + 1) % SLIDES.length; renderAbout(); };
renderAbout();

// Vertical hanger cables on the bridge in the Karl illustration.
(function drawHangers() {
  const g = document.getElementById("hangers");
  if (!g) return;
  // main cable: quadratic from (150,110) via (300,232)/(510,232) to (660,110), approximated per side
  const cableY = x => {
    const span = x <= 405 ? [150, 405] : [405, 660];
    const t = (x - span[0]) / (span[1] - span[0]);
    return x <= 405 ? 110 + (232 - 110) * (1 - (1 - t) * (1 - t)) : 232 - (232 - 110) * t * t;
  };
  let out = "";
  for (let x = 168; x < 650; x += 16) {
    const y = cableY(x);
    if (236 - y > 6) out += `<line x1="${x}" y1="${y.toFixed(1)}" x2="${x}" y2="236"/>`;
  }
  g.innerHTML = out;
})();
