// app/Hospitales/page.js
"use client";

import Header from "../Header/Header";
import { useEffect, useRef, useState } from "react";

export default function Hospitales() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [busquedaActiva, setBusquedaActiva] = useState(false);

  const defaultLayerRef = useRef(null);
  const nasaLayerRef = useRef(null);
  const populationLayerRef = useRef(null);
  const urbanLayerRef = useRef(null);

  const [hospitalMarkers, setHospitalMarkers] = useState([]);
  const [noCoverageCircles, setNoCoverageCircles] = useState([]);
  const [countriesGeoJSON, setCountriesGeoJSON] = useState(null);
  const [countriesLayer, setCountriesLayer] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [busquedaKm, setBusquedaKm] = useState(100);

  const searchTimeoutRef = useRef(null);

  const COUNTRIES_GEOJSON_URL =
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

  // styles (unchanged)
  const baseCountryStyle = { color: "#aaa", weight: 1, fillColor: "#ececec", fillOpacity: 0.5 };
  const selectedStyle = { color: "#000", weight: 2, fillColor: "#FFEB3B", fillOpacity: 0.6 };
  const neighborStyle = { color: "#555", weight: 1.5, fillColor: "#FEB24C", fillOpacity: 0.45 };

  // init map (unchanged)
  useEffect(() => {
    let L;
    let leafletCssLoaded = false;
    (async () => {
      if (!mapRef.current) return;
      // Dynamically import Leaflet and CSS
      await import("leaflet/dist/leaflet.css");
      L = (await import("leaflet")).default;
      leafletCssLoaded = true;

      const map = L.map(mapRef.current, { center: [20, 0], zoom: 2 });
      defaultLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    })();
  }, []);

  // layers (unchanged)
  const addPopulationLayer = (map, date = "2020-10-01") => {
    populationLayerRef.current = L.tileLayer(
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GPW_Population_Density_2020/default/2020-01-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
      { maxZoom: 9, zIndex: 500, attribution: "NASA GIBS" }
    );
    populationLayerRef.current.addTo(map);
  };

  const addUrbanLayer = (map, date = "2020-10-01") => {
    urbanLayerRef.current = L.tileLayer(
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Probabilities_of_Urban_Expansion_2000_2030/default/{time}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
      { maxZoom: 9, zIndex: 500, attribution: "NASA GIBS" }
    );
    urbanLayerRef.current.addTo(map);
  };

  const handlePopulationToggle = (e) => {
    const checked = e.target.checked;
    const map = mapInstanceRef.current;
    if (!map) return;
    if (populationLayerRef.current) map.removeLayer(populationLayerRef.current);
    if (checked) addPopulationLayer(map, "2020-10-01");
  };

  const handleUrbanToggle = (e) => {
    const checked = e.target.checked;
    const map = mapInstanceRef.current;
    if (!map) return;
    if (urbanLayerRef.current) map.removeLayer(urbanLayerRef.current);
    if (checked) addUrbanLayer(map, "2020-10-01");
  };

  const handleLayerToggle = (e) => {
    const useNasa = e.target.checked;
    const map = mapInstanceRef.current;
    if (!map) return;

    if (defaultLayerRef.current) map.removeLayer(defaultLayerRef.current);
    if (nasaLayerRef.current) map.removeLayer(nasaLayerRef.current);

    if (useNasa) {
      nasaLayerRef.current = L.tileLayer(
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-10-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
        { maxZoom: 9, zIndex: 500, attribution: "NASA GIBS" }
      ).addTo(map);
    } else {
      defaultLayerRef.current.addTo(map);
    }
    
  };

  // countries load (fixed for SSR)
  useEffect(() => {
    let L;
    const loadCountries = async () => {
      try {
        // Dynamically import Leaflet only on client
        L = (await import("leaflet")).default;
        const res = await fetch(COUNTRIES_GEOJSON_URL);
        const geo = await res.json();
        setCountriesGeoJSON(geo);

        const layer = L.geoJSON(geo, {
          style: baseCountryStyle,
          onEachFeature: (feature, layer) => {
            const name =
              feature.properties.ADMIN ||
              feature.properties.NAME ||
              feature.properties.name ||
              "Sin nombre";
            layer.bindPopup(`<strong>${name}</strong>`);
          },
        });

        if (mapInstanceRef.current) {
          layer.addTo(mapInstanceRef.current);
          setCountriesLayer(layer);
        }
      } catch (err) {
        console.error("Error cargando GeoJSON de países:", err);
      }
    };

    loadCountries();
  }, []); // eslint-disable-line

  // helpers (unchanged)
  const collectCoordsPairs = (feature) => {
    const pairs = [];
    const geom = feature.geometry;
    if (!geom) return pairs;
    const pushPair = (lon, lat) => pairs.push(`${lat.toFixed(6)},${lon.toFixed(6)}`);
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) for (const c of ring) pushPair(c[0], c[1]);
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) for (const ring of poly) for (const c of ring) pushPair(c[0], c[1]);
    }
    return pairs;
  };
  const hasSharedVertex = (featA, featB) => {
    const setA = new Set(collectCoordsPairs(featA));
    const bPairs = collectCoordsPairs(featB);
    for (const p of bPairs) if (setA.has(p)) return true;
    return false;
  };
  const findCountryFeature = (query) => {
    if (!countriesGeoJSON) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    for (const feature of countriesGeoJSON.features) {
      const candidates = [
        feature.properties.ADMIN,
        feature.properties.NAME,
        feature.properties.name,
        feature.properties.SOVEREIGNT,
        feature.properties.ADMIN_A3,
      ];
      for (const val of candidates) {
        if (!val) continue;
        if (String(val).toLowerCase().indexOf(q) !== -1) return feature;
      }
    }
    return null;
  };

  const highlightCountryAndNeighbors = (feature) => {
    setBusquedaActiva(true);
    if (!countriesLayer || !mapInstanceRef.current) return;

    countriesLayer.resetStyle?.();
    setSelectedCountryId(null);

    const allLayers = [];
    countriesLayer.eachLayer((lyr) => lyr.feature && allLayers.push(lyr));

    let targetLayer = null;
    for (const lyr of allLayers) {
      const a = lyr.feature.properties.ISO_A3 || lyr.feature.properties.ISO3 || lyr.feature.properties.ADM0_A3;
      const b = feature.properties.ISO_A3 || feature.properties.ISO3 || feature.properties.ADM0_A3;
      if (a && b && a === b) { targetLayer = lyr; break; }
    }
    if (!targetLayer) {
      const nameToFind = feature.properties.ADMIN || feature.properties.NAME || feature.properties.name;
      for (const lyr of allLayers) {
        const n = lyr.feature.properties.ADMIN || lyr.feature.properties.NAME || lyr.feature.properties.name;
        if (n && nameToFind && n === nameToFind) { targetLayer = lyr; break; }
      }
    }
    if (!targetLayer) {
      const fGeomStr = JSON.stringify(feature.geometry);
      for (const lyr of allLayers) if (JSON.stringify(lyr.feature.geometry) === fGeomStr) { targetLayer = lyr; break; }
    }
    if (!targetLayer) return;

    targetLayer.setStyle(selectedStyle);
    mapInstanceRef.current.fitBounds(targetLayer.getBounds(), { padding: [20, 20] });

    const neighbors = [];
    const selBounds = targetLayer.getBounds();
    for (const lyr of allLayers) {
      if (lyr === targetLayer) continue;
      const b = lyr.getBounds();
      if (!selBounds.intersects(b)) continue;
      if (hasSharedVertex(targetLayer.feature, lyr.feature)) neighbors.push(lyr);
    }
    neighbors.forEach((n) => n.setStyle(neighborStyle));

    setSelectedCountryId(
      feature.properties.ISO_A3 ||
        feature.properties.ISO3 ||
        feature.properties.ADM0_A3 ||
        feature.properties.ADMIN ||
        feature.properties.NAME ||
        null
    );
  };

  const handleSearchInput = (raw) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const query = raw.trim();
      if (!query || !countriesGeoJSON) return;
      const found = findCountryFeature(query);
      if (found) highlightCountryAndNeighbors(found);
    }, 500);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      const query = e.target.value.trim();
      if (!query) return;
      const found = findCountryFeature(query);
      if (found) highlightCountryAndNeighbors(found);
    }
  };

  // hospitals (unchanged)
  const handleHospitalsToggle = async (e) => {
    const checked = e.target.checked;
    if (!checked) {
      hospitalMarkers.forEach((m) => m.remove());
      setHospitalMarkers([]);
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});out;`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const Hicon = L.icon({
        iconUrl:
          "https://t4.ftcdn.net/jpg/01/69/76/45/360_F_169764523_7ysH07dmxLZmN0yHcZFWwrFXrxWckEMh.jpg",
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10],
      });

      const markers = data.elements
        .map((el) => (el.lat && el.lon ? L.marker([el.lat, el.lon], { icon: Hicon }).addTo(map) : null))
        .filter(Boolean);

      setHospitalMarkers(markers);
    } catch (err) {
      console.error("Error al cargar hospitales:", err);
    }
  };

  // no coverage (unchanged)
  const handleNoCoverageToggle = async (e) => {
    const checked = e.target.checked;
    if (!checked) {
      noCoverageCircles.forEach((c) => c.remove());
      setNoCoverageCircles([]);
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    const b = map.getBounds();
    const radioKm = parseInt(busquedaKm);

    const puntos = [
      [(b.getNorth() + b.getSouth()) / 2, (b.getWest() + b.getEast()) / 2],
      [b.getNorth(), b.getWest()],
      [b.getNorth(), b.getEast()],
      [b.getSouth(), b.getWest()],
      [b.getSouth(), b.getEast()],
    ];

    const circles = [];
    for (const [lat, lon] of puntos) {
      const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](around:${radioKm *
        1000},${lat},${lon});out;`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.elements || data.elements.length === 0) {
          const circle = L.circle([lat, lon], {
            radius: radioKm * 1000,
            color: "red",
            weight: 2,
            fillOpacity: 0.15,
          }).addTo(map);
          circles.push(circle);
        }
      } catch (err) {
        console.error("Error consultando área sin cobertura:", err);
      }
    }
    setNoCoverageCircles(circles);
  };

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="heroWrap">
          <div className="titles">
            <span className="badge">Healthcare</span>
            <h1>Where do new healthcare facilities need to be set up?</h1>
            <p>
              Search a country, see neighbors, overlay hospitals and population density, and find
              areas potentially lacking coverage within a chosen search radius.
            </p>
          </div>
        </div>
      </section>

      {/* FULL-BLEED MAP */}
      <section className="mapBleed">
        {/* Control panel — same controls, nicer UI */}
        <div className="panel">
          <div className="group">
            <label className="check">
              <input type="checkbox" onChange={handleLayerToggle} />
              <span>NASA True Color basemap</span>
            </label>
          </div>

          <div className="group">
            <label className="field">
              <span>Search country</span>
              <input
                type="text"
                placeholder="e.g., México, Brazil, France…"
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>
          </div>

            <div className="inlineChecks">
              <label className={`check ${!busquedaActiva ? "disabled" : ""}`}>
                <input type="checkbox" onChange={handleNoCoverageToggle} disabled={!busquedaActiva} />
                <span>No-coverage areas</span>
              </label>
              <label className={`check ${!busquedaActiva ? "disabled" : ""}`}>
                <input type="checkbox" onChange={handleHospitalsToggle} disabled={!busquedaActiva} />
                <span>Nearby hospitals</span>
              </label>
            </div>

          <div className="group">
            <label className="field">
              <span>Search radius (km)</span>
              <input
                type="range"
                min="10"
                max="300"
                value={busquedaKm}
                onChange={(e) => setBusquedaKm(e.target.value)}
              />
              <div className="rangeVal">{busquedaKm} km</div>
            </label>
          </div>

          <div className="group">
            <div className="subhead">Overlays</div>
            <label className="check">
              <input type="checkbox" onChange={handlePopulationToggle} />
              <span>GPW Population Density 2020</span>
            </label>
           
          </div>

          <div className="hint">
            Tip: Run a country search first to enable “No-coverage” and “Hospitals” tools.
          </div>
        </div>

        {/* Map container (same ref & behavior) */}
        <div id="map" ref={mapRef} className="mapFull" />
      </section>

      <style jsx>{`
        :global(.leaflet-container) { background: #0b1220; }
        :global(.leaflet-control-attribution) { font-size: 11px; }

        .hero {
          background:
            radial-gradient(1200px 400px at 50% -80px, rgba(56,189,248,.25), transparent 60%),
            linear-gradient(180deg, #020617, #071827 40%, #0b1722 100%);
          color: #e6f6ff; border-bottom: 1px solid rgba(148,163,184,.2);
        }
        .heroWrap {
          max-width: 1100px; margin: 0 auto; padding: 32px 16px;
        }
        .badge {
          display: inline-block; padding: 4px 10px; border-radius: 999px;
          background: #0ea5e980; color: #04283b; font-size: 12px; font-weight: 800;
          border: 1px solid #7dd3fc;
        }
        h1 { margin: 8px 0 6px; font-size: 32px; line-height: 1.2 }
        .hero p { margin: 0; opacity: .95; max-width: 70ch }

        /* Full-bleed map */
        .mapBleed {
          position: relative;
          width: 100vw;
          margin-left: 50%;
          transform: translateX(-50%);
          background: #020617;
        }
        .mapFull {
          height: min(84vh, 900px);
          width: 100%;
        }

        /* Glass control panel */
        .panel {
          position: absolute; top: 16px; left: 20px; z-index: 1000;
          background: rgba(2,6,23,.72);
          border: 1px solid rgba(148,163,184,.35);
          color: #e2f3ff;
          padding: 14px; border-radius: 14px; width: 320px;
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 28px rgba(2,6,23,.45);
        }
        .group { display: grid; gap: 10px; margin-bottom: 10px }
        .subhead { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; opacity: .85 }

        .check { display: flex; align-items: center; gap: 8px; font-size: 14px }
        .check input { accent-color: #0ea5e9 }
        .check.disabled { opacity: .6 }

        .inlineChecks { display: grid; gap: 6px; margin-bottom: 10px }

        .field { display: grid; gap: 6px; font-size: 13px }
        .field input[type="text"] {
          background: rgba(255,255,255,.96); color: #0f172a; border: 1px solid #cbd5e1;
          border-radius: 8px; padding: 8px; font-size: 14px;
        }
        .field input[type="range"] { width: 100% }
        .rangeVal { font-size: 12px; color: #cfefff; }

        .hint { font-size: 12px; color: #cfefff; opacity: .9; margin-top: 2px }

        @media (max-width: 820px) {
          .panel { left: 12px; width: 280px }
          .mapFull { height: 70vh }
          h1 { font-size: 26px }
        }

          /* Move the glass panel a bit lower to avoid zoom controls */
  .panel { 
    top: 72px;           /* was 16px */
  }

  @media (max-width: 820px) {
    .panel { 
      top: 88px;         /* a little extra spacing on small screens */
    }
  }
      `}</style>
    </>
  );
}
