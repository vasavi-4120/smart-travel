// SafeRouteMap.jsx

import React, { useEffect, useRef, useState, useContext } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { io } from "socket.io-client";
import { userDataContext } from "../context/UserContext";
import socket from "../socket/socket";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const SafeRouteMap = ({ trip, sosData, sosPlaces }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const tripRef = useRef(trip);

  const userMarker = useRef(null);
  // const otherUserMarker = useRef(null);
  // const userMarker = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const markers = useRef([]);

  const hasFitted = useRef(false);
  const { userData } = useContext(userDataContext);

  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("default");

  const DEFAULT_LOCATION = [78.4867, 17.385];

  // =========================
  // DRAW ROUTE
  // =========================

  const drawRoute = async (data) => {
    if (!map.current || !data) return;

    // ✅ WAIT until map is ready
    if (!map.current.isStyleLoaded()) {
      await new Promise((resolve) => {
        map.current.once("load", resolve);
      });
    }

    // const startPoint = data.liveLocation || data.from;
    const startPoint =
      data.liveLocation?.lat && data.liveLocation?.lng
        ? data.liveLocation
        : data.from;
    // const startPoint = data.from;
    const endPoint = data.to || data.end;

    // console.log("🔄 Drawing route with:", { startPoint, endPoint });

    const isValid = (v) => v !== undefined && v !== null && !isNaN(Number(v));

    if (
      !isValid(startPoint?.lat) ||
      !isValid(startPoint?.lng) ||
      !isValid(endPoint?.lat) ||
      !isValid(endPoint?.lng)
    ) {
      console.log("❌ Invalid coords", startPoint, endPoint);
      return;
    }

    if (!startPoint || !endPoint) {
      console.log("❌ Missing start or end", data);
      return;
    }

    const start = [Number(startPoint.lng), Number(startPoint.lat)];
    const end = [Number(endPoint.lng), Number(endPoint.lat)];

    // ✅ markers
    if (!startMarker.current) {
      startMarker.current = new mapboxgl.Marker({ color: "blue" })
        .setLngLat(start)
        .addTo(map.current);
    } else {
      startMarker.current.setLngLat(start);
    }

    if (!endMarker.current) {
      endMarker.current = new mapboxgl.Marker({ color: "black" })
        .setLngLat(end)
        .addTo(map.current);
    } else {
      endMarker.current.setLngLat(end);
    }

    // ✅ API call
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.routes?.length) return;

    const route = json.routes[0].geometry;

    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    // ALWAYS add again
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: route,
      },
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

    // ✅ center map
    // map.current.flyTo({ center: start, zoom: 14 });
    if (!hasFitted.current) {
      map.current.flyTo({ center: start, zoom: 14 });
      hasFitted.current = true;
    }
  };

  // =========================
  // SEND LOCATION
  // =========================
  const updateLocation = (tripId) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = [pos.coords.longitude, pos.coords.latitude];

      // self marker
      if (!userMarker.current) {
        userMarker.current = new mapboxgl.Marker({ color: "orange" })
          .setLngLat(coords)
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat(coords);
      }

      // API
      await fetch("http://localhost:8000/api/trips/location", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });

      // SOCKET 🔥
      socket.emit("liveLocation", {
        tripId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  const waitForMapLoad = () => {
    return new Promise((resolve) => {
      if (map.current?.isStyleLoaded()) {
        resolve();
      } else {
        map.current.once("style.load", resolve);
      }
    });
  };

  const drawRouteToPlace = async (start, end, id, color) => {
    try {
      await waitForMapLoad();
      if (!map.current) return;

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes?.length) return;

      const route = data.routes[0].geometry;

      await waitForMapLoad();

      // remove old
      if (map.current.getLayer(id)) {
        map.current.removeLayer(id);
      }
      if (map.current.getSource(id)) {
        map.current.removeSource(id);
      }

      map.current.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: route,
        },
      });

      map.current.addLayer({
        id,
        type: "line",
        source: id,
        paint: {
          "line-color": color,
          "line-width": 5,
        },
      });
    } catch (err) {
      console.error("Route error:", err);
    }
  };

  const clearMap = () => {
    if (!map.current) return;

    // Clear all custom markers in the markers ref array
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    // Clear specific refs
    if (startMarker.current) startMarker.current.remove();
    if (endMarker.current) endMarker.current.remove();
    startMarker.current = null;
    endMarker.current = null;

    // Clear any existing route layers
    const layers = ["route", "hospital-route", "police-route"];
    // layers.forEach((layer) => {
    //   if (userMarker.current) {
    //     userMarker.current.remove();
    //     userMarker.current = null;
    //   }
    //   if (map.current.getLayer(layer)) {
    //     map.current.removeLayer(layer);
    //   }
    //   if (map.current.getSource(layer)) {
    //     map.current.removeSource(layer);
    //   }
    // });
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }

    layers.forEach((layer) => {
      if (map.current.getLayer(layer)) {
        map.current.removeLayer(layer);
      }
      if (map.current.getSource(layer)) {
        map.current.removeSource(layer);
      }
    });
  };

  // =========================
  // SHOW SOS
  // =========================
  const showSOSOnMap = (lat, lng, places) => {
    if (!map.current) return;

    // 1. Clear the regular green route if it exists
    if (map.current.getLayer("route")) map.current.removeLayer("route");
    if (map.current.getSource("route")) map.current.removeSource("route");

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const userCoords = [lng, lat];

    // 👤 User marker
    if (!userMarker.current) {
      userMarker.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat(userCoords)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(userCoords);
    }
    // console.log("📍 Places received:", places);
    // 🏥🚓 Mark all places
    places.forEach((place, index) => {
      if (!place.lat || !place.lng || place.lng === 0) return;
      // bounds.extend([place.lng, place.lat]);

      const el = document.createElement("div");
      el.style.fontSize = "24px";

      if (index === 0)
        el.innerHTML = "🟢"; // nearest
      else if (place.name?.toLowerCase().includes("police"))
        el.innerHTML = "🚓";
      else el.innerHTML = "🏥";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.lng, place.lat])
        .addTo(map.current);

      markers.current.push(marker);
    });

    const nearestHospital = places.find((p) => p.type === "hospital");

    const nearestPolice = places.find((p) => p.type === "police");

    // 🛣️ DRAW ROUTES
    if (nearestHospital) {
      drawRouteToPlace(
        userCoords,
        [nearestHospital.lng, nearestHospital.lat],
        "hospital-route",
        "red",
      );
    }

    if (nearestPolice) {
      drawRouteToPlace(
        userCoords,
        [nearestPolice.lng, nearestPolice.lat],
        "police-route",
        "blue",
      );
    }

    // 🔍 Fit bounds
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend(userCoords);

    places.forEach((p) => {
      if (p.lat && p.lng) {
        bounds.extend([p.lng, p.lat]);
      }
    });

    map.current.fitBounds(bounds, { padding: 50 });
  };

  // =========================
  // MAIN EFFECT
  // =========================

  useEffect(() => {
    // 1. Initialize Map
    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: DEFAULT_LOCATION,
        zoom: 12,
      });
    }

    const currentMap = map.current;
    if (!currentMap) return;

    const handleLoad = async () => {
      console.log("✅ Map Loaded");

      new mapboxgl.Marker({ color: "#a324bf" })
        .setLngLat(DEFAULT_LOCATION)
        .setPopup(new mapboxgl.Popup().setHTML("<h4>Default Location</h4>"))
        .addTo(currentMap);

      if (!socket.connected) socket.connect();

      // 🔐 Not logged in
      if (!userData) {
        setMessage("Please login to track your trip 🔐");
        currentMap.flyTo({ center: DEFAULT_LOCATION, zoom: 9 });
        return;
      }

      // 🚫 No trip
      if (!trip || trip.status !== "Active") {
        setMessage("No active trip 🚫");

        clearMap(); // ✅ IMPORTANT: remove old routes + markers

        map.current.flyTo({
          center: DEFAULT_LOCATION,
          zoom: 9,
        });

        // optional default marker
        new mapboxgl.Marker({ color: "#a324bf" })
          .setLngLat(DEFAULT_LOCATION)
          .addTo(map.current);

        return;
      }
      // ✅ ALWAYS SHOW ROUTE FIRST (ignore emergency here)
      setMessage("📍 Live Tracking Active");

      await drawRoute(trip);

      if (trip.liveLocation) {
        const coords = [trip.liveLocation.lng, trip.liveLocation.lat];

        if (!userMarker.current) {
          userMarker.current = new mapboxgl.Marker({ color: "orange" })
            .setLngLat(coords)
            .addTo(map.current);
        } else {
          userMarker.current.setLngLat(coords);
        }

        map.current.flyTo({ center: coords, zoom: 9 });
      }

      // ✅ Join socket
      socket.emit("joinTrip", trip.tripId);

      // 🚨 ONLY trigger SOS when event comes
      socket.on("SOS_TRIGGERED", (data) => {
        setMessage("🚨 Emergency Active!");
        showSOSOnMap(data.location.lat, data.location.lng, data.nearbyPlaces);
      });
    };

    // Trigger load logic
    if (currentMap.loaded()) {
      handleLoad();
    } else {
      currentMap.on("load", handleLoad);
    }

    return () => {
      currentMap.off("load", handleLoad);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        // intervalRef.current = null;
      }
      // socket.off("LIVE_LOCATION_UPDATE");
      socket.off("SOS_TRIGGERED");
    };
  }, [userData, trip]);

  useEffect(() => {
    tripRef.current = trip;
    // console.log("🧠 Trip received in map:", trip);
  }, [trip]);

  useEffect(() => {
  if (!trip || !map.current || trip.status !== "Active") return;

  const run = async () => {
    if (!map.current.isStyleLoaded()) {
      await new Promise((resolve) => map.current.once("load", resolve));
    }

    if (!hasFitted.current) {
      await drawRoute(trip);
    }

    if (trip.liveLocation) {
      const coords = [trip.liveLocation.lng, trip.liveLocation.lat];

      if (!userMarker.current) {
        userMarker.current = new mapboxgl.Marker({ color: "orange" })
          .setLngLat(coords)
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat(coords);
      }
    }
  };

  run();
}, [trip]);

  useEffect(() => {
    
    const refreshMap = async () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      if (!trip || trip.status !== "Active") {
        clearMap();

        map.current.flyTo({
          center: DEFAULT_LOCATION,
          zoom: 9,
        });

        setMessage("No active trip 🚫");
        return;
      }

      clearMap();

      // 🚨 Emergency Mode
      if (trip.status === "Emergency" && trip.sosPlaces?.length > 0) {
        const lat = trip.sosLocation?.lat || trip.liveLocation?.lat;
        const lng = trip.sosLocation?.lng || trip.liveLocation?.lng;

        showSOSOnMap(lat, lng, trip.sosPlaces);
        setMessage("🚨 Emergency Mode Active");
        return;
      }

      // 🎯 VIEW MODE LOGIC
      if (viewMode === "default") {
        // ✅ MOVE TO DEFAULT LOCATION
        map.current.flyTo({
          center: DEFAULT_LOCATION,
          zoom: 7,
        });

        // optional marker

        if (!startMarker.current) {
          startMarker.current = new mapboxgl.Marker({ color: "#a324bf" })
            .setLngLat(DEFAULT_LOCATION)
            .addTo(map.current);
        }

        setMessage("📍 Default Location View");
      } else if (viewMode === "emergency") {
        setMessage("No emergency data available");
      } else {
        await drawRoute(trip);
        setMessage("📍 Standard Route View");
      }
    };

    if (map.current?.loaded()) {
      refreshMap();
    } else {
      map.current?.once("style.load", refreshMap);
    }
  }, [viewMode]);

  useEffect(() => {
    if (sosData && sosPlaces.length > 0) {
      showSOSOnMap(sosData.lat, sosData.lng, sosPlaces);
    }
  }, [sosData, sosPlaces]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <div
          ref={mapContainer}
          style={{
            height: "500px",
            width: "100%",
            borderRadius: "10px",
            maxWidth: "900px",
            margin: "20px auto",
            minHeight: "400px",
          }}
        />

        {/* Move buttons here if you want them strictly attached to the map container */}
        {/* <div className="flex gap-4 justify-center my-4">
          <button
            onClick={() => setViewMode("default")}
            className={`px-4 py-2 rounded ${viewMode === "default" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            📍 Standard View
          </button>

          <button
            onClick={() => setViewMode("emergency")}
            className={`px-4 py-2 rounded ${viewMode === "emergency" ? "bg-red-600 text-white animate-pulse" : "bg-gray-200"}`}
          >
            🚨 Emergency Places
          </button>
        </div> */}

        {/* message overlay */}
        {message && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 1,
              background: "white",
              padding: "10px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </>
  );
};

export default SafeRouteMap;
