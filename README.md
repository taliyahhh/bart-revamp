# Karl's Friend Bart

An interactive take on the BART system map that keeps the look of the official map and makes it easier to read one route at a time.

## Features

- **Map tab**: the system map in the style of the official BART map. Drag to pan, pinch or scroll to zoom, and use the +/- buttons on any device.
- **Bottom bar**: switch between Daytime and Evening service and tap a line chip to spotlight that line. At night, Red and Green show as "off tonight."
- **Mini trains**: little trains move along the map using BART's live departure data (positions are estimated from arrival times). If live data can't load, it falls back to estimated positions and says so. Tap the pill in the corner to hide them.
- **Station tab**: tap a station for its lines, live departures from the BART API, connections and nearby spots.
- **Alerts tab**: live delay advisories, elevator outages and service notes. An orange dot appears when there's a delay.
- **About BART tab**: an editorial page on what BART stands for, the legacy fleet versus the Fleet of the Future (illustrated trains), and key numbers.
- **Responsive**: side panel on desktop, floating sheet on tablet, bottom sheet on phones.

## Run it

No build step. Open `index.html`, or run `npx serve .`

## Structure

```
data/bart.js          stations (x/y on a 1183 x 1008 canvas), lines, day/evening service
data/station-info.js  BART API codes, connections, nearby spots
trains.js             train illustrations + About page carousel
app.js                map, pan/zoom, bottom bar, panel tabs, live data
live-trains.js        mini trains from live departures, with an estimated fallback
style.css      map styling
index.html
```

## Ideas for later

- Live departures from the BART API (api.bart.gov)
- Bay Area layer: food, murals, parks and game days near each station
- Station pages with neighborhood history
- Mobile layout and installable PWA

Fan project, not affiliated with BART. Check bart.gov for current service.
