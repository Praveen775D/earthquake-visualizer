import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayersControl,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import hi from "i18n-iso-countries/langs/hi.json";
import te from "../locales/te.json"; // custom Telugu
import logo from "/logo.png"; 
import { translations } from "../locales";

countries.registerLocale(en);
countries.registerLocale(hi);
countries.registerLocale(te);

type Earthquake = {
  id: string;
  place: string;
  mag: number;
  time: number;
  lat: number;
  lon: number;
  country?: string;
};

const getColor = (mag: number) => {
  if (mag < 3) return "green";
  if (mag < 5) return "gold";
  if (mag < 7) return "orange";
  return "red";
};

// Fly map to selected earthquake
const FlyToLocation: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.flyTo([lat, lon], 6, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
};

// Legend Component
const Legend: React.FC<{ language: "en" | "hi" | "te" }> = ({ language }) => {
  const ranges = [
    { label: translations[language].range_0_3, color: "green" },
    { label: translations[language].range_3_5, color: "gold" },
    { label: translations[language].range_5_7, color: "orange" },
    { label: translations[language].range_7_plus, color: "red" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom : "10px",
        right : "10px",
        background: "white",
        padding: "8px 12px",
        borderRadius: "8px",
        boxShadow: "0 0 6px rgba(0,0,0,0.3)",
        fontSize: "14px",
        zIndex: 1000
      }}
    >
      <b>{translations[language].magnitude}</b>
      {ranges.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", marginTop : "4px" }}>
          <span
            style={{
              display: "inline-block",
              width : "16px",
              height : "16px",
              background: r.color,
              marginRight : "6px",
              borderRadius: "50%",
            }}
          />
          {r.label}
        </div>
      ))}
    </div>
  );
};

