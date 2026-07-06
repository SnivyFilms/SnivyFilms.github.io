const AMTRAK_URL = "https://asm-backend.transitdocs.com/gtfs/amtrak";
const AMTRAK_STATIC_URL = "https://asm-backend.transitdocs.com/gtfs/amtrak/gtfs";
const AMTRAK_ROUTE_MAP_PATH = "amtrak-routes.json";
const AMTRAK_TRIP_MAP_PATH = "amtrak-trips.json";
const MTA_LOCATIONS_URL = "https://backend-unified.mylirr.org/locations";
const MTA_LOCATIONS_HEADERS = {
    "Accept-Version": "3.0"
};
const MBTA_API_BASE = "https://api-v3.mbta.com";
const MBTA_ROUTES_URL = `${MBTA_API_BASE}/routes?filter%5Btype%5D=2`;
const MBTA_VEHICLES_URL = `${MBTA_API_BASE}/vehicles?filter%5Broute_type%5D=2`;
const SEPTA_TRAINVIEW_URL = "https://api.septa.org/api/TrainView/index.php";
const SEPTA_PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(SEPTA_TRAINVIEW_URL);
const VRE_VEHICLE_POSITIONS_URL = "https://gtfs.vre.org/containercdngtfsupload/VehiclePositionFeed";
const VRE_VEHICLE_POSITIONS_PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(VRE_VEHICLE_POSITIONS_URL);
const BRIGHTLINE_STATUS_URL = "https://luxapi.verbinteractive.com/api/TrainStatus";
const BRIGHTLINE_PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(BRIGHTLINE_STATUS_URL);
const TRIRAIL_VEHICLES_URL = "http://trirailpublic.etaspot.net/service.php?service=get_vehicles";
const TRIRAIL_PROXY_URL = "https://api.allorigins.win/raw?url=" + encodeURIComponent(TRIRAIL_VEHICLES_URL);
const LOCAL_PROXY_PREFIX = "/proxy?url=";
const CORS_PROXY_ISOMORPHIC = "https://cors.isomorphic-git.org/";
const CORS_PROXY_FREEBOARD = "https://thingproxy.freeboard.io/fetch/";
const OPENRAILWAYMAP_URL = "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png";
const OPENRAILWAYMAP_ATTRIBUTION = "&copy; OpenRailwayMap contributors";
const GTFS_PROTO_PATH = "gtfs-realtime.proto";

let gtfsRootPromise;
let amtrakRouteMapPromise;
let amtrakTripMapPromise;
let mbtaRouteMapPromise;
let septaRouteMapPromise;

let map;

const layers = {
    amtrak: null,
    lirr: null,
    mnr: null,
    mbta: null,
    septa: null,
    vre: null,
    brightline: null,
    trirail: null
};

const markersBySource = {
    amtrak: [],
    lirr: [],
    mnr: [],
    mbta: [],
    septa: [],
    vre: [],
    brightline: [],
    trirail: []
};

let statusMessage;
let lastUpdated;
let refreshButton;
let amtrakCount;
let lirrCount;
let mnrCount;
let mbtaCount;
let septaCount;
let vreCount;
let brightlineCount;
let trirailCount;

let toggleAmtrak;
let toggleLirr;
let toggleMnr;
let toggleMbta;
let toggleSepta;
let toggleVre;
let toggleBrightline;
let toggleTrirail;

const HERITAGE_MNR_LOCOMOTIVES = new Set([
    "201",
    "203",
    "208",
    "211",
    "214",
    "216",
    "217",
    "222",
    "228",
    "229",
    "230",
    "231",
    "250"
]);

