"use client";
import Header from "../Header/Header";
import { useEffect, useRef, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function GreenGapPage() {
  const [layers, setLayers] = useState({
    vegetation: true,
    parkBuffers: false,
    deficit: false,
  });
  const [thresholds, setThresholds] = useState({ ndviPct: 30, accessPct: 60 });
  const [activeFeature, setActiveFeature] = useState(null);
  const [year, setYear] = useState(2024);
  const [vegLayer, setVegLayer] = useState('landcover');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const mapInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const vegLayerRef = useRef(null);
  const parkBuffersRef = useRef(null);
  const deficitLayerRef = useRef(null);

  const vegUrls = useMemo(() => ({
    ndvi: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_16Day/default/${year}-09-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    landcover: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Cover_Type_1_Yearly/default/${year}-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
    evi: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_EVI_16Day/default/${year}-09-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`
  }), [year]);

  const filteredPriorities = useMemo(() => {
    return priorityData.filter(
      r => r.ndvi_pct * 100 < thresholds.ndviPct && r.park_access_pct < thresholds.accessPct
    ).sort((a, b) => b.gdi - a.gdi).slice(0, 10);
  }, [thresholds]);

  const projectionData = useMemo(() => {
    const baselineCoverage = 58;
    const projection = [{ year: 2025, coverage: baselineCoverage, cost: 0 }];

    const totalImpact = filteredPriorities.reduce((acc, site) => {
      const intervention = simulateIntervention(site);
      acc.totalBoost += intervention.accessBoost;
      acc.totalCost += intervention.cost;
      return acc;
    }, { totalBoost: 0, totalCost: 0 });

    if (filteredPriorities.length > 0) {
      projection.push({
        year: 2026,
        coverage: baselineCoverage + totalImpact.totalBoost * 0.3,
        cost: totalImpact.totalCost * 0.4,
      });
      projection.push({
        year: 2028,
        coverage: baselineCoverage + totalImpact.totalBoost * 0.7,
        cost: totalImpact.totalCost * 0.8,
      });
      projection.push({
        year: 2030,
        coverage: Math.min(100, baselineCoverage + totalImpact.totalBoost),
        cost: totalImpact.totalCost,
      });
    }
    
    return projection;
  }, [filteredPriorities]);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      (async () => {
        await import("leaflet/dist/leaflet.css");
        const L = (await import("leaflet")).default;

        const map = L.map(mapContainerRef.current).setView([32.52, -117.05], 11);
        mapInstanceRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const vegTile = L.tileLayer(vegUrls.landcover, {
          opacity: 0.7,
          attribution: "NASA GIBS Land Cover",
        });
        vegLayerRef.current = vegTile;
        if (layers.vegetation) vegTile.addTo(map);

        const parkBuffers = L.layerGroup();
        parkBuffersRef.current = parkBuffers;

        const deficitLayer = L.layerGroup();
        const hotspots = [
          { coords: [[32.52, -117.07], [32.52, -117.05], [32.51, -117.05], [32.51, -117.07]], gdi: 82 },
          { coords: [[32.54, -117.04], [32.54, -117.02], [32.53, -117.02], [32.53, -117.04]], gdi: 74 }
        ];
        hotspots.forEach(spot => {
          const color = spot.gdi > 75 ? '#ef4444' : '#f59e0b';
          L.polygon(spot.coords, { color, fillOpacity: 0.4, weight: 1 }).addTo(deficitLayer);
        });
        deficitLayerRef.current = deficitLayer;
      })();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (vegLayerRef.current) {
      vegLayerRef.current.setUrl(vegUrls[vegLayer]);
      vegLayerRef.current.options.attribution = `NASA GIBS ${vegLayer.toUpperCase()} (${year})`;
    }
  }, [year, vegLayer, vegUrls]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (vegLayerRef.current) {
      layers.vegetation ? vegLayerRef.current.addTo(map) : vegLayerRef.current.remove();
    }
    if (parkBuffersRef.current) {
      layers.parkBuffers ? parkBuffersRef.current.addTo(map) : parkBuffersRef.current.remove();
    }
    if (deficitLayerRef.current) {
      layers.deficit ? deficitLayerRef.current.addTo(map) : deficitLayerRef.current.remove();
    }
  }, [layers]);

  function handleVegOpacity(val) {
    if (vegLayerRef.current) vegLayerRef.current.setOpacity(Number(val) / 100);
  }

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
        setSearchActive(true);
        await loadParks();
      }
    } catch (err) {
      console.error("Error searching location:", err);
    }
  }

  async function loadParks() {
    if (!mapInstanceRef.current) return;
    
    const L = await import("leaflet");
    const bounds = mapInstanceRef.current.getBounds();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const url = `https://overpass-api.de/api/interpreter?data=[out:json];(way["leisure"="park"](${south},${west},${north},${east});relation["leisure"="park"](${south},${west},${north},${east}););out center;`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (parkBuffersRef.current) {
        parkBuffersRef.current.clearLayers();
      }

      data.elements.forEach(el => {
        if (el.center) {
          L.default.circle([el.center.lat, el.center.lon], {
            radius: 800,
            color: '#38bdf8',
            fillOpacity: 0.2,
            weight: 2
          }).addTo(parkBuffersRef.current);
        }
      });

      if (layers.parkBuffers && mapInstanceRef.current) {
        parkBuffersRef.current.addTo(mapInstanceRef.current);
      }
    } catch (err) {
      console.error("Error loading parks:", err);
    }
  }

  function exportGeoJSON() {
    const features = filteredPriorities.map(p => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [-117.05 + Math.random() * 0.05, 32.52 + Math.random() * 0.03] },
      properties: { name: p.name, gdi: p.gdi, action: p.topAction }
    }));
    const geojson = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "greengap_priorities.geojson";
    a.click();
  }

  return (
    <>
      <Header />
      
      <section className="hero">
        <div className="heroWrap">
          <div className="titles">
            <span className="badge">Greengap Analysis</span>
            <h1>Park & Vegetation Equity</h1>
            <p>
              NASA satellite imagery + walkable access analysis identifies greenspace deserts. 
              Filter thresholds to reveal priority sites for pocket parks and street trees.
            </p>
          </div>
          <div className="heroCard">
            <div className="miniLegend">
              <LegendRow color="#14532d" label="Forests" />
              <LegendRow color="#65a30d" label="Grasslands" />
              <LegendRow color="#f59e0b" label="Croplands" />
              <LegendRow color="#ef4444" label="Urban areas" />
              <LegendRow color="#38bdf8" label="10-min walk buffers" />
            </div>
          </div>
        </div>
      </section>

      <section className="main">
        <div className="grid">
          <aside className="panel left">
            <div className="card">
              <input
                type="text"
                placeholder="Search location (Beijing, Paris, Tokyo...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLocationSearch(searchQuery);
                }}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
            </div>

            <h2>Layers</h2>
            <div className="chips">
              <Toggle label="Vegetation" on={layers.vegetation} onClick={() => setLayers({...layers, vegetation: !layers.vegetation})} />
              <Toggle label="Park buffers" on={layers.parkBuffers} onClick={() => setLayers({...layers, parkBuffers: !layers.parkBuffers})} />
              <Toggle label="Deficit heatmap" on={layers.deficit} onClick={() => setLayers({...layers, deficit: !layers.deficit})} />
            </div>

            <div className="card">
              <h3 className="sub">Vegetation Layer</h3>
              <select 
                value={vegLayer} 
                onChange={e => setVegLayer(e.target.value)}
                style={{
                  width: "100%", 
                  padding: "8px", 
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              >
                <option value="landcover">Land Cover Type</option>
                <option value="ndvi">NDVI (Vegetation Index)</option>
                <option value="evi">EVI (Enhanced)</option>
              </select>
              <div className="hint">Land Cover classifies surface types directly</div>
            </div>

            <h2 style={{marginTop:18}}>Filters</h2>
            <div className="card">
              <label className="label">
                NDVI percentile &lt; {thresholds.ndviPct}
                <input 
                  type="range" 
                  min={5} 
                  max={60} 
                  value={thresholds.ndviPct}
                  onChange={e => setThresholds({...thresholds, ndviPct: Number(e.target.value)})}
                  disabled={!searchActive}
                />
              </label>
              <label className="label">
                Park access &lt; {thresholds.accessPct}%
                <input 
                  type="range" 
                  min={30} 
                  max={90} 
                  value={thresholds.accessPct}
                  onChange={e => setThresholds({...thresholds, accessPct: Number(e.target.value)})}
                  disabled={!searchActive}
                />
              </label>
              {!searchActive && <div className="hint" style={{color:'#f59e0b'}}>Search a location first</div>}
            </div>

            <div className="card">
              <h3 className="sub">Temporal Analysis</h3>
              <label className="label">
                Year: {year}
                <input type="range" min={2015} max={2024} value={year}
                  onChange={e => setYear(Number(e.target.value))} />
              </label>
              <div className="hint">Compare vegetation across years</div>
            </div>

            <div className="card">
              <h3 className="sub">Datasets</h3>
              <ul className="bullets">
                <li><b>NASA GIBS MODIS</b></li>
                <li>OSM park polygons</li>
                <li>WorldPop density grids</li>
              </ul>
            </div>
          </aside>

          <div className="mapWrap">
            <div ref={mapContainerRef} className="mapCanvas" />
            <div className="floating">
              <div className="tool">
                <span>Layer Opacity</span>
                <input type="range" min={0} max={100} defaultValue={70}
                  onChange={e => handleVegOpacity(e.target.value)} />
              </div>
            </div>
            <div className="footNote">NASA GIBS · OpenStreetMap · Demo data</div>
          </div>

          <aside className="panel right">
            <div className="card">
              <h3 className="sub">Details</h3>
              {activeFeature ? <Details feature={activeFeature} /> : 
                <p className="muted">Select a priority site to see intervention impacts</p>}
            </div>

            <div className="card">
              <h3 className="sub">Top Priorities ({filteredPriorities.length})</h3>
              <PriorityList rows={filteredPriorities} onSelect={setActiveFeature} />
              <div className="actions">
                <button className="btn" onClick={exportGeoJSON}>Export GeoJSON</button>
              </div>
            </div>

            <div className="card">
              <h3 className="sub">5-Year Impact Projection</h3>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="coverage" stroke="#34d399" strokeWidth={2} dot={{r:3}} />
                </LineChart>
              </ResponsiveContainer>
              <div className="hint">Park access coverage with interventions</div>
            </div>
          </aside>
        </div>
      </section>

      <style jsx>{`
        :global(.leaflet-container) { background: #0b1220; }
        .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#0ea5e980; color:#04283b; font-size:12px; font-weight:800; border:1px solid #7dd3fc }
        .hero { background: radial-gradient(1200px 400px at 50% -80px, rgba(56,189,248,.25), transparent 60%), linear-gradient(180deg, #020617, #071827 40%, #0b1722 100%); color:#e6f6ff; border-bottom:1px solid rgba(148,163,184,.2) }
        .heroWrap { max-width:1100px; margin:0 auto; padding:36px 16px 28px; display:grid; grid-template-columns:1.2fr .8fr; gap:18px }
        .titles h1 { margin:10px 0 8px; font-size:36px }
        .titles p { margin:0; opacity:.95; max-width:60ch }
        .heroCard { background:rgba(2,6,23,.6); border:1px solid rgba(148,163,184,.25); border-radius:14px; padding:16px; backdrop-filter:blur(4px) }
        .miniLegend { display:grid; gap:8px }
        .legendRow { display:grid; grid-template-columns:16px 1fr; align-items:center; gap:10px }
        .swatch { height:12px; border-radius:3px }
        .main { background:#f8fafc }
        .grid { max-width:1100px; margin:0 auto; padding:18px 16px 36px; display:grid; grid-template-columns:280px 1fr 320px; gap:18px }
        .panel { display:grid; align-content:start; gap:12px }
        .panel h2 { font-size:16px; margin:0 0 8px; color:#0f172a }
        .sub { margin:0 0 8px; font-size:15px }
        .chips { display:grid; gap:8px }
        .toggle { display:inline-flex; align-items:center; gap:10px; cursor:pointer }
        .pill { width:40px; height:22px; border-radius:999px; background:#cbd5e1; position:relative; transition:.15s }
        .dot { position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:999px; background:white; transition:.15s; box-shadow:0 1px 4px rgba(2,6,23,.25) }
        .on .pill { background:linear-gradient(90deg, #22d3ee, #60a5fa) }
        .on .dot { transform:translateX(18px) }
        .card { background:white; border:1px solid #e2e8f0; border-radius:14px; padding:14px; box-shadow:0 6px 22px rgba(15,23,42,.05) }
        .muted { color:#64748b; margin:0; font-size:13px }
        .bullets { margin:0; padding-left:18px; font-size:13px }
        .label { display:grid; gap:6px; font-size:13px; margin-bottom:10px }
        .hint { font-size:12px; color:#64748b; margin-top:6px }
        .mapWrap { position:relative; display:grid; gap:8px }
        .mapCanvas { height:520px; border-radius:14px; border:1px solid rgba(148,163,184,.25); overflow:hidden }
        .floating { position:absolute; top:12px; right:12px; width:180px }
        .tool { background:rgba(2,6,23,.6); border:1px solid rgba(148,163,184,.3); color:#e2f3ff; font-size:12px; padding:8px; border-radius:10px; display:grid; gap:6px; backdrop-filter:blur(4px) }
        .footNote { font-size:12px; color:#475569 }
        .actions { display:flex; gap:10px; margin-top:10px }
        .btn { background:#0f172a; color:white; border:1px solid #0f172a; padding:8px 12px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer }
        @media (max-width:1020px) { .heroWrap { grid-template-columns:1fr } .grid { grid-template-columns:1fr } .mapCanvas { height:420px } }
      `}</style>
    </>
  );
}