const EarthquakeMap: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [language, setLanguage] = useState<"en" | "hi" | "te">("en");
  const [showTable, setShowTable] = useState(false);
  const [filter, setFilter] = useState<"all" | "0-3" | "3-5" | "5-7" | "7+">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedEq, setSelectedEq] = useState<Earthquake | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [feed, setFeed] = useState<"daily" | "weekly">("weekly");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const url =
        feed === "daily"
          ? "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
          : "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        setError(translations[language].earthquakeData + " not available.");
        setEarthquakes([]);
        return;
      }

      const eqs: Earthquake[] = data.features.map((f: any) => {
        const [lon, lat] = f.geometry.coordinates;
        const place: string = f.properties.place || "Unknown";

        let countryCode: string | undefined = undefined;
        const parts = place.split(",").map((p: string) => p.trim());
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1];
          countryCode = countries.getAlpha2Code(lastPart, "en") || undefined;
        }

        return {
          id: f.id,
          place,
          mag: f.properties.mag,
          time: f.properties.time,
          lat,
          lon,
          country: countryCode
        };
      });

      setEarthquakes(eqs);
    } catch (err: any) {
      console.error(err);
      setError(translations[language].earthquakeData + " failed to load.");
      setEarthquakes([]);
    }
  };

  useEffect(() => { fetchData(); }, [feed, language]);

  const formatCountry = (eq: Earthquake) => {
    if (eq.country) return countries.getName(eq.country, language) || eq.country;
    const parts = eq.place.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || "Unknown";
  };

  const applyFilter = (eqs: Earthquake[]) => {
    let filtered = eqs;
    switch (filter) {
      case "0-3": filtered = filtered.filter((e) => e.mag < 3); break;
      case "3-5": filtered = filtered.filter((e) => e.mag >= 3 && e.mag < 5); break;
      case "5-7": filtered = filtered.filter((e) => e.mag >= 5 && e.mag < 7); break;
      case "7+": filtered = filtered.filter((e) => e.mag >= 7); break;
      default: break;
    }
    if (searchTerm.trim() !== "") filtered = filtered.filter((e) => e.place.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  };

  const filteredData = applyFilter(earthquakes);
  const paginatedData = filteredData.slice(0, page * pageSize);

  const handleSearch = () => { setSearchTerm(searchInput); setPage(1); };

  const getFilterColor = (range: string) => {
    switch (range) {
      case "0-3": return "green";
      case "3-5": return "gold";
      case "5-7": return "orange";
      case "7+": return "red";
      default: return "#FF9800";
    }
  };

  return (
    <div style={{ height : "100vh", width : "100%", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#1a1a1a", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logo} alt="Logo" style={{ width : "40px", height : "40px" }} />
          <h2 style={{ margin: 0 }}>Earthquake Visualizer</h2>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder={translations[language].searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "black", width : "140px" }}
          />
          <button onClick={handleSearch} style={{ padding: "4px 8px", borderRadius: "4px", background: "#2196F3", color: "white", border: "none", cursor: "pointer" }}>🔍</button>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => setFeed("daily")} style={{ padding: "4px 8px", borderRadius: "4px", background: feed === "daily" ? "#2196F3" : "#ccc", color: feed === "daily" ? "white" : "black", border: "none", cursor: "pointer" }}>{translations[language].last24h}</button>
            <button onClick={() => setFeed("weekly")} style={{ padding: "4px 8px", borderRadius: "4px", background: feed === "weekly" ? "#2196F3" : "#ccc", color: feed === "weekly" ? "white" : "black", border: "none", cursor: "pointer" }}>{translations[language].last7d}</button>
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value as any)} style={{ padding: "6px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="te">తెలుగు</option>
          </select>
          <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}
                style={{
                  padding: "4px 6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  color: "white",
                  background: getFilterColor(filter)
                }}
              >
                <option value="all" style={{ background: "#FF9800", color: "black" }}>All</option>
                <option value="0-3" style={{ background: "green", color: "white" }}>0 - 3</option>
                <option value="3-5" style={{ background: "gold", color: "black" }}>3 - 5</option>
                <option value="5-7" style={{ background: "orange", color: "white" }}>5 - 7</option>
                <option value="7+" style={{ background: "red", color: "white" }}>7+</option>
              </select>
          <button onClick={() => setShowTable(true)} style={{ padding: "6px 12px", background: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            {translations[language].tableView}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ textAlign: "center", padding: "8px", background: "#ffcccc", color: "#900", fontWeight: "bold" }}>
          {error}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={[20, 80]} zoom={3} style={{ height : "100%", width : "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Normal">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Dark">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO &copy; OpenStreetMap contributors"/>
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredData.map((eq) => (
            <CircleMarker
              key={eq.id}
              center={[eq.lat, eq.lon]}
              radius={6}
              pathOptions={{ color: getColor(eq.mag), fillColor: getColor(eq.mag), fillOpacity: 0.8 }}
            >
              <Popup>
                <b>{eq.place}</b>
                <br />
                <b>{translations[language].country}:</b> {formatCountry(eq)}
                <br />
                <b>{translations[language].mag}:</b> <span style={{ color: getColor(eq.mag), fontWeight: "bold" }}>{eq.mag}</span>
                <br />
                <b>{translations[language].time}:</b> {new Date(eq.time).toLocaleString(language)}
              </Popup>
            </CircleMarker>
          ))}

          {selectedEq && <FlyToLocation lat={selectedEq.lat} lon={selectedEq.lon} />}
          <Legend language={language} />
        </MapContainer>
      </div>

      {/* Table Modal */}
      {showTable && (
        <div style={{ position: "fixed", top : 0, left : 0, width : "100%", height : "100%", background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "white", width : "90%", height : "80%", overflowY: "auto", borderRadius: "10px", padding: "20px", position: "relative" }}>
            <button onClick={() => setShowTable(false)} style={{ position: "absolute", top : "10px", right : "10px", background: "red", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>
              {translations[language].close}
            </button>

            <h2 style={{ textAlign: "center", marginBottom : "15px" }}>{translations[language].earthquakeData}</h2>

            {/* Search & Filter */}
            <div style={{ display: "flex", gap: "10px", marginBottom : "10px", alignItems: "center" }}>
              <input type="text" placeholder={translations[language].searchPlaceholder} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "black", width : "120px" }}/>
              <button onClick={handleSearch} style={{ padding: "4px 8px", borderRadius: "4px", background: "#2196F3", color: "white", border: "none", cursor: "pointer" }}>🔍</button>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}
                style={{
                  padding: "4px 6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  color: "white",
                  background: getFilterColor(filter)
                }}
              >
                <option value="all" style={{ background: "#FF9800", color: "black" }}>All</option>
                <option value="0-3" style={{ background: "green", color: "white" }}>0 - 3</option>
                <option value="3-5" style={{ background: "gold", color: "black" }}>3 - 5</option>
                <option value="5-7" style={{ background: "orange", color: "white" }}>5 - 7</option>
                <option value="7+" style={{ background: "red", color: "white" }}>7+</option>
              </select>
            </div>

            <table style={{ width : "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: "6px", border: "1px solid #ccc" }}>{translations[language].place}</th>
                  <th style={{ padding: "6px", border: "1px solid #ccc" }}>{translations[language].country}</th>
                  <th style={{ padding: "6px", border: "1px solid #ccc" }}>{translations[language].mag}</th>
                  <th style={{ padding: "6px", border: "1px solid #ccc" }}>{translations[language].time}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((eq) => (
                  <tr key={eq.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedEq(eq); setShowTable(false); }}>
                    <td style={{ padding: "6px", border: "1px solid #ccc" }}>{eq.place}</td>
                    <td style={{ padding: "6px", border: "1px solid #ccc" }}>{formatCountry(eq)}</td>
                    <td style={{ padding: "6px", border: "1px solid #ccc", color: getColor(eq.mag), fontWeight: "bold" }}>{eq.mag}</td>
                    <td style={{ padding: "6px", border: "1px solid #ccc" }}>{new Date(eq.time).toLocaleString(language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page * pageSize < filteredData.length && (
              <button onClick={() => setPage(page + 1)} style={{ marginTop : "10px", padding: "6px 12px", background: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthquakeMap;
