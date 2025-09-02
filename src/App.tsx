// src/App.tsx
import React from "react";
import EarthquakeMap from "./components/EarthquakeMap"; // make sure this file exists

const App: React.FC = () => {
  return (
    <div style={{ height : "100vh", display: "flex", flexDirection: "column", padding: "20px", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <EarthquakeMap />
      </div>
    </div>
  );
};

export default App;