function Toggle({label, on, onClick}) {
  return (
    <button className={`toggle ${on?"on":""}`} onClick={onClick} type="button">
      <span className="pill"><span className="dot"/></span><span>{label}</span>
      <style jsx>{`.toggle{background:transparent;border:0;padding:0}`}</style>
    </button>
  );
}

function LegendRow({color, label}) {
  return <div className="legendRow"><span className="swatch" style={{background:color}}/><span style={{fontSize:13}}>{label}</span></div>;
}

function Details({feature}) {
  const impact = simulateIntervention(feature);
  return (
    <div>
      <h4 style={{margin:"0 0 6px"}}>{feature.name}</h4>
      <table className="kv"><tbody>
        <tr><td>NDVI percentile</td><td>{Math.round(feature.ndvi_pct*100)}%</td></tr>
        <tr><td>Park access</td><td>{Math.round(feature.park_access_pct)}%</td></tr>
        <tr><td>GDI score</td><td>{Math.round(feature.gdi)}</td></tr>
        <tr><td><b>Projected impact</b></td><td><b>+{impact.accessBoost}pp</b></td></tr>
      </tbody></table>
      <p className="small" style={{marginTop:8}}>{feature.topAction}: ${(impact.cost/1000).toFixed(0)}K, ROI ${impact.roi}/resident</p>
      <style jsx>{`.kv td:first-child{color:#475569;padding-right:10px} .kv td{font-size:13px;padding:3px 0} .small{font-size:12px;color:#334155}`}</style>
    </div>
  );
}

