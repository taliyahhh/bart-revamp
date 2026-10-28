// Karl's Friend Bart data. Coordinates use a 1183 x 1008 viewBox laid out like the
// official system map. label: L/R/T/B = which side the name sits on.
// bold: terminal stations. wp: true = a bend in the track, not a station.
// g = trunk group, used to decide how parallel lines are spaced.

// BART runs on Bay Area time, so service hours use Pacific time no matter where the viewer is.
window.bayClock = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", hour12: false, weekday: "short",
    hour: "numeric", minute: "numeric", second: "numeric"
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { h: +p.hour % 24, m: +p.minute, s: +p.second, day: p.weekday };
};

window.STATIONS = {
  // Richmond trunk
  richmond:         { name: "Richmond", x: 340, y: 120, label: "L", bold: true, g: "EB" },
  elcerritonorte:   { name: "El Cerrito del Norte", x: 377, y: 167, label: "L", g: "EB" },
  elcerritoplaza:   { name: "El Cerrito Plaza", x: 397, y: 192, label: "L", g: "EB" },
  northberkeley:    { name: "North Berkeley", x: 419, y: 219, label: "L", g: "EB" },
  downtownberkeley: { name: "Downtown Berkeley", x: 440, y: 244, label: "L", g: "EB" },
  ashby:            { name: "Ashby", x: 461, y: 269, label: "L", g: "EB" },
  w_eb:             { x: 488, y: 300, wp: true, g: "EB" },
  macarthur:        { name: "MacArthur", x: 490, y: 313, label: "R", g: "EB", note: "Timed transfer (southbound)" },
  "19th":           { name: "19th St/Oakland", x: 490, y: 340, label: "R", g: "EB", note: "Timed transfer (northbound)" },
  "12th":           { name: "12th St/Oakland City Center", x: 490, y: 365, label: "R", g: "EB" },
  w_jn:             { x: 488, y: 390, wp: true, g: "EB" },

  // San Francisco trunk
  westoakland:      { name: "West Oakland", x: 455, y: 410, label: "T", g: "SF" },
  w_sfc:            { x: 372, y: 410, wp: true, g: "SF" },
  embarcadero:      { name: "Embarcadero", x: 352, y: 418, label: "L", gap: 12, g: "SF" },
  montgomery:       { name: "Montgomery St", x: 334, y: 434, label: "L", gap: 12, g: "SF" },
  powell:           { name: "Powell St", x: 316, y: 450, label: "L", gap: 12, g: "SF" },
  civiccenter:      { name: "Civic Center/UN Plaza", x: 298, y: 466, label: "L", gap: 12, g: "SF" },
  w_sf2:            { x: 282, y: 492, wp: true, g: "SF" },
  "16th":           { name: "16th St Mission", x: 282, y: 527, label: "L", g: "SF" },
  "24th":           { name: "24th St Mission", x: 282, y: 553, label: "L", g: "SF" },
  glenpark:         { name: "Glen Park", x: 282, y: 580, label: "L", g: "SF" },
  balboapark:       { name: "Balboa Park", x: 282, y: 605, label: "L", g: "SF" },
  dalycity:         { name: "Daly City", x: 282, y: 650, label: "L", bold: true, g: "SF" },

  // Peninsula
  w_pen:            { x: 284, y: 668, wp: true, g: "PEN" },
  colma:            { name: "Colma", x: 302, y: 698, label: "L", g: "PEN" },
  ssf:              { name: "South San Francisco", x: 332, y: 724, label: "L", g: "PEN" },
  sanbruno:         { name: "San Bruno", x: 360, y: 744, label: "L", g: "PEN" },
  sfo:              { name: "San Francisco International Airport (SFO)", short: "SFO Airport", x: 406, y: 778, label: "L", gap: 14, bold: true, g: "PEN" },
  millbrae:         { name: "Millbrae", x: 428, y: 812, label: "L", bold: true, g: "PEN" },

  // Concord / Antioch branch
  rockridge:        { name: "Rockridge", x: 522, y: 270, label: "R", g: "YB" },
  orinda:           { name: "Orinda", x: 548, y: 244, label: "R", g: "YB" },
  lafayette:        { name: "Lafayette", x: 574, y: 218, label: "R", g: "YB" },
  walnutcreek:      { name: "Walnut Creek", x: 600, y: 193, label: "R", g: "YB" },
  pleasanthill:     { name: "Pleasant Hill/Contra Costa Centre", x: 626, y: 167, label: "R", g: "YB" },
  concord:          { name: "Concord", x: 654, y: 139, label: "R", g: "YB" },
  w_nc:             { x: 690, y: 105, wp: true, g: "YB" },
  northconcord:     { name: "North Concord/Martinez", x: 718, y: 104, label: "TL", g: "YB" },
  pittsburgbp:      { name: "Pittsburg/Bay Point", x: 790, y: 104, label: "T", bold: true, g: "YB" },
  pittsburgcenter:  { name: "Pittsburg Center", x: 880, y: 104, label: "T", g: "YB" },
  antioch:          { name: "Antioch", x: 928, y: 104, label: "R", bold: true, g: "YB" },

  // Oakland to Bay Fair
  w_s:              { x: 492, y: 398, wp: true, g: "SOUTH" },
  w_lm:             { x: 496, y: 410, wp: true, g: "SOUTH" },
  lakemerritt:      { name: "Lake Merritt", x: 512, y: 420, label: "R", g: "SOUTH" },
  fruitvale:        { name: "Fruitvale", x: 540, y: 447, label: "R", g: "SOUTH" },
  coliseum:         { name: "Coliseum", x: 570, y: 477, label: "R", g: "SOUTH" },
  sanleandro:       { name: "San Leandro", x: 597, y: 504, label: "R", g: "SOUTH" },
  bayfair:          { name: "Bay Fair", x: 627, y: 534, label: "R", g: "SOUTH", note: "Timed transfer (Blue and Orange)", panelOnly: true },

  // OAK connector
  w_oak:            { x: 572, y: 520, wp: true, g: "OAK" },
  oak:              { name: "Oakland International Airport (OAK)", short: "Oakland Airport", x: 572, y: 562, label: "L", bold: true, g: "OAK" },

  // Dublin branch
  w_db:             { x: 657, y: 565, wp: true, g: "DB" },
  castrovalley:     { name: "Castro Valley", x: 792, y: 565, label: "T", g: "DB" },
  westdublin:       { name: "West Dublin/Pleasanton", x: 866, y: 565, label: "T", g: "DB" },
  dublin:           { name: "Dublin/Pleasanton", x: 935, y: 565, label: "R", bold: true, g: "DB" },

  // Fremont / San José branch
  hayward:          { name: "Hayward", x: 690, y: 590, label: "R", g: "FREM" },
  southhayward:     { name: "South Hayward", x: 722, y: 622, label: "R", g: "FREM" },
  unioncity:        { name: "Union City", x: 755, y: 655, label: "R", g: "FREM" },
  fremont:          { name: "Fremont", x: 787, y: 687, label: "R", g: "FREM" },
  w_fr:             { x: 833, y: 735, wp: true, g: "FREM" },
  warmsprings:      { name: "Warm Springs/South Fremont", x: 835, y: 748, label: "R", g: "FREM" },
  milpitas:         { name: "Milpitas", x: 835, y: 786, label: "R", g: "FREM" },
  berryessa:        { name: "Berryessa/North San José", x: 835, y: 822, label: "R", bold: true, g: "FREM" }
};

