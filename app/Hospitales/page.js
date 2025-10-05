"use client"
/*import Header from "../Header/Header"

import { useEffect, useRef } from "react"

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts';



export default function Hospitales(){


  const mapRef = useRef(null)
     useEffect(() => {
    let map;

    (async () => {
      if (typeof window === "undefined" || mapRef.current) return;

      // Importa CSS y Leaflet SOLO en cliente
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
    map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);



      mapRef.current = map;
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

 <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
     integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
     crossorigin=""/>


    return(
        <div className="">
            <Header/>


            <div  id="map" style={{  position: "absolute",
  top: "20%",
  left: "30%",

  width: 800,/* Example: Specific width 
  height: 400,}}
  
  
  
  />
  

<div id="card-H" style={{position: "absolute",
        top: "20%",
        left: "5%",
        width: 300,
        minHeight: 500,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        padding: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        }}>

 <input
        type="text"
        placeholder="Buscar ..."
        style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "16px",
            fontSize: "16px"
        }}
    />
      <label style={{ marginBottom: "8px", display: "flex", alignItems: "center" }}>
        <input type="checkbox" style={{ marginRight: "8px" }} />
        Areas sin cobertura
    </label>
    <label style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
        <input type="checkbox" style={{ marginRight: "8px" }} />
        Hospitales Cercanos
    </label>
<br/>
<br/>
  <label style={{ marginBottom: "16px", alignItems: "center" }}>
       
       Distancia de busqueda (km):
    </label>
     <input type="range" style={{ marginRight: "8px" }} />
    
</div>

        </div>
        
    )

}*/
import Header from "../Header/Header";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Hospitales() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
const [busquedaActiva, setBusquedaActiva] = useState(false);

  const [hospitalMarkers, setHospitalMarkers] = useState([]);
  const [noCoverageCircles, setNoCoverageCircles] = useState([]);
  const [countriesGeoJSON, setCountriesGeoJSON] = useState(null);
  const [countriesLayer, setCountriesLayer] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [busquedaKm, setBusquedaKm] = useState(100);

  // control debounce de búsqueda
  const searchTimeoutRef = useRef(null);

  // URL pública ligera (opción 1)
  const COUNTRIES_GEOJSON_URL =
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

  // estilos
  const baseCountryStyle = {
    color: "#aaa",
    weight: 1,
    fillColor: "#ececec",
    fillOpacity: 0.5,
  };

  const selectedStyle = {
    color: "#000", // borde negro
    weight: 2,
    fillColor: "#FFEB3B", // amarillo
    fillOpacity: 0.6,
  };

  const neighborStyle = {
    color: "#555",
    weight: 1.5,
    fillColor: "#FEB24C", // naranja claro para vecinos
    fillOpacity: 0.45,
  };

  // inicializar el mapa (EPSG:3857 por defecto — compatible con OSM)
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
    });

    // Capa base OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Capa WMS GHSL (intenta con WMS normal — GeoServer suele soportar EPSG:3857)
    const ghsl = L.tileLayer.wms(
      "https://sedac.ciesin.columbia.edu/geoserver/ows",
      {
        layers: "ghsl:GHSL_SMOD_R2023A",
        format: "image/png",
        transparent: true,
        attribution: "SEDAC GHSL",
        // tileSize / other options can be added if es necesario
      }
    ).addTo(map);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // fetch del GeoJSON de países y render
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch(COUNTRIES_GEOJSON_URL);
        const geo = await res.json();
        setCountriesGeoJSON(geo);

        // crear capa GeoJSON
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helpers para comparar / detectar vecinos
  // A: obtiene todos los pares [lat, lng] del feature (acomoda MultiPolygon / Polygon)
  const collectCoordsPairs = (feature) => {
    const pairs = [];
    const geom = feature.geometry;
    if (!geom) return pairs;

    const pushPair = (lon, lat) => {
      // redondeo para evitar float noise
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      pairs.push(key);
    };

    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        for (const coord of ring) {
          pushPair(coord[0], coord[1]);
        }
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          for (const coord of ring) {
            pushPair(coord[0], coord[1]);
          }
        }
      }
    }
    return pairs;
  };

  // detecta si comparten vértice exacto (con tolerancia por redondeo)
  const hasSharedVertex = (featA, featB) => {
    const aPairs = collectCoordsPairs(featA);
    const setA = new Set(aPairs);
    const bPairs = collectCoordsPairs(featB);
    for (const p of bPairs) {
      if (setA.has(p)) return true;
    }
    return false;
  };

  // buscar país por nombre (case-insensitive). Retorna feature y su layer si existe
  const findCountryFeature = (query) => {
    if (!countriesGeoJSON) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;

    // buscar por varios campos comunes
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
        if (String(val).toLowerCase().indexOf(q) !== -1) {
          return feature;
        }
      }
    }
    return null;
  };

  // cuando se selecciona un país: resaltar y mostrar vecinos
  const highlightCountryAndNeighbors = (feature) => {
    setBusquedaActiva(true);
    if (!countriesLayer || !mapInstanceRef.current) return;

    // Reset estilos previos
    countriesLayer.resetStyle?.(); // la función existe en Leaflet GeoJSON layer

    // quitar cualquier layer temporal anterior (si es que añadimos popups o similares)
    setSelectedCountryId(null);

    // encontrar layers individuales (cada layer tiene .feature)
    const allLayers = [];
    countriesLayer.eachLayer((lyr) => {
      if (lyr.feature) allLayers.push(lyr);
    });

    // encontrar la capa del feature seleccionado comparando por ISO_A3 u otro identificador
    // Preferimos comparar por geometría (JSON string) si no hay id único
    let targetLayer = null;
    for (const lyr of allLayers) {
      try {
        // comparar por ISO_A3 si existe
        const a = lyr.feature.properties.ISO_A3 || lyr.feature.properties.ISO3 || lyr.feature.properties.ADM0_A3;
        const b = feature.properties.ISO_A3 || feature.properties.ISO3 || feature.properties.ADM0_A3;
        if (a && b && a === b) {
          targetLayer = lyr;
          break;
        }
      } catch (e) {}
    }
    // si no lo encontró por código, comparar por nombre exacto (ADMIN)
    if (!targetLayer) {
      const nameToFind =
        feature.properties.ADMIN ||
        feature.properties.NAME ||
        feature.properties.name;
      for (const lyr of allLayers) {
        const n =
          lyr.feature.properties.ADMIN ||
          lyr.feature.properties.NAME ||
          lyr.feature.properties.name;
        if (n && nameToFind && n === nameToFind) {
          targetLayer = lyr;
          break;
        }
      }
    }

    // como fallback comparar geometría (puede ser costoso pero es fallback)
    if (!targetLayer) {
      const fGeomStr = JSON.stringify(feature.geometry);
      for (const lyr of allLayers) {
        if (JSON.stringify(lyr.feature.geometry) === fGeomStr) {
          targetLayer = lyr;
          break;
        }
      }
    }

    if (!targetLayer) {
      console.warn("No se encontró la capa del país seleccionado en el layer.");
      return;
    }

    // Aplicar estilo al país seleccionado
    targetLayer.setStyle(selectedStyle);
    mapInstanceRef.current.fitBounds(targetLayer.getBounds(), { padding: [20, 20] });

    // identificar vecinos: comprobamos intersección por bbox y luego vértices compartidos
    const neighbors = [];
    const selBounds = targetLayer.getBounds();

    for (const lyr of allLayers) {
      if (lyr === targetLayer) continue;
      const b = lyr.getBounds();
      if (!selBounds.intersects(b)) continue; // si no intersectan los bounding boxes, no son vecinos

      // si intersectan bbox, comprobamos si comparten vértice exacto
      if (hasSharedVertex(targetLayer.feature, lyr.feature)) {
        neighbors.push(lyr);
      }
    }

    // aplicar estilo a vecinos
    neighbors.forEach((n) => n.setStyle(neighborStyle));

    // guardar selected id para poder resetear si se desea
    setSelectedCountryId(
      feature.properties.ISO_A3 ||
        feature.properties.ISO3 ||
        feature.properties.ADM0_A3 ||
        feature.properties.ADMIN ||
        feature.properties.NAME ||
        null
    );
  };

  // función de búsqueda llamada por el input (debounce)
  const handleSearchInput = (raw) => {
    // limpiar debounce previo
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // si el usuario presiona Enter, buscamos inmediatamente (raw será entrada del input)
    searchTimeoutRef.current = setTimeout(() => {
      const query = raw.trim();
      if (!query || !countriesGeoJSON) return;

      const found = findCountryFeature(query);
      if (!found) {
        console.warn("No se encontró país con:", query);
        return;
      }
      highlightCountryAndNeighbors(found);
    }, 500); // 500ms debounce
  };

  // manejo de enter en input: búsqueda inmediata
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      const query = e.target.value.trim();
      if (!query) return;
      const found = findCountryFeature(query);
      if (!found) {
        console.warn("No se encontró país con:", query);
        return;
      }
      highlightCountryAndNeighbors(found);
    }
  };

  // -------------------- Manejo de hospitales --------------------
  const handleHospitalsToggle = async (e) => {
    const checked = e.target.checked;
    if (!checked) {
      hospitalMarkers.forEach((marker) => marker.remove());
      setHospitalMarkers([]);
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](${south},${west},${north},${east});out;`;

    try {
      const response = await fetch(url);
      const data = await response.json();

var Hicon = L.icon({
    iconUrl: 'https://t4.ftcdn.net/jpg/01/69/76/45/360_F_169764523_7ysH07dmxLZmN0yHcZFWwrFXrxWckEMh.jpg',
    iconSize: [25, 25], // size of the icon
    iconAnchor: [12, 12], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -10] // point from which the popup should open relative to the iconAnchor
});

      const markers = data.elements.map((el) => {
        // verificar lat lon
        if (!el.lat || !el.lon) return null;
        return L.marker([el.lat, el.lon],{icon:Hicon} ).addTo(map);
      }).filter(Boolean);

      setHospitalMarkers(markers);
    } catch (err) {
      console.error("Error al cargar hospitales:", err);
    }
  };

  // -------------------- Áreas sin cobertura --------------------
  const handleNoCoverageToggle = async (e) => {
    const checked = e.target.checked;

    if (!checked) {
      noCoverageCircles.forEach((circle) => circle.remove());
      setNoCoverageCircles([]);
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const radioKm = parseInt(busquedaKm);

    const puntos = [
      [(north + south) / 2, (west + east) / 2],
      [north, west],
      [north, east],
      [south, west],
      [south, east],
    ];

    const circles = [];

    for (const [lat, lon] of puntos) {
      const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="hospital"](around:${
        radioKm * 1000
      },${lat},${lon});out;`;

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
    <div>
      <Header />

      <div
        id="map"
        ref={mapRef}
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: 900,
          height: 600,
        }}
      />

      <div
        id="card-H"
        style={{
          position: "absolute",
          top: "20%",
          left: "5%",
          width: 320,
          minHeight: 260,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          padding: 18,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input
          type="text"
          placeholder="Buscar país (ej. México, Brazil, France)..."
          onChange={(e) => handleSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "12px",
            fontSize: "14px",
          }}
        />

        <label style={{ marginBottom: "8px", display: "flex", alignItems: "center" }}>
          <input
  type="checkbox"
  style={{ marginRight: "8px" }}
  onChange={handleNoCoverageToggle}
  disabled={!busquedaActiva}
/>
          Áreas sin cobertura
        </label>

        <label style={{ marginBottom: "12px", display: "flex", alignItems: "center" }}>
         <input
  type="checkbox"
  style={{ marginRight: "8px" }}
  onChange={handleHospitalsToggle}
  disabled={!busquedaActiva}
/>
          Hospitales Cercanos
        </label>

        <label style={{ marginBottom: "8px", alignItems: "center" }}>
          Distancia de búsqueda (km):
        </label>
        <input
          type="range"
          min="10"
          max="300"
          value={busquedaKm}
          onChange={(e) => setBusquedaKm(e.target.value)}
          style={{ marginBottom: "8px" }}
        />
        <span style={{ fontSize: 13 }}>{busquedaKm} km</span>
      </div>
    </div>
  );
}
