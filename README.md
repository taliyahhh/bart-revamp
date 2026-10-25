# Fogline

A friendlier, more personal take on the BART map. The whole Bay, one line at a time.

Fogline is a side project reimagining how the BART system map looks and feels. Instead of one dense diagram, it lets you spotlight a single line, see how service changes after 9pm, and trace your trip between any two stations.

## Features (v0.1)

- **Day / Night toggle**: daytime shows all 5 lines plus the OAK Airport connector; evening (9pm to midnight) shows the 3 lines that keep running. The whole page shifts to a night palette, and it opens in night mode automatically after 9pm.
- **Line spotlight**: tap a line to fade everything else and see exactly where it goes.
- **Trip highlight**: pick two stations (or tap them on the map) and Fogline draws your route, preferring fewer transfers, with each leg broken out.

## Run it

No build step. Open `index.html` in a browser, or:

```bash
npx serve .
```

## Project structure

```
data/bart.js   station coordinates, lines, and day/night service
app.js         map drawing, line focus, trip planner
style.css      day and night themes
index.html
```

The map is a hand-drawn schematic (coordinates in `data/bart.js`), so tweaking the layout is just editing x/y values.

## Roadmap ideas

- [ ] Real-time departures from the BART API (api.bart.gov)
- [ ] "Bay Area stuff" layer: what's near each station (food, murals, parks, Warriors / Giants game days)
- [ ] Station pages with local history and neighborhood vibe
- [ ] Fog mode: animated fog rolling over the SF side of the map
- [ ] Mobile-first redesign and installable PWA
- [ ] Accessibility pass: elevator status, high-contrast theme

## Disclaimer

Fan project, not affiliated with BART. Service info based on the 2026 BART system map; always check bart.gov for current schedules.
