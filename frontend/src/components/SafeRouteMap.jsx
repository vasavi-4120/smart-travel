// SafeRouteMap.jsx

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const SafeRouteMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const hasFitted = useRef(false);

  const [message, setMessage] = useState("");

  const DEFAULT_LOCATION = [78.4867, 17.385]; // Hyderabad

  // =========================
  // FETCH ACTIVE TRIP
  // =========================
  const getTripData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/trips/active", {
        credentials: "include",
      });
      if (!res.ok) return null;

      const text = await res.text();
      if (!text) return null;

      return JSON.parse(text);
    } catch (err) {
      console.error("Fetch Error:", err);
      return null;
    }
  };

  // =========================
  // DRAW ROUTE
  // =========================
  const drawRoute = async (data) => {
    if (!map.current || !map.current.isStyleLoaded() || !data) return;

    const start = [data.start.lng, data.start.lat];
    const end = [data.end.lng, data.end.lat];

    if (!hasFitted.current) {
      map.current.fitBounds([start, end], { padding: 100 });
      hasFitted.current = true;
    }

    // Start marker
    if (!startMarker.current) {
      startMarker.current = new mapboxgl.Marker({ color: "blue" })
        .setLngLat(start)
        .addTo(map.current);
    } else startMarker.current.setLngLat(start);

    // End marker
    if (!endMarker.current) {
      endMarker.current = new mapboxgl.Marker({ color: "black" })
        .setLngLat(end)
        .addTo(map.current);
    } else endMarker.current.setLngLat(end);

    // Fetch route
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.routes?.length) return;

    const route = json.routes[0].geometry;

    // Update route instead of removing
    if (map.current.getSource("route")) {
      map.current.getSource("route").setData({ type: "Feature", geometry: route });
    } else {
      map.current.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: route },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": "green",
          "line-width": 5,
        },
      });
    }
  };

  // =========================
  // TRAFFIC ALERT
  // =========================
  const getTrafficAlert = async (tripId) => {
    try {
      const res = await fetch("http://localhost:8000/api/trips/alert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });

      const data = await res.json();
      const alertMsg = data.alert || "No alert";

      const trafficColor = alertMsg.includes("Heavy")
        ? "red"
        : alertMsg.includes("Moderate")
        ? "yellow"
        : "green";

      if (map.current?.getLayer("route")) {
        map.current.setPaintProperty("route", "line-color", trafficColor);
      }

      setMessage(alertMsg);
    } catch (err) {
      console.error("Traffic error:", err);
      setMessage("Traffic data unavailable ⚪");
    }
  };

  // =========================
  // UPDATE USER LOCATION
  // =========================
  const updateLocation = (data) => {
    if (!data || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];

        if (!userMarker.current) {
          userMarker.current = new mapboxgl.Marker({ color: "orange" })
            .setLngLat(coords)
            .addTo(map.current);
        } else {
          userMarker.current.setLngLat(coords);
        }

        // Send location to backend
        await fetch("http://localhost:8000/api/trips/location", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: data.tripId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });
      },
      (err) => {
        console.error(err);
        setMessage("Location access denied ❌");
      }
    );
  };

  const moveToUserLocation = () => {
    if (!map.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        map.current.flyTo({ center: coords, zoom: 7, duration: 1000 });

        if (!userMarker.current) {
          userMarker.current = new mapboxgl.Marker({ color: "orange" })
            .setLngLat(coords)
            .addTo(map.current);
        } else {
          userMarker.current.setLngLat(coords);
        }
      },
      () => {
        // fallback to default location
        map.current.flyTo({ center: DEFAULT_LOCATION, zoom: 10 });
        setMessage("Location denied ❌ — Showing default location");
      }
    );
  };

  // =========================
  // HANDLE NO ACTIVE TRIP
  // =========================
  const handleNoTrip = () => {
    setMessage("No active trip 🚫");
    hasFitted.current = false;
    moveToUserLocation();

    if (map.current) {
      ["route"].forEach((id) => {
        if (map.current.getLayer && map.current.getLayer(id)) map.current.removeLayer(id);
        if (map.current.getSource && map.current.getSource(id)) map.current.removeSource(id);
      });
    }

    [startMarker, endMarker].forEach((m) => {
      if (m.current) {
        m.current.remove();
        m.current = null;
      }
    });
  };

  // =========================
  // INIT MAP
  // =========================
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: DEFAULT_LOCATION,
      zoom: 7,
    });

    let interval;

    map.current.on("load", () => {
      const refreshTripData = async () => {
        const data = await getTripData();
        if (!data) {
          handleNoTrip();
          return;
        }
        updateLocation(data);
        drawRoute(data);
        await getTrafficAlert(data.tripId);
      };

      refreshTripData(); // initial
      interval = setInterval(refreshTripData, 5000);
    });

    return () => {
      if (interval) clearInterval(interval);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          height: "70vh",
          width: "100%",
          maxWidth: "900px",
          margin: "20px auto",
          borderRadius: "10px",
        }}
      />
      {message && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "white",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          {message}
        </div>
      )}
    </>
  );
};

export default SafeRouteMap;

