import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "leaflet/dist/leaflet.css";  // ✅ leaflet styles  import 
import "./index.css";
import "./i18n";  // i18next initialization

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