function PriorityList({rows, onSelect}) {
  return (
    <div className="list">
      {rows.map(r => (
        <button key={r.id} className="row" onClick={() => onSelect?.(r)} type="button">
          <div className="name"><b>{r.name}</b><span className="tag">GDI {Math.round(r.gdi)}</span></div>
          <div className="meta">
            <span>NDVI {Math.round(r.ndvi_pct*100)}</span>
            <span>{Math.round(r.park_access_pct)}% access</span>
          </div>
        </button>
      ))}
      <style jsx>{`
        .row{width:100%;text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;display:grid;gap:4px;margin-bottom:8px;cursor:pointer}
        .row:hover{background:#eef6ff;border-color:#bfdbfe}
        .name{display:flex;align-items:center;gap:8px}
        .tag{font-size:11px;background:#0ea5e9;color:#031224;padding:2px 6px;border-radius:999px;font-weight:800}
        .meta{display:flex;gap:10px;color:#475569;font-size:12px}
      `}</style>
    </div>
  );
}

const priorityData = [
  {id:"bg_101",name:"Block Group 101",ndvi_pct:0.22,park_access_pct:41,gdi:82,topAction:"2 pocket parks"},
  {id:"bg_088",name:"Block Group 088",ndvi_pct:0.31,park_access_pct:55,gdi:74,topAction:"Street tree corridor"},
  {id:"bg_132",name:"Block Group 132",ndvi_pct:0.27,park_access_pct:49,gdi:71,topAction:"1 pocket park"},
  {id:"bg_067",name:"Block Group 067",ndvi_pct:0.29,park_access_pct:58,gdi:68,topAction:"Green roof program"},
  {id:"bg_045",name:"Block Group 045",ndvi_pct:0.19,park_access_pct:38,gdi:79,topAction:"Schoolyard sharing"},
  {id:"bg_201",name:"District North",ndvi_pct:0.15,park_access_pct:25,gdi:91,topAction:"2 pocket parks"},
  {id:"bg_202",name:"Riverside",ndvi_pct:0.45,park_access_pct:88,gdi:45,topAction:"Street tree corridor"},
  {id:"bg_203",name:"Industrial Park",ndvi_pct:0.08,park_access_pct:15,gdi:95,topAction:"2 pocket parks"},
  {id:"bg_204",name:"East Suburbs",ndvi_pct:0.35,park_access_pct:75,gdi:50,topAction:"Green roof program"},
  {id:"bg_205",name:"Downtown Core",ndvi_pct:0.12,park_access_pct:65,gdi:65,topAction:"1 pocket park"},
];

function simulateIntervention(site) {
  const actions = {
    "2 pocket parks": {accessBoost:14,cost:850000,roi:42},
    "Street tree corridor": {accessBoost:8,cost:320000,roi:68},
    "1 pocket park": {accessBoost:11,cost:420000,roi:51},
    "Green roof program": {accessBoost:5,cost:180000,roi:34},
    "Schoolyard sharing": {accessBoost:9,cost:95000,roi:88}
  };
  return actions[site.topAction] || {accessBoost:0,cost:0,roi:0};
}