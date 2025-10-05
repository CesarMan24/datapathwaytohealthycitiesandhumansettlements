// app/Pollutedareas/page.js
"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Header from "../Header/Header";

export default function Pollutedareas() {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const dataLayerRef = useRef(null);

  const [realista, setrealista] = useState(false);
  const [capa, setcapa] = useState("");
  const [date, setdate] = useState("");

  // Descriptions (shown in panel under LEGEND)
  const DESCRIPTIONS = useMemo(
    () => ({
      Aerosol:
        "Aerosol Optical Depth (AOD) estimates particles (smoke, dust, pollution) suspended in the air column. Higher values often mean hazier skies and poorer air quality.",
      "Ground Temperature":
        "Land Surface Temperature (LST) is how hot the ground surface is, useful for spotting urban heat and heat islands over land.",
      Chlorophyll:
        "Chlorophyll-a is a proxy for phytoplankton biomass. High values can indicate algal blooms that degrade water quality.",
       
    }),
    []
  );

  useEffect(() => {
    let L;
    (async () => {
      if (!divRef.current) return;
      await import("leaflet/dist/leaflet.css");
      const leaflet = await import("leaflet");
      L = leaflet.default || leaflet;

      // init map once
      if (!mapRef.current) {
        mapRef.current = L.map(divRef.current).setView([24, -102], 4);
        mapRef.current.setMinZoom(2);
        mapRef.current.setMaxZoom(8);
      }
      const map = mapRef.current;

      // clear layers
      if (baseLayerRef.current) {
        map.removeLayer(baseLayerRef.current);
        baseLayerRef.current = null;
      }
      if (dataLayerRef.current) {
        map.removeLayer(dataLayerRef.current);
        dataLayerRef.current = null;
      }

      // base layer
      if (realista) {
        baseLayerRef.current = L.tileLayer(
          "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-10-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
          { maxZoom: 9, zIndex: 500, attribution: "NASA GIBS" }
        ).addTo(map);
      } else {
        baseLayerRef.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
      }

      // data overlay
      switch (capa) {
        case "Aerosol":
          dataLayerRef.current = L.tileLayer(
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Aerosol_Optical_Depth_3km/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
            { maxZoom: 6, opacity: 0.7, zIndex: 710, attribution: "NASA GIBS (MODIS AOD)" }
          ).addTo(map);
          break;
        case "Ground Temperature":
          dataLayerRef.current = L.tileLayer(
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
            { maxZoom: 7, opacity: 0.7, zIndex: 710, attribution: "NASA GIBS (LST)" }
          ).addTo(map);
          break;
        case "Chlorophyll":
          dataLayerRef.current = L.tileLayer(
            //`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Chlorophyll_A/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L2_Chlorophyll_A/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
            { maxZoom: 7, opacity: 0.7, zIndex: 710, attribution: "NASA GIBS (Chlorophyll-a)" }
          ).addTo(map);
          break;

         
        
        default:
          break;
      }
    })();
  }, [realista, capa, date]);

  const getMaxDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 2);
    return today.toISOString().split("T")[0];
  };

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="hero">
        <div className="heroWrap">
          <div className="titles">
            <span className="badge">Environment</span>
            <h1>Polluted Areas — Aerosols, Surface Temp, Ocean &amp; CO₂</h1>
            <p>
              Switch between NASA layers to explore air particles (AOD), ground heat (LST),
              ocean chlorophyll, and monthly CO₂ columns. Use the date picker for the time you need.
            </p>
          </div>
        </div>
      </section>

      {/* FULL-BLEED MAP */}
      <section className="mapBleed">
        <div className="panel">
          <form className="form mx-5">
            <label className="check">
              <input
                type="checkbox"
                id="realista"
                checked={realista}
                onChange={(e) => setrealista(e.target.checked)}
              />
              <span>MODIS Terra True Color (NASA)</span>
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                id="fecha"
                value={date}
                onChange={(e) => setdate(e.target.value)}
                max={getMaxDate()}
              />
            </label>

            <label className="field">
              <span>Problema</span>
              <select id="capa" value={capa} onChange={(e) => setcapa(e.target.value)}>
                <option value="">Selecciona una capa</option>
                <option value="Aerosol">Aerosol (MODIS AOD)</option>
                <option value="Ground Temperature">Ground Temperature (LST)</option>
                <option value="Chlorophyll">Chlorophyll-a (Ocean Health)</option>
               
               
              </select>
            </label>

            <div className="hint">
              Tip: MODIS layers are daily at ~3–5 km. For CO₂ Monthly, choose any day in a month.
            </div>

            {/* LEGEND */}
            <div className="legend">
              <div className="legendTitle">Legend</div>
              {capa === "Aerosol" ? (
                <>
                  <LegendRow color="#38bdf8" label="Low AOD (cleaner air)" />
                  <LegendRow color="#f59e0b" label="Moderate AOD" />
                  <LegendRow color="#ef4444" label="High AOD (more aerosols)" />
                </>
              ) : capa === "Ground Temperature" ? (
                <>
                  <LegendRow color="#60a5fa" label="Cooler surface" />
                  <LegendRow color="#f97316" label="Warm" />
                  <LegendRow color="#b91c1c" label="Hot surface" />
                </>
              ) : capa === "Chlorophyll" ? (
                <>
                  <LegendRow color="#1e40af" label="Low chlorophyll" />
                  <LegendRow color="#22c55e" label="Moderate" />
                  <LegendRow color="#15803d" label="High (algal blooms)" />
                </>
          ) : capa === "NitrogenDioxide" ? (
                <>
                  <LegendRow color="#60a5fa" label="Low NO₂" />
                  <LegendRow color="#f59e0b" label="Moderate pollution" />
                  <LegendRow color="#dc2626" label="High NO₂ (traffic/industry)" />
                </>
              ) : capa === "SulfurDioxide" ? (
                <>
                  <LegendRow color="#3b82f6" label="Background SO₂" />
                  <LegendRow color="#f97316" label="Elevated" />
                  <LegendRow color="#7c2d12" label="High (volcanic/industrial)" />
                </>
              ) : (
                <div className="muted">Select a layer to view its legend.</div>
              )}
            </div>

            {/* DESCRIPTION (inside the same box, below legend) */}
            <div className="descBox">
              <div className="descTitle">About this layer</div>
              <p className="descText">
                {capa ? DESCRIPTIONS[capa] : "Choose a layer to see what it measures and why it matters."}
              </p>
            </div>
          </form>
        </div>

        <div ref={divRef} className="mapFull" />
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
        .heroWrap { max-width: 1100px; margin: 0 auto; padding: 32px 16px; }
        .badge {
          display: inline-block; padding: 4px 10px; border-radius: 999px;
          background: #0ea5e980; color: #04283b; font-size: 12px; font-weight: 800;
          border: 1px solid #7dd3fc;
        }
        h1 { margin: 8px 0 6px; font-size: 32px; line-height: 1.2 }
        .hero p { margin: 0; opacity: .95; max-width: 70ch }

        .mapBleed {
          position: relative;
          width: 100vw;
          margin-left: 50%;
          transform: translateX(-50%);
          background: #020617;
        }
        .mapFull { height: min(84vh, 900px); width: 100%; }

        .panel {
          position: absolute; top: 16px; left: 20px; z-index: 1000;
          background: rgba(2,6,23,.72);
          border: 1px solid rgba(148,163,184,.35);
          color: #e2f3ff;
          padding: 14px; border-radius: 14px; width: 300px;
          backdrop-filter: blur(6px);
        }
        .form { display: grid; gap: 10px }
        .check { display: flex; align-items: center; gap: 8px; font-size: 14px }
        .field { display: grid; gap: 6px; font-size: 13px }
        .field input, .field select {
          background: rgba(255,255,255,.96); color: #0f172a; border: 1px solid #cbd5e1;
          border-radius: 8px; padding: 6px 8px; font-size: 13px;
        }
        .hint { font-size: 12px; color: #cfefff; opacity: .9; margin-top: 2px }

        .legend { margin-top: 10px; background: rgba(2,6,23,.55); border: 1px solid rgba(148,163,184,.25);
          border-radius: 10px; padding: 10px; }
        .legendTitle { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; opacity: .8; margin-bottom: 6px }
        .row { display: grid; grid-template-columns: 14px 1fr; gap: 8px; align-items: center; font-size: 12px; }
        .sw { height: 10px; border-radius: 3px }
        .muted { color: #cfefff; opacity: .75; font-size: 12px }

        .descBox {
          margin-top: 10px;
          background: rgba(2,6,23,.55);
          border: 1px solid rgba(148,163,184,.25);
          border-radius: 10px; padding: 10px;
        }
        .descTitle { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; opacity: .8; margin-bottom: 6px }
        .descText { margin: 0; font-size: 13px; color: #e8f7ff }

        @media (max-width: 820px) {
          .panel { left: 12px; width: 260px }
          .mapFull { height: 70vh }
          h1 { font-size: 26px }
        }

          .panel {
    position: absolute;
    top: 72px;          /* was 16px — moves the box below the zoom buttons */
    left: 20px;
    z-index: 1000;
    background: rgba(2,6,23,.72);
    border: 1px solid rgba(148,163,184,.35);
    color: #e2f3ff;
    padding: 14px;
    border-radius: 14px;
    width: 300px;
    backdrop-filter: blur(6px);
  }

  @media (max-width: 820px) {
    .panel { 
      top: 88px;       /* give a bit more room on small screens */
      width: 260px;
    }
  }
      `}</style>
    </>
  );
}

/* mini legend row */
function LegendRow({ color, label }) {
  return (
    <div className="row">
      <span className="sw" style={{ background: color }} />
      <span>{label}</span>
      <style jsx>{`
        .row { display: grid; grid-template-columns: 14px 1fr; gap: 8px; align-items: center; font-size: 12px }
        .sw { height: 10px; border-radius: 3px }
      `}</style>
    </div>
  );
}