function createMap() {
    map = L.map("map", {
        zoomControl: true,
        worldCopyJump: true
    }).setView([40.75, -73.95], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    L.tileLayer(OPENRAILWAYMAP_URL, {
        attribution: OPENRAILWAYMAP_ATTRIBUTION,
        opacity: 0.7
    }).addTo(map);

    const clusterOptions = {
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    };

    layers.amtrak = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.lirr = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.mnr = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.mbta = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.septa = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.vre = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.brightline = L.markerClusterGroup(clusterOptions).addTo(map);
    layers.trirail = L.markerClusterGroup(clusterOptions).addTo(map);
}

function setStatus(message) {
    if (!statusMessage) {
        return;
    }
    statusMessage.textContent = message;
}

function updateCounts() {
    amtrakCount.textContent = markersBySource.amtrak.length;
    lirrCount.textContent = markersBySource.lirr.length;
    mnrCount.textContent = markersBySource.mnr.length;
    mbtaCount.textContent = markersBySource.mbta.length;
    septaCount.textContent = markersBySource.septa.length;
    vreCount.textContent = markersBySource.vre.length;
    brightlineCount.textContent = markersBySource.brightline.length;
    trirailCount.textContent = markersBySource.trirail.length;
}

function updateLayerVisibility() {
    if (!map) {
        return;
    }

    if (toggleAmtrak.checked) {
        map.addLayer(layers.amtrak);
    } else {
        map.removeLayer(layers.amtrak);
    }

    if (toggleLirr.checked) {
        map.addLayer(layers.lirr);
    } else {
        map.removeLayer(layers.lirr);
    }

    if (toggleMnr.checked) {
        map.addLayer(layers.mnr);
    } else {
        map.removeLayer(layers.mnr);
    }

    if (toggleMbta.checked) {
        map.addLayer(layers.mbta);
    } else {
        map.removeLayer(layers.mbta);
    }

    if (toggleSepta.checked) {
        map.addLayer(layers.septa);
    } else {
        map.removeLayer(layers.septa);
    }

    if (toggleVre.checked) {
        map.addLayer(layers.vre);
    } else {
        map.removeLayer(layers.vre);
    }

    if (toggleBrightline.checked) {
        map.addLayer(layers.brightline);
    } else {
        map.removeLayer(layers.brightline);
    }

    if (toggleTrirail.checked) {
        map.addLayer(layers.trirail);
    } else {
        map.removeLayer(layers.trirail);
    }
}

function clearLayer(sourceId) {
    if (!layers[sourceId]) {
        return;
    }
    layers[sourceId].clearLayers();
    markersBySource[sourceId] = [];
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatTrainLabel(train) {
    const candidate = train.trainNumber || train.serviceNumber || train.setNumber || train.routeName || train.label || train.route || "?";
    return String(candidate).trim() || "?";
}

function formatRouteDisplay(train) {
    if (train.routeName && train.destination) {
        return `${train.routeName} to ${train.destination}`;
    }
    if (train.routeName) {
        return train.routeName;
    }
    if (train.destination) {
        return train.destination;
    }
    return "";
}

function formatSpeedMph(value) {
    if (!Number.isFinite(value)) {
        return "";
    }
    return `${value.toFixed(1)} mph`;
}

function formatTimestamp(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }
    if (Number.isFinite(value)) {
        const normalized = value > 1000000000000 ? value : value * 1000;
        return new Date(normalized).toLocaleTimeString();
    }
    const parsed = Date.parse(String(value));
    if (Number.isNaN(parsed)) {
        return String(value);
    }
    return new Date(parsed).toLocaleTimeString();
}

function toMphFromMps(value) {
    if (!Number.isFinite(value)) {
        return null;
    }
    return value * 2.23694;
}

function formatConsistLines(consistInfo) {
    if (!consistInfo) {
        return [];
    }

    const lines = [];
    if (consistInfo.fleet) {
        let fleetLabel = consistInfo.fleet;
        if (fleetLabel === "MNR_DIESEL") {
            fleetLabel = "P32AC-DM";
        } else if (fleetLabel === "LIRR_DIESEL") {
            const dieselUnits = Array.isArray(consistInfo.dieselUnitNumbers)
                ? consistInfo.dieselUnitNumbers
                : [];
            const hasDe30 = dieselUnits.some(unit => unit >= 400 && unit <= 423);
            const hasDm30 = dieselUnits.some(unit => unit >= 500 && unit <= 522);
            if (hasDe30) {
                fleetLabel = "DE30AC";
            } else if (hasDm30) {
                fleetLabel = "DM30AC";
            }
        }
        lines.push(`Fleet: ${escapeHtml(fleetLabel)}`);
    }
    if (typeof consistInfo.coachCount === "number") {
        lines.push(`Coaches: ${consistInfo.coachCount}`);
    }
    if (typeof consistInfo.totalPassengers === "number") {
        lines.push(`Train occupancy: ${consistInfo.totalPassengers} pax`);
    }
    if (Array.isArray(consistInfo.carSummaries) && consistInfo.carSummaries.length > 0) {
        lines.push(`Cars: ${consistInfo.carSummaries.join(" | ")}`);
    }
    return lines;
}

function addMarker(sourceId, train, color) {
    const labelText = formatTrainLabel(train);
    const heritageClass = train.isHeritage ? " train-mnr-heritage" : "";
    const marker = L.marker([train.lat, train.lon], {
        icon: L.divIcon({
            className: `train-label train-${sourceId}${heritageClass}`,
            html: `<span>${escapeHtml(labelText)}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        })
    });

    const popupLines = [`${train.provider}`];
    if (train.serviceType) {
        popupLines.push(`Service: ${train.serviceType}`);
    }
    if (train.serviceNumber) {
        popupLines.push(`Service: ${train.serviceNumber}`);
    }
    if (train.setNumber) {
        popupLines.push(`Set: ${train.setNumber}`);
    }
    if (train.trainNumber && !train.serviceNumber) {
        popupLines.push(`Train: ${train.trainNumber}`);
    }
    if (Array.isArray(train.locomotiveNumbers) && train.locomotiveNumbers.length > 0) {
        popupLines.push(`Locomotive: ${train.locomotiveNumbers.join(" / ")}`);
    }
    if (train.lineName) {
        popupLines.push(`Line: ${train.lineName}`);
    }
    const routeDisplay = formatRouteDisplay(train);
    if (routeDisplay) {
        popupLines.push(`Route: ${routeDisplay}`);
    } else if (train.route) {
        popupLines.push(`Route: ${train.route}`);
    }
    if (train.currentStop) {
        popupLines.push(`Current stop: ${train.currentStop}`);
    }
    if (train.nextStop) {
        popupLines.push(`Next stop: ${train.nextStop}`);
    }
    if (train.consistSummary) {
        popupLines.push(`Consist: ${train.consistSummary}`);
    }
    if (train.speedMph !== null && train.speedMph !== undefined) {
        const speedLabel = formatSpeedMph(train.speedMph);
        if (speedLabel) {
            popupLines.push(`Speed: ${speedLabel}`);
        }
    }
    if (train.updatedAt) {
        popupLines.push(`Updated: ${train.updatedAt}`);
    }

    if (train.consistInfo) {
        popupLines.push(...formatConsistLines(train.consistInfo));
    }

    marker.bindPopup(popupLines.join("<br>"));
    layers[sourceId].addLayer(marker);
    markersBySource[sourceId].push(marker);
}

function normalizeLatLon(value) {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function extractLatLon(record) {
    if (!record || typeof record !== "object") {
        return null;
    }

    if (Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
        const [lon, lat] = record.coordinates;
        const normalizedLat = normalizeLatLon(lat);
        const normalizedLon = normalizeLatLon(lon);
        if (normalizedLat !== null && normalizedLon !== null) {
            return { lat: normalizedLat, lon: normalizedLon };
        }
    }

    const lat = normalizeLatLon(record.lat ?? record.latitude ?? record.Latitude ?? record.LAT);
    const lon = normalizeLatLon(record.lon ?? record.longitude ?? record.Longitude ?? record.LON);

    if (lat !== null && lon !== null) {
        return { lat, lon };
    }

    return null;
}

async function getAmtrakRouteMap() {
    if (amtrakRouteMapPromise) {
        return amtrakRouteMapPromise;
    }

    amtrakRouteMapPromise = Promise.all([
        fetch(AMTRAK_ROUTE_MAP_PATH)
            .then(response => (response.ok ? response.json() : {}))
            .catch(() => ({})),
        fetch(`${AMTRAK_STATIC_URL}/routes.txt`)
            .then(response => (response.ok ? response.text() : ""))
            .then(text => {
                if (!text) {
                    return {};
                }
                const map = {};
                parseCsvText(text).forEach(route => {
                    const routeId = route.route_id;
                    if (!routeId) {
                        return;
                    }
                    const name = route.route_long_name || route.route_short_name || "";
                    if (name) {
                        map[routeId] = name;
                    }
                });
                return map;
            })
            .catch(() => ({}))
    ]).then(([localMap, staticMap]) => ({
        ...staticMap,
        ...localMap
    }));

    return amtrakRouteMapPromise;
}

function parseCsvText(text) {
    const lines = text.trim().split("\n");
    if (lines.length === 0) {
        return [];
    }
    const headers = lines.shift().split(",");
    return lines.map(line => {
        const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = parts[index]?.replace(/"/g, "") ?? "";
        });
        return row;
    });
}

function normalizeTripKey(value) {
    if (!value) {
        return "";
    }
    return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function getAmtrakTripMap() {
    if (amtrakTripMapPromise) {
        return amtrakTripMapPromise;
    }

    amtrakTripMapPromise = Promise.all([
        fetch(AMTRAK_TRIP_MAP_PATH)
            .then(response => (response.ok ? response.json() : {}))
            .catch(() => ({})),
        fetch(`${AMTRAK_STATIC_URL}/trips.txt`)
            .then(response => (response.ok ? response.text() : ""))
            .then(text => {
                if (!text) {
                    return { byTripId: {}, byTripKey: {} };
                }
                const byTripId = {};
                const byTripKey = {};
                parseCsvText(text).forEach(trip => {
                    const tripId = trip.trip_id;
                    const headsign = trip.trip_headsign || "";
                    const shortName = trip.trip_short_name || "";
                    const entry = {
                        headsign,
                        shortName
                    };
                    if (tripId) {
                        byTripId[tripId] = entry;
                        const normalized = normalizeTripKey(tripId);
                        if (normalized) {
                            byTripKey[normalized] = entry;
                        }
                    }
                    if (shortName) {
                        const normalizedShort = normalizeTripKey(shortName);
                        if (normalizedShort && !byTripKey[normalizedShort]) {
                            byTripKey[normalizedShort] = entry;
                        }
                    }
                });
                return { byTripId, byTripKey };
            })
            .catch(() => ({ byTripId: {}, byTripKey: {} }))
    ]).then(([localTrips, staticTrips]) => {
        const merged = { ...staticTrips.byTripId };
        Object.entries(localTrips || {}).forEach(([tripId, headsign]) => {
            merged[String(tripId)] = { headsign: String(headsign), shortName: "" };
        });

        const byTripKey = { ...staticTrips.byTripKey };
        Object.keys(merged).forEach(tripId => {
            const normalized = normalizeTripKey(tripId);
            if (normalized) {
                byTripKey[normalized] = merged[tripId];
            }
        });

        return { byTripId: merged, byTripKey };
    });

    return amtrakTripMapPromise;
}

async function getMbtaRouteMap() {
    if (mbtaRouteMapPromise) {
        return mbtaRouteMapPromise;
    }

    mbtaRouteMapPromise = fetch(MBTA_ROUTES_URL)
        .then(response => (response.ok ? response.json() : { data: [] }))
        .then(payload => {
            const routes = new Map();
            (payload.data || []).forEach(route => {
                const id = route.id;
                if (!id) {
                    return;
                }
                const attributes = route.attributes || {};
                routes.set(id, {
                    name: attributes.long_name || attributes.short_name || id,
                    destinations: Array.isArray(attributes.direction_destinations) ? attributes.direction_destinations : []
                });
            });
            return routes;
        })
        .catch(() => new Map());

    return mbtaRouteMapPromise;
}

function extractFirstNumber(value) {
    if (!value) {
        return "";
    }
    const match = String(value).match(/\b(\d{1,4})\b/);
    return match ? match[1] : "";
}

function extractNumbers(value) {
    if (!value) {
        return [];
    }
    const matches = String(value).match(/\b(\d{3,6})\b/g) || [];
    return matches.map(match => match.trim());
}

function extractAmtrakTrainNumber(entity, vehicle) {
    const candidates = [entity?.id, vehicle?.vehicle?.id, vehicle?.vehicle?.label];
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        const match = String(candidate).match(/AMTK_(\d{1,4})/i);
        if (match) {
            return match[1];
        }
    }
    return extractFirstNumber(vehicle?.vehicle?.label) || extractFirstNumber(entity?.id);
}

function resolveTrainNumber(entity, vehicle, trip, sourceId) {
    if (sourceId === "amtrak") {
        return extractAmtrakTrainNumber(entity, vehicle);
    }

    return (
        extractFirstNumber(vehicle?.vehicle?.label) ||
        extractFirstNumber(trip?.tripId) ||
        extractFirstNumber(entity?.id)
    );
}

function resolveRouteName(routeId, sourceId, amtrakRoutes) {
    if (!routeId) {
        return "";
    }
    if (sourceId === "amtrak") {
        return amtrakRoutes[routeId] || `Route ${routeId}`;
    }
    return routeId;
}

function extractLocomotiveNumbers(vehicle, trainNumber, sourceId) {
    const labelCandidates = extractNumbers(vehicle?.vehicle?.label);
    const idCandidates = extractNumbers(vehicle?.vehicle?.id);
    const combined = [...labelCandidates, ...idCandidates]
        .filter(value => value && value !== trainNumber && !isLikelyYear(value));

    if (sourceId === "mnr") {
        return Array.from(new Set(combined));
    }

    return Array.from(new Set(combined.filter(value => value.length <= 4)));
}

function extractMtaSetNumber(vehicle) {
    const label = vehicle?.vehicle?.label;
    const id = vehicle?.vehicle?.id;

    if (label && /^\d{3,5}$/.test(label)) {
        return label;
    }

    if (id && /^\d{3,5}_.+/.test(id)) {
        return id.split("_")[0];
    }

    const numericLabel = extractFirstNumber(label);
    if (numericLabel) {
        return numericLabel;
    }

    return extractFirstNumber(id);
}

function extractMtaServiceNumber(vehicle, trip) {
    const id = vehicle?.vehicle?.id;
    if (id && /^\d{3,5}_.+/.test(id)) {
        const parts = id.split("_");
        const candidate = parts[1] || "";
        if (/^\d{1,4}$/.test(candidate)) {
            return candidate;
        }
    }

    const tripId = trip?.tripId || "";
    const matches = extractNumbers(tripId);
    if (matches.length > 0) {
        return matches[matches.length - 1];
    }

    return "";
}

function extractMtaLocationTimestamp(record) {
    const timestamp = record?.location?.timestamp;
    if (!timestamp) {
        return "";
    }
    return new Date(timestamp * 1000).toLocaleTimeString();
}

function extractMtaLocomotiveNumbers(record) {
    const cars = record?.consist?.cars;
    if (!Array.isArray(cars)) {
        return [];
    }
    const locomotives = cars
        .filter(car => car?.locomotive || car?.type === "P32")
        .map(car => String(car.number))
        .filter(Boolean);
    return Array.from(new Set(locomotives));
}

function hasMnrHeritageUnit(record) {
    const cars = record?.consist?.cars;
    if (!Array.isArray(cars)) {
        return false;
    }
    return cars.some(car => car?.type === "P32" && HERITAGE_MNR_LOCOMOTIVES.has(String(car.number)));
}

function normalizeMtaRailroadId(value) {
    const railroad = String(value || "").toUpperCase();
    if (railroad === "LIRR") {
        return "lirr";
    }
    if (railroad === "MNR" || railroad === "MNRR" || railroad === "MN" || railroad === "METRO-NORTH") {
        return "mnr";
    }
    return "";
}

function isMtaAmtrakRecord(record) {
    const details = record?.details || {};
    const candidates = [
        details.branch,
        details.branch_id,
        details.headsign,
        details.summary
    ];
    return candidates.some(value => typeof value === "string" && /amtrak/i.test(value));
}

function buildMtaTrain(record, railroadId) {
    const location = extractLatLon(record?.location || record);
    if (!location) {
        return null;
    }

    const details = record?.details || {};
    const trainNumber = String(record?.train_num || "").trim();
    const locomotiveNumbers = extractMtaLocomotiveNumbers(record);
    const cars = Array.isArray(record?.consist?.cars) ? record.consist.cars : [];
    const coachCount = cars.filter(car => !car?.locomotive).length;
    const totalPassengers = cars.reduce((sum, car) => sum + (Number.isFinite(car?.passengers) ? car.passengers : 0), 0);
    const dieselUnitNumbers = cars
        .filter(car => typeof car?.type === "string" && /DEDM/i.test(car.type))
        .map(car => Number.parseInt(car.number, 10))
        .filter(Number.isFinite);
    const carSummaries = cars.map(car => {
        const type = car?.type ? String(car.type) : "Car";
        const number = car?.number ? ` ${car.number}` : "";
        const passengers = typeof car?.passengers === "number" ? ` - ${car.passengers} pax` : "";
        return `${escapeHtml(type)}${escapeHtml(number)}${escapeHtml(passengers)}`;
    });

    return {
        provider: railroadId === "lirr" ? "MTA LIRR" : "MTA Metro-North",
        label: record?.train_id || "",
        route: details.branch_id || "",
        routeName: details.branch || "",
        destination: details.headsign || "",
        trainNumber,
        setNumber: "",
        serviceNumber: trainNumber,
        locomotiveNumbers,
        consistInfo: cars.length > 0 ? {
            fleet: record?.consist?.fleet || "",
            coachCount,
            totalPassengers,
            dieselUnitNumbers,
            carSummaries
        } : null,
        isHeritage: railroadId === "mnr" && hasMnrHeritageUnit(record),
        lat: location.lat,
        lon: location.lon,
        speedMph: Number.isFinite(record?.location?.speed) ? record.location.speed : null,
        updatedAt: extractMtaLocationTimestamp(record)
    };
}

function buildMbtaTrain(record, routeInfo) {
    const attributes = record.attributes || {};
    const lat = attributes.latitude;
    const lon = attributes.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") {
        return null;
    }

    const routeName = routeInfo?.name || "";
    const directionId = attributes.direction_id;
    const destination = Array.isArray(routeInfo?.destinations) && typeof directionId === "number"
        ? routeInfo.destinations[directionId]
        : "";
    const updatedAt = attributes.updated_at ? new Date(attributes.updated_at).toLocaleTimeString() : "";
    const label = attributes.label || record.id || "MBTA";

    return {
        provider: "MBTA Commuter Rail",
        label,
        route: routeInfo?.id || "",
        routeName,
        destination,
        trainNumber: label,
        setNumber: "",
        serviceNumber: label,
        locomotiveNumbers: [],
        isHeritage: false,
        lat,
        lon,
        speedMph: Number.isFinite(attributes.speed) ? attributes.speed : null,
        updatedAt
    };
}

function buildSeptaTrain(record) {
    const lat = Number.parseFloat(record?.lat);
    const lon = Number.parseFloat(record?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
    }

    const consistSummary = record?.consist ? String(record.consist).trim() : "";
    const lineName = record?.line ? String(record.line) : "";

    return {
        provider: "SEPTA Regional Rail",
        label: record?.trainno || "SEPTA",
        route: "",
        routeName: lineName,
        destination: record?.dest ? String(record.dest) : "",
        trainNumber: record?.trainno ? String(record.trainno) : "",
        setNumber: "",
        serviceNumber: "",
        serviceType: record?.service ? String(record.service) : "",
        locomotiveNumbers: [],
        lineName,
        currentStop: record?.currentstop ? String(record.currentstop) : "",
        nextStop: record?.nextstop ? String(record.nextstop) : "",
        consistSummary,
        isHeritage: false,
        lat,
        lon,
        speedMph: null,
        updatedAt: ""
    };
}

function buildBrightlineTrain(record) {
    const location = extractLatLon(record);
    if (!location) {
        return null;
    }

    const trainNumber = String(record?.trainNumber || record?.train_no || record?.train || record?.number || record?.id || "").trim();
    const routeName = String(record?.routeName || record?.route || record?.line || "").trim();
    const destination = String(record?.destination || record?.dest || record?.headsign || "").trim();
    const speed = Number.isFinite(record?.speed) ? record.speed : Number.parseFloat(record?.speed);

    return {
        provider: "Brightline",
        label: trainNumber || record?.name || "Brightline",
        route: routeName,
        routeName,
        destination,
        trainNumber,
        setNumber: "",
        serviceNumber: trainNumber,
        locomotiveNumbers: [],
        isHeritage: false,
        lat: location.lat,
        lon: location.lon,
        speedMph: Number.isFinite(speed) ? speed : null,
        updatedAt: formatTimestamp(record?.updatedAt || record?.lastUpdated || record?.timestamp || record?.time)
    };
}

function buildTriRailTrain(record) {
    const lat = Number.parseFloat(record?.lat);
    const lon = Number.parseFloat(record?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
    }

    const inService = Number.parseInt(record?.inService, 10);
    const scheduleNumber = record?.scheduleNumber ? String(record.scheduleNumber) : "";
    if (inService !== 1 && scheduleNumber && scheduleNumber.toUpperCase() === "NIS") {
        return null;
    }

    const equipmentId = record?.equipmentID ? String(record.equipmentID) : "";
    const routeId = record?.routeID ? String(record.routeID) : "";

    return {
        provider: "Tri-Rail",
        label: equipmentId || "Tri-Rail",
        route: routeId,
        routeName: scheduleNumber,
        destination: "",
        trainNumber: equipmentId,
        setNumber: "",
        serviceNumber: equipmentId,
        locomotiveNumbers: [],
        isHeritage: false,
        lat,
        lon,
        speedMph: null,
        updatedAt: formatTimestamp(record?.receiveTime)
    };
}

function normalizeBrightlineRecords(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.trains)) {
        return payload.trains;
    }
    if (Array.isArray(payload?.TrainStatus)) {
        return payload.TrainStatus;
    }
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }
    if (Array.isArray(payload?.items)) {
        return payload.items;
    }
    return [];
}

async function getGtfsRoot() {
    if (gtfsRootPromise) {
        return gtfsRootPromise;
    }

    if (!window.protobuf) {
        throw new Error("protobufjs not loaded.");
    }

    gtfsRootPromise = window.protobuf.load(GTFS_PROTO_PATH);
    return gtfsRootPromise;
}

async function decodeGtfsRealtime(buffer) {
    const root = await getGtfsRoot();
    const feedMessage = root.lookupType("transit_realtime.FeedMessage");
    return feedMessage.decode(new Uint8Array(buffer));
}

async function fetchAmtrak() {
    clearLayer("amtrak");

    try {
        const response = await fetch(AMTRAK_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Amtrak request failed: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const message = await decodeGtfsRealtime(buffer);
        const trains = await parseGtfsVehicles(message, "Amtrak", "amtrak");

        trains.forEach(train => addMarker("amtrak", train, "#005eb8"));
        return trains.length;
    } catch (error) {
        console.error(error);
        setStatus("Amtrak data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

async function fetchMtaLocations() {
    clearLayer("lirr");
    clearLayer("mnr");

    const totals = { lirr: 0, mnr: 0 };

    try {
        const response = await fetch(MTA_LOCATIONS_URL, {
            cache: "no-store",
            headers: MTA_LOCATIONS_HEADERS
        });
        if (!response.ok) {
            throw new Error(`MTA locations request failed: ${response.status}`);
        }

        const records = await response.json();
        if (!Array.isArray(records)) {
            return totals;
        }

        records.forEach(record => {
            const railroadId = normalizeMtaRailroadId(record?.railroad);
            if (!railroadId) {
                return;
            }
            if (isMtaAmtrakRecord(record)) {
                return;
            }

            const train = buildMtaTrain(record, railroadId);
            if (!train) {
                return;
            }

            addMarker(railroadId, train, railroadId === "lirr" ? "#ff6f00" : "#d32f2f");
            totals[railroadId] += 1;
        });

        return totals;
    } catch (error) {
        console.error(error);
        setStatus("MTA data failed to load. The endpoint may block browser requests.");
        return totals;
    }
}

async function fetchMbtaCommuterRail() {
    clearLayer("mbta");

    try {
        const [routes, vehiclesResponse] = await Promise.all([
            getMbtaRouteMap(),
            fetch(MBTA_VEHICLES_URL, { cache: "no-store" })
        ]);

        if (!vehiclesResponse.ok) {
            throw new Error(`MBTA vehicles request failed: ${vehiclesResponse.status}`);
        }

        const vehiclesPayload = await vehiclesResponse.json();
        const vehicles = Array.isArray(vehiclesPayload.data) ? vehiclesPayload.data : [];

        vehicles.forEach(vehicle => {
            const routeId = vehicle.relationships?.route?.data?.id || "";
            const routeInfo = routes instanceof Map && routes.has(routeId)
                ? { id: routeId, ...routes.get(routeId) }
                : { id: routeId, name: routeId, destinations: [] };
            const train = buildMbtaTrain(vehicle, routeInfo);
            if (!train) {
                return;
            }
            addMarker("mbta", train, "#80276C");
        });

        return vehicles.length;
    } catch (error) {
        console.error(error);
        setStatus("MBTA data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

async function fetchSeptaTrains() {
    clearLayer("septa");

    try {
        const response = await fetchWithFallback(
            null,
            buildProxyFallbacks(SEPTA_TRAINVIEW_URL, SEPTA_PROXY_URL),
            { cache: "no-store" }
        );

        const records = await response.json();

        if (!Array.isArray(records)) {
            return 0;
        }

        let count = 0;

        records.forEach(record => {
            const train = buildSeptaTrain(record);

            if (!train) return;

            addMarker("septa", train, "#F14728");
            count++;
        });

        return count;

    } catch (error) {
        console.error("SEPTA request error:", error);
        setStatus("SEPTA data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

async function fetchVreVehiclePositions() {
    clearLayer("vre");

    try {
        const response = await fetchWithFallback(
            null,
            buildProxyFallbacks(VRE_VEHICLE_POSITIONS_URL, VRE_VEHICLE_POSITIONS_PROXY_URL),
            { cache: "no-store" }
        );

        const buffer = await response.arrayBuffer();
        const message = await decodeGtfsRealtime(buffer);
        const trains = await parseGtfsVehicles(message, "VRE", "vre");

        trains.forEach(train => addMarker("vre", train, "#004b8d"));
        return trains.length;
    } catch (error) {
        console.error("VRE request error:", error);
        setStatus("VRE data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

async function fetchBrightlineTrains() {
    clearLayer("brightline");

    try {
        const response = await fetchWithFallback(
            null,
            buildProxyFallbacks(BRIGHTLINE_STATUS_URL, BRIGHTLINE_PROXY_URL),
            { cache: "no-store" }
        );
        const payload = await response.json();
        const records = normalizeBrightlineRecords(payload);

        let count = 0;
        records.forEach(record => {
            const train = buildBrightlineTrain(record);
            if (!train) {
                return;
            }
            addMarker("brightline", train, "#ffeb3b");
            count++;
        });

        return count;
    } catch (error) {
        console.error("Brightline request error:", error);
        setStatus("Brightline data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

async function fetchTriRailTrains() {
    clearLayer("trirail");

    try {
        const response = await fetchWithFallback(
            null,
            buildProxyFallbacks(TRIRAIL_VEHICLES_URL, TRIRAIL_PROXY_URL),
            { cache: "no-store" }
        );
        const payload = await response.json();
        const records = Array.isArray(payload?.get_vehicles) ? payload.get_vehicles : [];

        let count = 0;
        records.forEach(record => {
            const train = buildTriRailTrain(record);
            if (!train) {
                return;
            }
            addMarker("trirail", train, "#4fc3f7");
            count++;
        });

        return count;
    } catch (error) {
        console.error("Tri-Rail request error:", error);
        setStatus("Tri-Rail data failed to load. The endpoint may block browser requests.");
        return 0;
    }
}

function refreshLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = `Last update: ${now.toLocaleTimeString()}`;
}

function maybeFitBounds() {
    const allMarkers = [
        ...markersBySource.amtrak,
        ...markersBySource.lirr,
        ...markersBySource.mnr,
        ...markersBySource.mbta,
        ...markersBySource.septa,
        ...markersBySource.vre,
        ...markersBySource.brightline,
        ...markersBySource.trirail
    ];
    if (allMarkers.length === 0 || !map) {
        return;
    }

    const group = L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
}

async function refreshData() {
    setStatus("Refreshing train data...");

    const amtrakPromise = fetchAmtrak();
    const mtaPromise = fetchMtaLocations();
    const mbtaPromise = fetchMbtaCommuterRail();
    const septaPromise = fetchSeptaTrains();
    const vrePromise = fetchVreVehiclePositions();
    const trirailPromise = fetchTriRailTrains();

    const [amtrakTotal, mtaTotals, mbtaTotal, septaTotal, vreTotal, trirailTotal] = await Promise.all([
        amtrakPromise,
        mtaPromise,
        mbtaPromise,
        septaPromise,
        vrePromise,
        trirailPromise
    ]);
    const lirrTotal = mtaTotals.lirr || 0;
    const mnrTotal = mtaTotals.mnr || 0;

    updateCounts();
    updateLayerVisibility();
    refreshLastUpdated();
    setStatus("Data updated.");

    if (amtrakTotal + lirrTotal + mnrTotal + mbtaTotal + septaTotal + vreTotal + trirailTotal > 0) {
        maybeFitBounds();
    }
}

function attachListeners() {
    toggleAmtrak.addEventListener("change", updateLayerVisibility);
    toggleLirr.addEventListener("change", updateLayerVisibility);
    toggleMnr.addEventListener("change", updateLayerVisibility);
    toggleMbta.addEventListener("change", updateLayerVisibility);
    toggleSepta.addEventListener("change", updateLayerVisibility);
    toggleVre.addEventListener("change", updateLayerVisibility);
    toggleBrightline.addEventListener("change", updateLayerVisibility);
    toggleTrirail.addEventListener("change", updateLayerVisibility);
    refreshButton.addEventListener("click", () => {
        refreshData();
    });
}

function initTrainTracker() {
    statusMessage = document.getElementById("status-message");
    lastUpdated = document.getElementById("last-updated");
    refreshButton = document.getElementById("refresh-button");
    amtrakCount = document.getElementById("amtrak-count");
    lirrCount = document.getElementById("lirr-count");
    mnrCount = document.getElementById("mnr-count");
    mbtaCount = document.getElementById("mbta-count");
    septaCount = document.getElementById("septa-count");
    vreCount = document.getElementById("vre-count");
    brightlineCount = document.getElementById("brightline-count");
    trirailCount = document.getElementById("trirail-count");

    toggleAmtrak = document.getElementById("toggle-amtrak");
    toggleLirr = document.getElementById("toggle-lirr");
    toggleMnr = document.getElementById("toggle-mnr");
    toggleMbta = document.getElementById("toggle-mbta");
    toggleSepta = document.getElementById("toggle-septa");
    toggleVre = document.getElementById("toggle-vre");
    toggleBrightline = document.getElementById("toggle-brightline");
    toggleTrirail = document.getElementById("toggle-trirail");

    if (!window.L || !window.L.markerClusterGroup) {
        setStatus("Map libraries failed to load. Check network access for Leaflet and MarkerCluster.");
        return;
    }

    createMap();
    attachListeners();
    refreshData();
}

document.addEventListener("DOMContentLoaded", initTrainTracker);

function buildProxyFallbacks(url, encodedProxyUrl) {
    return [
        `${LOCAL_PROXY_PREFIX}${encodeURIComponent(url)}`,
        encodedProxyUrl,
        `${CORS_PROXY_ISOMORPHIC}${url}`,
        `${CORS_PROXY_FREEBOARD}${url}`
    ];
}

async function fetchWithFallback(primaryUrl, fallbackUrls, options) {
    let lastError;
    const urls = [primaryUrl, ...(fallbackUrls || [])].filter(Boolean);

    const attempt = async (targetUrl) => {
        const response = await fetch(targetUrl, options);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response;
    };

    for (const targetUrl of urls) {
        try {
            return await attempt(targetUrl);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Request failed.");
}

async function parseGtfsVehicles(message, providerName, sourceId) {
    const trains = [];
    const amtrakRoutes = sourceId === "amtrak" ? await getAmtrakRouteMap() : {};
    const amtrakTrips = sourceId === "amtrak" ? await getAmtrakTripMap() : { byTripId: {}, byTripKey: {} };

    message.entity.forEach(entity => {
        const vehicle = entity.vehicle;
        if (!vehicle?.position) {
            return;
        }

        const lat = vehicle.position.latitude;
        const lon = vehicle.position.longitude;
        if (typeof lat !== "number" || typeof lon !== "number") {
            return;
        }

        const trip = vehicle.trip || {};
        const trainNumber = resolveTrainNumber(entity, vehicle, trip, sourceId);
        const tripKey = normalizeTripKey(trip.tripId);
        const tripInfo = sourceId === "amtrak"
            ? (amtrakTrips.byTripId[trip.tripId] || amtrakTrips.byTripKey[tripKey] || {})
            : {};
        const routeId = trip.routeId || "";
        const routeName = resolveRouteName(routeId, sourceId, amtrakRoutes);
        const locomotiveNumbers = sourceId === "amtrak" ? [] : extractLocomotiveNumbers(vehicle, trainNumber, sourceId);
        const setNumber = sourceId === "lirr" || sourceId === "mnr" ? extractMtaSetNumber(vehicle) : "";
        const serviceNumber = sourceId === "lirr" || sourceId === "mnr" ? extractMtaServiceNumber(vehicle, trip) : "";
        const isHeritage = sourceId === "mnr" && locomotiveNumbers.some(value => HERITAGE_MNR_LOCOMOTIVES.has(value));
        const updatedAt = vehicle.timestamp ? new Date(vehicle.timestamp * 1000).toLocaleTimeString() : "";
        const speedMph = toMphFromMps(vehicle.position.speed);

        trains.push({
            provider: providerName,
            label: trip.tripId || entity.id || "",
            route: routeId,
            routeName,
            destination: tripInfo.headsign || "",
            trainNumber,
            setNumber,
            serviceNumber,
            locomotiveNumbers,
            isHeritage,
            lat,
            lon,
            speedMph,
            updatedAt
        });
    });

    return trains;
}