const EB = ["richmond","elcerritonorte","elcerritoplaza","northberkeley","downtownberkeley","ashby","w_eb","macarthur","19th","12th"];
const SF = ["westoakland","w_sfc","embarcadero","montgomery","powell","civiccenter","w_sf2","16th","24th","glenpark","balboapark","dalycity"];
const PEN = ["w_pen","colma","ssf","sanbruno"];
const SOUTH = ["lakemerritt","fruitvale","coliseum","sanleandro","bayfair"];
const FREM = ["hayward","southhayward","unioncity","fremont","w_fr","warmsprings","milpitas","berryessa"];
const YB = ["antioch","pittsburgcenter","pittsburgbp","northconcord","w_nc","concord","pleasanthill","walnutcreek","lafayette","orinda","rockridge"];

// slots: sideways offset (px) per trunk group so parallel lines sit side by side.
window.LINES = {
  red:    { name: "Red Line", letter: "R", color: "#ED1C24", ends: "Richmond - Millbrae",
            path: [...EB, "w_jn", ...SF, ...PEN, "sfo", "millbrae"],
            slots: { EB: 3.5, SF: 10.5, PEN: 3.5 } },
  orange: { name: "Orange Line", letter: "O", color: "#F7941D", ends: "Richmond - Berryessa/North San José",
            path: [...EB, "w_s", ...SOUTH, ...FREM],
            slots: { EB: -3.5, SOUTH: 7, FREM: 3.5 } },
  yellow: { name: "Yellow Line", letter: "Y", color: "#FFD200", ends: "Antioch - SFO Int'l Airport",
            path: [...YB, "macarthur", "19th", "12th", "w_jn", ...SF, ...PEN, "sfo"],
            slots: { YB: 0, EB: -10.5, SF: 3.5, PEN: -3.5 } },
  yellowNight: { name: "Yellow Line", letter: "Y", color: "#FFD200", ends: "Antioch - Millbrae",
            note: "After 9pm, change trains at SFO for Millbrae service.",
            path: [...YB, "macarthur", "19th", "12th", "w_jn", ...SF, ...PEN, "sfo", "millbrae"],
            slots: { YB: 0, EB: -10.5, SF: 3.5, PEN: -3.5 } },
  green:  { name: "Green Line", letter: "G", color: "#4DB848", ends: "Daly City - Berryessa/North San José",
            path: [...FREM].reverse().concat([...SOUTH].reverse(), ["w_lm"], SF),
            slots: { FREM: 3.5, SOUTH: 0, SF: -10.5 } },
  blue:   { name: "Blue Line", letter: "B", color: "#00A6E2", ends: "Daly City - Dublin/Pleasanton",
            path: ["dublin","westdublin","castrovalley","w_db"].concat([...SOUTH].reverse(), ["w_lm"], SF),
            slots: { DB: 0, SOUTH: 7, SF: -3.5 } },
  oak:    { name: "OAK Airport", letter: "✈", color: "#A7A9AC", ends: "Coliseum - Oakland Int'l Airport",
            path: ["coliseum","w_oak","oak"], slots: {} }
};

window.SERVICE = {
  day:   { title: "Daytime Service", sub: "Every day until 9pm",
           lines: ["red","orange","yellow","green","blue","oak"] },
  night: { title: "Evening Service", sub: "Every day 9pm-Midnight",
           lines: ["orange","yellowNight","blue","oak"],
           gone: [["red", "Red Line", "O", "Y"], ["green", "Green Line", "O", "B"]] }
};
