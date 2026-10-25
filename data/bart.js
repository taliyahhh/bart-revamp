// Station + line data for Fogline.
// Coordinates are a hand-drawn schematic (viewBox 1000 x 960), not geographic.
// label: "l" puts the station name on the left, default is right.

window.STATIONS = {
  richmond:        { name: "Richmond", x: 330, y: 80, label: "l" },
  elcerritonorte:  { name: "El Cerrito del Norte", x: 345, y: 120, label: "l" },
  elcerritoplaza:  { name: "El Cerrito Plaza", x: 360, y: 160, label: "l" },
  northberkeley:   { name: "North Berkeley", x: 375, y: 200, label: "l" },
  downtownberkeley:{ name: "Downtown Berkeley", x: 390, y: 240, label: "l" },
  ashby:           { name: "Ashby", x: 405, y: 280, label: "l" },
  macarthur:       { name: "MacArthur", x: 420, y: 330 },
  "19th":          { name: "19th St/Oakland", x: 420, y: 370 },
  "12th":          { name: "12th St/Oakland City Center", x: 420, y: 410 },
  westoakland:     { name: "West Oakland", x: 360, y: 445, label: "l" },
  embarcadero:     { name: "Embarcadero", x: 290, y: 465, label: "l" },
  montgomery:      { name: "Montgomery St", x: 265, y: 490, label: "l" },
  powell:          { name: "Powell St", x: 240, y: 515, label: "l" },
  civiccenter:     { name: "Civic Center/UN Plaza", x: 215, y: 540, label: "l" },
  "16th":          { name: "16th St Mission", x: 200, y: 585, label: "l" },
  "24th":          { name: "24th St Mission", x: 200, y: 625, label: "l" },
  glenpark:        { name: "Glen Park", x: 200, y: 665, label: "l" },
  balboapark:      { name: "Balboa Park", x: 200, y: 705, label: "l" },
  dalycity:        { name: "Daly City", x: 200, y: 750, label: "l" },
  colma:           { name: "Colma", x: 215, y: 790, label: "l" },
  ssf:             { name: "South San Francisco", x: 230, y: 830, label: "l" },
  sanbruno:        { name: "San Bruno", x: 245, y: 870, label: "l" },
  sfo:             { name: "SFO Airport", x: 310, y: 900 },
  millbrae:        { name: "Millbrae", x: 265, y: 935, label: "l" },

  rockridge:       { name: "Rockridge", x: 460, y: 290 },
  orinda:          { name: "Orinda", x: 500, y: 250 },
  lafayette:       { name: "Lafayette", x: 540, y: 215 },
  walnutcreek:     { name: "Walnut Creek", x: 580, y: 180 },
  pleasanthill:    { name: "Pleasant Hill/Contra Costa Centre", x: 620, y: 145 },
  concord:         { name: "Concord", x: 660, y: 110 },
  northconcord:    { name: "North Concord/Martinez", x: 700, y: 75, label: "l" },
  pittsburgbp:     { name: "Pittsburg/Bay Point", x: 765, y: 50, label: "t" },
  pittsburgcenter: { name: "Pittsburg Center", x: 845, y: 50, label: "b" },
  antioch:         { name: "Antioch", x: 925, y: 50, label: "b" },

  lakemerritt:     { name: "Lake Merritt", x: 470, y: 450 },
  fruitvale:       { name: "Fruitvale", x: 510, y: 490 },
  coliseum:        { name: "Coliseum", x: 550, y: 530 },
  oak:             { name: "Oakland Airport", x: 505, y: 600, label: "l" },
  sanleandro:      { name: "San Leandro", x: 590, y: 570 },
  bayfair:         { name: "Bay Fair", x: 630, y: 610 },
  castrovalley:    { name: "Castro Valley", x: 730, y: 610, label: "t" },
  westdublin:      { name: "West Dublin/Pleasanton", x: 820, y: 610, label: "b" },
  dublin:          { name: "Dublin/Pleasanton", x: 910, y: 610, label: "t" },
  hayward:         { name: "Hayward", x: 660, y: 660 },
  southhayward:    { name: "South Hayward", x: 690, y: 700 },
  unioncity:       { name: "Union City", x: 720, y: 740 },
  fremont:         { name: "Fremont", x: 750, y: 780 },
  warmsprings:     { name: "Warm Springs/South Fremont", x: 780, y: 820 },
  milpitas:        { name: "Milpitas", x: 800, y: 860 },
  berryessa:       { name: "Berryessa/North San José", x: 820, y: 900 }
};

const EAST_BAY_TRUNK = ["richmond","elcerritonorte","elcerritoplaza","northberkeley","downtownberkeley","ashby","macarthur","19th","12th"];
const SF_TRUNK = ["westoakland","embarcadero","montgomery","powell","civiccenter","16th","24th","glenpark","balboapark","dalycity"];
const PENINSULA = ["colma","ssf","sanbruno"];
const SOUTH_TRUNK = ["lakemerritt","fruitvale","coliseum","sanleandro","bayfair"];
const FREMONT_BRANCH = ["hayward","southhayward","unioncity","fremont","warmsprings","milpitas","berryessa"];
const CONCORD_BRANCH = ["antioch","pittsburgcenter","pittsburgbp","northconcord","concord","pleasanthill","walnutcreek","lafayette","orinda","rockridge","macarthur","19th","12th"];

window.LINES = {
  red:    { name: "Red",    color: "#E8283C", ends: "Richmond to Millbrae",
            stations: [...EAST_BAY_TRUNK, ...SF_TRUNK, ...PENINSULA, "millbrae"] },
  orange: { name: "Orange", color: "#F6911E", ends: "Richmond to Berryessa/North San José",
            stations: [...EAST_BAY_TRUNK, ...SOUTH_TRUNK, ...FREMONT_BRANCH] },
  yellow: { name: "Yellow", color: "#F5D10A", ends: "Antioch to SFO",
            stations: [...CONCORD_BRANCH, ...SF_TRUNK, ...PENINSULA, "sfo"] },
  yellowNight: { name: "Yellow", color: "#F5D10A", ends: "Antioch to Millbrae",
            note: "After 9pm, change trains at SFO for Millbrae.",
            stations: [...CONCORD_BRANCH, ...SF_TRUNK, ...PENINSULA, "sfo", "millbrae"] },
  green:  { name: "Green",  color: "#4DB848", ends: "Daly City to Berryessa/North San José",
            stations: [...SF_TRUNK].reverse().concat(SOUTH_TRUNK, FREMONT_BRANCH) },
  blue:   { name: "Blue",   color: "#0099D8", ends: "Daly City to Dublin/Pleasanton",
            stations: [...SF_TRUNK].reverse().concat(SOUTH_TRUNK, ["castrovalley","westdublin","dublin"]) },
  oak:    { name: "OAK Airport", color: "#A3A6A8", ends: "Coliseum to Oakland Airport",
            stations: ["coliseum","oak"] }
};

// Which lines run in each service period.
window.SERVICE = {
  day:   { label: "Daytime (until 9pm)",  lines: ["red","orange","yellow","green","blue","oak"] },
  night: { label: "Evening (9pm to midnight)", lines: ["orange","yellowNight","blue","oak"] }
};
