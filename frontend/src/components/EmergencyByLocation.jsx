// src/components/EmergencyByLocation.jsx
import React, { useEffect, useState } from "react";

const CONTACTS_DB = [
  { id: "city-center", name: "City Center Police", lat: 12.9719, lon: 77.5946, phone: "100" },
  { id: "east", name: "East District Ambulance", lat: 12.9800, lon: 77.6000, phone: "108" },
  { id: "north", name: "North Hospital", lat: 13.0000, lon: 77.6100, phone: "102" }
];

// Haversine distance (meters)
const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmergencyByLocation = () => {
  const [loc, setLoc] = useState(null);
  const [nearest, setNearest] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => console.warn("Geolocation failed", err)
    );
  }, []);

  useEffect(() => {
    if (!loc) return;
    let best = null;
    CONTACTS_DB.forEach(c => {
      const d = distanceMeters(loc.lat, loc.lon, c.lat, c.lon);
      if (!best || d < best.dist) best = { contact: c, dist: d };
    });
    setNearest(best);
  }, [loc]);

  return (
    <div className="emergency-loc-card">
      <h3>Emergency Contacts (based on your location)</h3>
      {!loc && <p>Locating you… (allow location in browser)</p>}
      {loc && nearest && (
        <div>
          <p><strong>Nearest:</strong> {nearest.contact.name}</p>
          <p><strong>Phone:</strong> <a href={`tel:${nearest.contact.phone}`}>{nearest.contact.phone}</a></p>
          <p><strong>Distance:</strong> {(nearest.dist / 1000).toFixed(2)} km</p>
          <button onClick={() => window.location.href = `tel:${nearest.contact.phone}`}>Call Now</button>
        </div>
      )}
      {loc && !nearest && <p>No contact data for this region.</p>}
    </div>
  );
};

export default EmergencyByLocation;
