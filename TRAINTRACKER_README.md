# Train Tracker (Amtrak + MTA)

This page renders a live map using OpenStreetMap tiles and Leaflet, then plots train locations for:

- Amtrak (train location map JSON)
- MTA LIRR GTFS real-time
- MTA Metro-North GTFS real-time

## Run locally

Serve the folder and enable the local proxy so CORS-blocked feeds work:

```bash
./serve-traintracker.sh
```

Then open `http://localhost:8000/traintracker.html`.

## Local proxy

`traintracker_proxy.py` serves the static files and exposes a `/proxy?url=...` endpoint.
It only allows a short list of transit hosts to avoid becoming an open proxy.

## Notes

- Some providers may block direct browser requests (CORS). The local proxy avoids this for SEPTA and VRE.
- If a feed fails to load, you may need to proxy it through a server you control.
- The GTFS real-time feeds are parsed in-browser using `gtfs-realtime-bindings` via CDN.

## Files

- `traintracker.html` – page structure and script includes
- `traintracker.js` – map logic and feed parsing
- `style.css` – Train Tracker layout styling
- `traintracker_proxy.py` – local static server + proxy for CORS-blocked feeds
