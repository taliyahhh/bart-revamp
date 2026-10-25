// Opening animation: fog over the map with "Karl's Friend", the fog parts (taking the words with it),
// then "BART" appears and flies into the logo. Tap/click/any key skips. Skipped for reduced motion.
(function intro() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Fog texture: SVG turbulence noise turned into soft white clouds.
  const fogTex = `url("data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
      <filter id='f' x='0' y='0'>
        <feTurbulence type='fractalNoise' baseFrequency='0.006' numOctaves='4' seed='7'/>
        <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.35'/>
      </filter>
      <rect width='600' height='600' filter='url(%23f)'/>
    </svg>`.replace(/%23/g, "#"))}")`;

  const ov = document.createElement("div");
  ov.className = "fog-intro";
  ov.setAttribute("aria-hidden", "true");
  ov.innerHTML = `
    <div class="intro-veil"></div>
    <div class="fog-bank left"><div class="fog-tex"></div><div class="fog-tex slow"></div></div>
    <div class="fog-bank right"><div class="fog-tex"></div><div class="fog-tex slow"></div></div>
    <div class="intro-words">
      <span class="w left">Karl's</span><span class="w right">Friend</span>
    </div>
    <div class="intro-bart">BART</div>
    <button class="intro-skip">Skip</button>`;
  ov.querySelectorAll(".fog-tex").forEach(n => n.style.backgroundImage = fogTex);
  document.body.appendChild(ov);
  document.body.classList.add("intro-on");

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const bart = ov.querySelector(".intro-bart");

  function flyToLogo() {
    const target = document.querySelector(".brand span");
    if (!target) return;
    const from = bart.getBoundingClientRect(), to = target.getBoundingClientRect();
    const scale = to.height / from.height * 1.25;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    bart.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    bart.classList.add("fly");
  }

  function finish() {
    timers.forEach(clearTimeout);
    document.body.classList.remove("intro-on");
    document.querySelector(".brand")?.classList.add("brand-pop");
    ov.classList.add("done");
    setTimeout(() => ov.remove(), 500);
    removeEventListener("keydown", finish);
  }

  // Timeline (ms)
  at(50, () => ov.classList.add("show"));       // words fade in under the fog
  at(1700, () => ov.classList.add("part"));     // fog splits, words drift away with it
  at(2500, () => ov.classList.add("reveal"));   // BART appears
  at(3500, flyToLogo);                          // BART flies into the logo
  at(4300, finish);

  ov.addEventListener("click", finish);
  addEventListener("keydown", finish);
})();
