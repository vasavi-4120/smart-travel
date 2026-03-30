import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const SafeRouteMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const hasFitted = useRef(false);

  // ✅ store markers (important fix)
  const startMarker = useRef(null);
  const endMarker = useRef(null);

  const [message, setMessage] = useState("");

  const DEFAULT_LOCATION = [79.0193, 17.9784];

  const getTripData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/trips/active", {
        credentials: "include",
      });

      // ✅ handle empty / error responses safely
      if (!res.ok) {
        console.warn("API Error:", res.status);
        return null;
      }

      const text = await res.text();

      // ✅ prevent crash if empty response
      if (!text) return null;

      const data = JSON.parse(text);

      if (data.status === "NoActiveTrip") {
        return null;
      }

      return data;
    } catch (err) {
      console.error("Fetch Error:", err);
      return null;
    }
  };

  const unsafeZones = [{ lat: 16.86, lng: 79.53 }];

  const isUnsafe = (coord) => {
    return unsafeZones.some(
      (zone) =>
        Math.abs(coord[1] - zone.lat) < 0.05 &&
        Math.abs(coord[0] - zone.lng) < 0.05,
    );
  };

  const drawRoute = async (data) => {
    try {
      if (!map.current || !map.current.isStyleLoaded()) return; // ✅ FIX

      // const data = await getTripData();

      if (!data) {
        setMessage("No active trip 🚫");

        if (startMarker.current) {
          startMarker.current.remove();
          startMarker.current = null;
        }

        if (endMarker.current) {
          endMarker.current.remove();
          endMarker.current = null;
        }

        const layers = map.current.getStyle()?.layers || [];

        layers.forEach((layer) => {
          if (layer.id.startsWith("route-")) {
            if (map.current.getLayer(layer.id)) {
              map.current.removeLayer(layer.id);
            }
            if (map.current.getSource(layer.id)) {
              map.current.removeSource(layer.id);
            }
          }
        });

        // map.current.flyTo({
        //   center: DEFAULT_LOCATION,
        //   zoom: 7,
        // });
        return;
      }

      setMessage("");

      const start = [data.start.lng, data.start.lat];
      const end = [data.end.lng, data.end.lat];

      // map.current.fitBounds([start, end], {
      //   padding: 100,
      //   duration: 1000,
      // });

      if (!hasFitted.current) {
        map.current.fitBounds([start, end], {
          padding: 100,
          duration: 1000,
        });
        hasFitted.current = true;
      }

      // ✅ START marker
      if (!startMarker.current) {
        startMarker.current = new mapboxgl.Marker({ color: "blue" })
          .setLngLat(start)
          .addTo(map.current);
      } else {
        startMarker.current.setLngLat(start);
      }

      // ✅ END marker
      if (!endMarker.current) {
        endMarker.current = new mapboxgl.Marker({ color: "black" })
          .setLngLat(end)
          .addTo(map.current);
      } else {
        endMarker.current.setLngLat(end);
      }

      // const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;

      const res = await fetch(url);
      if (!res.ok) return;

      const routeData = await res.json();
      if (!routeData.routes?.length) return;

      // const route = routeData.routes[0].geometry;
      const routes = routeData.routes;

      // 🧹 remove ONLY existing route layers safely
      const existingLayers = map.current.getStyle()?.layers || [];

      existingLayers.forEach((layer) => {
        if (layer.id.startsWith("route-")) {
          if (map.current.getLayer(layer.id)) {
            map.current.removeLayer(layer.id);
          }
          if (map.current.getSource(layer.id)) {
            map.current.removeSource(layer.id);
          }
        }
      });

      routes.forEach((routeObj, index) => {
        const route = routeObj.geometry;

        let routeColor = "green";
        let riskCount = 0;

        for (let coord of route.coordinates) {
          if (isUnsafe(coord)) {
            riskCount++;
          }
        }

        if (riskCount > 5) routeColor = "red";
        else if (riskCount > 0) routeColor = "yellow";

        const routeId = `route-${index}`;

        // add new
        map.current.addSource(routeId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
          },
        });

        map.current.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          paint: {
            "line-color": routeColor,
            "line-width": index === 0 ? 6 : 4,
            "line-opacity": index === 0 ? 1 : 0.6,
          },
        });
      });
    } catch (err) {
      console.error("Route error:", err);
    }
  };

  const updateLocation = async (data) => {
    // const data = await getTripData();
    // if (!data || data.status !== "Active") return;
    if (!data) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const userCoords = [pos.coords.longitude, pos.coords.latitude];

      // 🚗 Move marker smoothly
      if (!userMarker.current) {
        userMarker.current = new mapboxgl.Marker({ color: "orange" })
          .setLngLat(userCoords)
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat(userCoords);
        map.current.easeTo(
          {
            center: userCoords,
            duration: 1000,
          },
          (err) => {
            console.error("Geolocation error:", err);
            setMessage("Location access denied ❌");
          },
        );
      }

      // 📡 Send to backend
      try {
        await fetch("http://localhost:8000/api/trips/location", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripId: data.tripId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });
      } catch (err) {
        console.error("Location update error:", err);
      }
    });
  };

  useEffect(() => {
    if (map.current) return; // ✅ IMPORTANT FIX

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: DEFAULT_LOCATION,
      zoom: 7,
    });

    let interval; // move here

    map.current.on("load", () => {
      // 🔴 Unsafe zones marker
      unsafeZones.forEach((zone) => {
        new mapboxgl.Marker({ color: "red" })
          .setLngLat([zone.lng, zone.lat])
          .addTo(map.current);
      });

      drawRoute();

      interval = setInterval(async () => {
        const data = await getTripData();

        if (!data) {
          setMessage("No active trip 🚫");
          return;
        }
        updateLocation(data);
        drawRoute(data);
      }, 5000);
    });

    // ✅ cleanup must be OUTSIDE load
    return () => {
      if (interval) clearInterval(interval);
      if (map.current) {
        map.current.remove(); // 🔥 important
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
          margin: "20px auto", // centers horizontally
          borderRadius: "10px",
          overflow: "hidden",
        }}
      />
      {message && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            right: "10px", // ensures it fits small screens
            maxWidth: "300px",
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            zIndex: 1,
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}
    </>
  );
};

export default SafeRouteMap;
