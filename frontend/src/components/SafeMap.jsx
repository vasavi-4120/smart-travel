// src/components/SafeMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// sample safe zones (polygons or circles). Replace with real data from server.
const SAFE_ZONES = [
  {
    id: "zone-1",
    name: "Town Center Safe Zone",
    type: "polygon",
    coords: [
      [12.9719, 77.5946],
      [12.9729, 77.5960],
      [12.9700, 77.5970],
      [12.9690, 77.5950],
    ],
    level: "high" // high/medium/low
  },
  {
    id: "zone-2",
    name: "Hospital Safe Circle",
    type: "circle",
    center: [12.9750, 77.5900],
    radius: 250, // meters
    level: "high"
  }
];

const SafeMap = ({ center = [12.9719, 77.5946], zoom = 14 }) => {
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      err => console.warn("Geolocation error", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const levelColor = lvl => ({ high: "green", medium: "orange", low: "red" }[lvl] || "blue");

  return (
    <div style={{ height: 500, width: "100%" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLoc && (
          <>
            <Marker position={userLoc}>
              <Popup>Your location</Popup>
            </Marker>
            <Circle center={userLoc} radius={50} />
          </>
        )}

        {SAFE_ZONES.map(z => {
          if (z.type === "polygon") {
            return (
              <Polygon key={z.id} positions={z.coords} pathOptions={{ color: levelColor(z.level) }}>
                <Popup>
                  <strong>{z.name}</strong><br />
                  Safety: {z.level}
                </Popup>
              </Polygon>
            );
          } else if (z.type === "circle") {
            return (
              <Circle
                key={z.id}
                center={z.center}
                radius={z.radius}
                pathOptions={{ color: levelColor(z.level), fillOpacity: 0.15 }}
              >
                <Popup>
                  <strong>{z.name}</strong><br />
                  Safety: {z.level}
                </Popup>
              </Circle>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default SafeMap;
