// app/Greengap/page.js
"use client";
import Header from "../Header/Header";
import { useEffect, useRef, useState, useMemo } from "react";

export default function GreenGapPage() {
  const [layers, setLayers] = useState({
    vegetation: false,   // MODIS Land Cover (IGBP)
    deficit: false,      // GPW Population Density (proxy hotspots)
  });
  const [searchQuery, setSearchQuery] = useState("");

  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);

  const vegetationLayerRef = useRef(null);
  const deficitLayerRef = useRef(null);

  // --- NASA GIBS layers ---
  const VEGETATION_URL = useMemo(
    () =>
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual/default/2024-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
    []
  );

  const DEFICIT_URL = useMemo(
    () =>
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GPW_Population_Density_2020/default/2020-01-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
    []
  );

  // Init map once (zoomed out)
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      (async () => {
        await import("leaflet/dist/leaflet.css");
        const L = (await import("leaflet")).default;

        const map = L.map(mapContainerRef.current).setView([24, -102], 4);
        mapInstanceRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
      })();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle layers — Vegetation (Land Cover) & Deficit (GPW)
  useEffect(() => {
    (async () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const L = (await import("leaflet")).default;

      // Vegetation
      if (layers.vegetation) {
        if (!vegetationLayerRef.current) {
          vegetationLayerRef.current = L.tileLayer(VEGETATION_URL, {
            maxNativeZoom: 8,
            maxZoom: 19,
            opacity: 0.85,
            zIndex: 710,
            tileSize: 256,
            crossOrigin: true,
            attribution: "NASA GIBS — MODIS Land Cover (IGBP)",
          }).on("tileerror", (e) => console.warn("Vegetation tile error:", e?.tile?.src));
        }
        vegetationLayerRef.current.addTo(map);
        if (map.getZoom() > 12) map.setZoom(10);
      } else if (vegetationLayerRef.current) {
        map.removeLayer(vegetationLayerRef.current);
      }

      // Deficit hotspots (GPW Population Density)
      if (layers.deficit) {
        if (!deficitLayerRef.current) {
          deficitLayerRef.current = L.tileLayer(DEFICIT_URL, {
            maxNativeZoom: 7,
            maxZoom: 19,
            opacity: 0.65,
            zIndex: 720,
            tileSize: 256,
            crossOrigin: true,
            attribution: "NASA GIBS — GPW Population Density 2020",
          }).on("tileerror", (e) => console.warn("Deficit (GPW) tile error:", e?.tile?.src));
        }
        deficitLayerRef.current.addTo(map);
      } else if (deficitLayerRef.current) {
        map.removeLayer(deficitLayerRef.current);
      }
    })();
  }, [layers.vegetation, layers.deficit, VEGETATION_URL, DEFICIT_URL]);

  // Vegetation opacity
  function handleVegOpacity(val) {
    vegetationLayerRef.current?.setOpacity(Number(val) / 100);
  }

  // Simple search (recenters map)
  async function handleLocationSearch(query) {
    if (!query.trim() || !mapInstanceRef.current) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data[0]) {
        const { lat, lon } = data[0];
        mapInstanceRef.current.setView([parseFloat(lat), parseFloat(lon)], 11);
      }
    } catch (err) {
      console.error("Error searching location:", err);
    }
  }

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="heroWrap">
          <div className="titles">
            <span className="badge">Greenspace</span>
            <h1>GreenGap — Park &amp; Vegetation Equity</h1>
            <p>
              Toggle <b>Vegetation</b> (MODIS land cover) and <b>Deficit hotspots</b> (GPW population density).
              Search a place to explore patterns quickly.
            </p>
          </div>
        </div>
      </section>

      {/* FULL MAP WITH MINIMAL CONTROLS (no legend, no parks) */}
      <section className="mapBleed">
        <div className="panel">
          {/* Search */}
          <div className="group">
            <label className="field">
              <span>Search location</span>
              <input
                type="text"
                placeholder="Beijing, Paris, Tokyo…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLocationSearch(searchQuery)}
              />
            </label>
          </div>

          {/* Toggles */}
          <div className="group">
            <div className="subhead">Layers</div>
            <Toggle
              label="Vegetation (Land Cover)"
              on={layers.vegetation}
              onClick={() => setLayers((s) => ({ ...s, vegetation: !s.vegetation }))}
            />
            <Toggle
              label="Deficit hotspots (GPW pop. density)"
              on={layers.deficit}
              onClick={() => setLayers((s) => ({ ...s, deficit: !s.deficit }))}
            />
          </div>

          {/* Vegetation opacity */}
          <div className="group">
            <label className="field">
              <span>Vegetation opacity</span>
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={80}
                onChange={(e) => handleVegOpacity(e.target.value)}
                disabled={!layers.vegetation}
              />
            </label>
          </div>
        </div>

        <div ref={mapContainerRef} className="mapFull" />
      </section>

      <style jsx>{`
        :global(.leaflet-container) { background: #0b1220; }
        :global(.leaflet-control-attribution) { font-size: 11px; }

        .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#0ea5e980; color:#04283b; font-size:12px; font-weight:800; border:1px solid #7dd3fc }
        .hero { background: radial-gradient(1200px 400px at 50% -80px, rgba(56,189,248,.25), transparent 60%), linear-gradient(180deg, #020617, #071827 40%, #0b1722 100%); color:#e6f6ff; border-bottom:1px solid rgba(148,163,184,.2) }
        .heroWrap { max-width:1100px; margin:0 auto; padding:36px 16px 28px; }
        .titles h1 { margin:10px 0 8px; font-size:36px; }
        .titles p { margin:0; opacity:.95; max-width:65ch; }

        .mapBleed { position: relative; width: 100vw; margin-left: 50%; transform: translateX(-50%); background: #020617; }
        .mapFull { height: min(84vh, 900px); width: 100%; }

        .panel {
          position: absolute; top: 72px; left: 20px; z-index: 1000;
          background: rgba(2,6,23,.72); border: 1px solid rgba(148,163,184,.35); color: #e2f3ff;
          padding: 14px; border-radius: 14px; width: 320px; backdrop-filter: blur(6px);
          box-shadow: 0 10px 28px rgba(2,6,23,.45);
        }
        .group { display: grid; gap: 10px; margin-bottom: 10px; }
        .subhead { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; opacity: .85; }

        .field { display: grid; gap: 6px; font-size: 13px; }
        .field input[type="text"] {
          background: rgba(255,255,255,.96); color: #0f172a; border: 1px solid #cbd5e1;
          border-radius: 8px; padding: 8px; font-size: 14px;
        }
        .field input[type="range"] { width: 100%; }
        @media (max-width: 1020px) {
          .panel { left: 12px; width: 280px; top: 88px; }
          .mapFull { height: 70vh; }
          .titles h1 { font-size: 30px; }
        }
      `}</style>
    </>
  );
}

/* tiny UI helpers */
function Toggle({ label, on, onClick }) {
  return (
    <button
      className={`toggle ${on ? "on" : ""}`}
      onClick={onClick}
      type="button"
      style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
    >
      <span
        className="pill"
        style={{
          width: 40, height: 22, borderRadius: 999,
          background: on ? "linear-gradient(90deg, #22d3ee, #60a5fa)" : "#cbd5e1",
          position: "relative", transition: ".15s",
        }}
      >
        <span
          className="dot"
          style={{
            position: "absolute", top: 2, left: 2, width: 18, height: 18,
            borderRadius: 999, background: "white", transition: ".15s",
            transform: on ? "translateX(18px)" : "translateX(0)",
            boxShadow: "0 1px 4px rgba(2,6,23,.25)",
          }}
        />
      </span>
      <span style={{ fontSize: 14, color: "#e2f3ff" }}>{label}</span>
    </button>
  );
}
