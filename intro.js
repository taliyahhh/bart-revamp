// Opening animation: fog over the map with "Karl's Friend", the fog parts (taking the words with it),
// then "BART" appears and flies into the logo. Tap/click/any key skips. Skipped for reduced motion.
(function intro() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Fog texture: seamless SVG noise turned into soft clouds.
  // Day: white fog. Night: a dimmer, moonlit blue-gray haze so it doesn't go blotchy on the dark map.
  const night = document.documentElement.dataset.theme === "night";
  const tint = night ? "0 0 0 0 .74  0 0 0 0 .80  0 0 0 0 .90  0 0 0 .9 -0.14" : "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.35";
  const fogTex = `url("data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
      <filter id='f' x='0' y='0' width='100%' height='100%'>
        <feTurbulence type='fractalNoise' baseFrequency='${night ? 0.004 : 0.006}' numOctaves='${night ? 3 : 4}' seed='7' stitchTiles='stitch'/>
        <feColorMatrix values='${tint}'/>
      </filter>
      <rect width='600' height='600' filter='url(#f)'/>
    </svg>`)}")`;

  const ov = document.createElement("div");
  ov.className = "fog-intro" + (night ? " night" : "");
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

  // BART shrinks into the logo. Scale comes from the real text widths (both use the same
  // letter-spacing), so it lands exactly on top of the logo's BART and swaps in invisibly.
  let flight = null, done = false;
  function flyToLogo() {
    const target = document.querySelector(".brand span");
    if (!target) return finish();
    bart.getAnimations().forEach(a => a.finish()); // settle the reveal first
    const from = bart.getBoundingClientRect(), to = target.getBoundingClientRect();
    const scale = to.width / from.width;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    bart.classList.add("fly");
    flight = bart.animate(
      [{ transform: "translate(0, 0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
      { duration: 1100, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" }
    );
    flight.finished.then(finish, () => {});
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    // Swap in the real logo in the same frame the flying copy disappears.
    document.body.classList.remove("intro-on");
    bart.style.visibility = "hidden";
    flight?.cancel();
    ov.classList.add("done");
    setTimeout(() => ov.remove(), 500);
    removeEventListener("keydown", finish);
  }

  // Timeline (ms)
  at(50, () => ov.classList.add("show"));       // words fade in under the fog
  at(1700, () => ov.classList.add("part"));     // fog splits, words drift away with it
  at(2500, () => ov.classList.add("reveal"));   // BART appears
  at(3400, flyToLogo);                          // BART flies into the logo, then finish() runs when it lands

  ov.addEventListener("click", finish);
  addEventListener("keydown", finish);
})();
