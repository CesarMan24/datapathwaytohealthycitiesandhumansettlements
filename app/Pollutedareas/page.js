"use client";
import { useEffect, useRef, useState } from "react";
import Header from "../Header/Header";
import { ZoomControl } from "react-leaflet";
export default function Pollutedareas() {
  const divRef = useRef(null);
  const mapDiv = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    (async () => {
      if (!divRef.current) return;

      // Cargar Leaflet solo en cliente
      await import("leaflet/dist/leaflet.css");
      const leaflet = await import("leaflet");
      const L = leaflet.default || leaflet;

      // Crear mapa
      const map = L.map(divRef.current).setView([24, -102], 4); // centro MX
      map.setMinZoom(2);
      map.setMaxZoom(8); // <= porque el fondo es Level8

      // Base de referencia (OSM)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const date = "2025-09-15";
      // --- TILES NASA GIBS (fechas fijas) ---

      // 1) Fondo visual: True Color (MODIS Terra) - JPG - Level 8
//       L.tileLayer(
//   "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-10-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
//   { maxZoom: 9, zIndex: 500, attribution: "NASA GIBS" }
// ).addTo(map);
//       // 2) Aire: NO2 (Sentinel-5P) - PNG - Level 6
//       L.tileLayer(
//         "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/S5P_NO2_TROPOSPHERIC_COLUMN/default/2025-10-01/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png",
//         { maxZoom: 6, opacity: 0.7, zIndex: 700, attribution: "NASA GIBS" }
//       ).addTo(map);
//https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_Aerosol_Type_Day/default/2017-07-09/GoogleMapsCompatible_Level6/5/5/5.jpg
      L.tileLayer(
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OMI_Aerosol_Index/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
  { maxZoom: 6, opacity: 0.65, zIndex: 710, attribution: "NASA GIBS (Aura OMI)" }
).addTo(map);

      // 3) Agua: Clorofila-a (MODIS Aqua) - PNG - Level 7 (opcional)
      // L.tileLayer(
      //   "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_Chlorophyll_A/default/2025-10-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
      //   { maxZoom: 7, opacity: 0.7, zIndex: 650, attribution: "NASA GIBS" }
      // ).addTo(map);
    })();
  }, []);
// ...existing code...
  return(
    <div className="grid-cols-2">
        <Header/>
        
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "5%",
            width: "220px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "18px",
            zIndex: 1000,
          }}
        >
          <form className="flex flex-col gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" id="realista" />
              Mapa Realista
            </label>
            <label>
              Fecha:
              <input type="date" id="fecha" className="border rounded px-2 py-1 w-full" />
            </label>
            <label>
              Capa:
              <select id="capa" className="border rounded px-2 py-1 w-full">
                <option value="OMI_Aerosol_Index">Aerosol Index (OMI)</option>
                <option value="MODIS_Terra_CorrectedReflectance_TrueColor">True Color (MODIS Terra)</option>
                <option value="S5P_NO2_TROPOSPHERIC_COLUMN">NO₂ (Sentinel-5P)</option>
                <option value="MODIS_Aqua_Chlorophyll_A">Clorofila-a (MODIS Aqua)</option>
              </select>
            </label>
          </form>
        </div>
        
        <div ref={divRef} className="h-600 w-900, relative"  style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: 900,
          height: 600,
        }} />
      <div>
        <h1 className="text-5xl text-center">POLLUTED AREAS</h1>
     
      </div>
    </div>
  )
// ...existing code...
}


/* 

import { useEffect, useRef } from "react";

export default function Page() {
  const mapRef = useRef(null);

  useEffect(() => {
    let map;

    (async () => {
      if (typeof window === "undefined" || mapRef.current) return;

      // Importa CSS y Leaflet SOLO en cliente
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");

      map = L.map("map").setView([19.4326, -99.1332], 12); // CDMX
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
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

  return <div id="map" style={{ height: "100vh", width: "100%" }} />;
}



*/


/* 
*/

  // return(
  //   <div className="grid-cols-2">
  //       <Header/> {/* style={{ height: "600", width: "900" }} */}
  //       <div ref={divRef} className="h-600 w-900, relative"  style={{
  //         position: "absolute",
  //         top: "20%",
  //         left: "30%",
  //         width: 900,
  //         height: 600,
  //       }} />
  //     <div>
  //       <h1 className="text-5xl text-center">POLLUTED AREAS</h1>
  //       <div className="flex items-center border-2 rounded-2xl w-min">
  //         <label id="Realista"> Mapa Realista</label>
  //         <input type="Checkbox" className="border-2 border-black" id="Realista"/>
  //       </div>
  //     </div>
        
  //   </div>
  // )
