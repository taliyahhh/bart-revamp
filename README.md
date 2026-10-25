# BART Revamp

An interactive take on the BART system map that keeps the look of the official map and makes it easier to read one route at a time.

## Features

- **Day / Evening service**: click the Daytime or Evening legend box to switch. Daytime shows all 5 lines plus the OAK Airport connector; evening (9pm to midnight) shows Orange, Yellow (to Millbrae) and Blue. The map opens in evening mode automatically after 9pm.
- **Line spotlight**: click a line on the map or in the legend to fade everything else.
- **Trip highlight**: pick two stations in Plan a Trip (or click them on the map) to see your route, each leg, and where to transfer. It prefers fewer transfers and favors the timed transfers at MacArthur and 19th St.

## Run it

No build step. Open `index.html`, or run `npx serve .`

## Structure

```
data/bart.js   stations (x/y on a 1183 x 1008 canvas), lines, day/evening service
app.js         drawing, legend, spotlight, trip planner
style.css      map styling
index.html
```

## Ideas for later

- Live departures from the BART API (api.bart.gov)
- Bay Area layer: food, murals, parks and game days near each station
- Station pages with neighborhood history
- Mobile layout and installable PWA

Fan project, not affiliated with BART. Check bart.gov for current service.
