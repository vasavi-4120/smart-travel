import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import io from "socket.io-client";
import "mapbox-gl/dist/mapbox-gl.css";
import socket from "../socket/socket";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const TrackPage = () => {
  const { tripId } = useParams();
  const serverUrl = "http://localhost:8000" || import.meta.env.VITE_SERVER_URL;

  const mapContainer = useRef(null);
  const map = useRef(null);

  const marker = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);

  const routeCoords = useRef([]);

  const [status, setStatus] = useState("Connecting...");
  const [autoFollow, setAutoFollow] = useState(true);
  const [tripData, setTripData] = useState(null);

  // ✅ Fetch trip
  const fetchTrip = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/trips/${tripId}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      setTripData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tripId) fetchTrip();
  }, [tripId]);

  // ✅ INIT MAP
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [78.4867, 17.385],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // 🚗 User marker
    marker.current = new mapboxgl.Marker({ color: "red" })
      .setLngLat([78.4867, 17.385])
      .addTo(map.current);

    map.current.on("load", () => {
      // 🟢 FULL ROUTE
      map.current.addSource("route-main", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });

      map.current.addLayer({
        id: "route-main",
        type: "line",
        source: "route-main",
        paint: {
          "line-width": 5,
          "line-color": "#28a745",
        },
      });

      // 🔵 LIVE ROUTE
      map.current.addSource("route-live", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });

      map.current.addLayer({
        id: "route-live",
        type: "line",
        source: "route-live",
        paint: {
          "line-width": 4,
          "line-color": "#007bff",
        },
      });
    });
  }, []);

  // ✅ ADD MARKERS + MAIN ROUTE
  useEffect(() => {
    if (!map.current || !tripData) return;

    const { start, end } = tripData;
    if (!start || !end) return;

    // 🟢 Start Marker
    if (!startMarker.current) {
      startMarker.current = new mapboxgl.Marker({ color: "green" })
        .setLngLat([start.lng, start.lat])
        .setPopup(new mapboxgl.Popup().setText(start.name))
        .addTo(map.current);
    }

    // 🔵 End Marker
    if (!endMarker.current) {
      endMarker.current = new mapboxgl.Marker({ color: "blue" })
        .setLngLat([end.lng, end.lat])
        .setPopup(new mapboxgl.Popup().setText(end.name))
        .addTo(map.current);
    }

    // 🎯 Fit map
    const bounds = new mapboxgl.LngLatBounds()
      .extend([start.lng, start.lat])
      .extend([end.lng, end.lat]);

    map.current.fitBounds(bounds, { padding: 80 });

    // 🛣 Draw full route
    const drawRoute = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );

        const data = await res.json();
        const route = data.routes[0].geometry;

        const source = map.current.getSource("route-main");
        if (source) source.setData(route);
      } catch (err) {
        console.error(err);
      }
    };

    drawRoute();
  }, [tripData]);

  // ✅ SOCKET LIVE TRACKING
  useEffect(() => {
  if (!tripId) return;

  socket.emit("joinTrip", tripId);

  const handleLocation = (data) => {
    const { lat, lng } = data;

    setStatus("Live Tracking");

    marker.current.setLngLat([lng, lat]);

    routeCoords.current.push([lng, lat]);

    const source = map.current.getSource("route-live");
    if (source) {
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoords.current,
        },
      });
    }

    if (autoFollow) {
      map.current.flyTo({
        center: [lng, lat],
        speed: 1.2,
      });
    }
  };

  const handleSOS = (data) => {
    setStatus("🚨 Emergency Mode");
  };

  socket.on("LIVE_LOCATION_UPDATE", handleLocation);
  socket.on("SOS_TRIGGERED", handleSOS);

  return () => {
    socket.emit("leaveTrip", tripId);   // ✅ leave room
    socket.off("LIVE_LOCATION_UPDATE", handleLocation);
    socket.off("SOS_TRIGGERED", handleSOS);
  };
}, [tripId, autoFollow]);

  return (
    <div
      style={{
         height: "150vh",
        width: "100%",
        position: "relative",
        padding: "150px",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      {/* 🔴 STATUS PANEL */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          padding: "12px 18px",
          borderRadius: "12px",
          zIndex: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          textAlign: "center",
          minWidth: "250px",
        }}
      >
        <div style={{ fontWeight: "600", marginBottom: "6px" }}>
          {status}
        </div>

        {tripData && (
          <div style={{ fontSize: "13px", color: "#555" }}>
            <div>🟢 {tripData.start?.name}</div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>⬇</div>
            <div>🔵 {tripData.end?.name}</div>
          </div>
        )}

        <button
          onClick={() => setAutoFollow(!autoFollow)}
          style={{
            marginTop: "8px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            background: autoFollow ? "#dc3545" : "#007bff",
            color: "white",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {autoFollow ? "Stop Follow" : "Follow"}
        </button>
      </div>

      {/* 🗺 MAP */}
      <div
        ref={mapContainer}
        style={{
          height: "100%",
          width: "100%",
          marginTop: "20px",
         borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
         background: "#eaeaea",
         border: "2px solid #ddd",
        }}
      />
    </div>
  );
 
};

export default TrackPage;

// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom"; // ✅ FIX
// import mapboxgl from "mapbox-gl";
// import io from "socket.io-client";
// import "mapbox-gl/dist/mapbox-gl.css";
// import { TrendingUpTwoTone } from "@mui/icons-material";
// import TripModel from "../../../backend/model/TripModel";

// mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

// const socket = io("http://localhost:8000");

// const TrackPage = () => {
//   const { tripId } = useParams(); // ✅ get tripId from URL

//   const mapContainer = useRef(null);
//   const map = useRef(null);
//   const marker = useRef(null);
//   const routeCoords = useRef([]); // ✅ store path

//   const [status, setStatus] = useState("Connecting...");
//   const [autoFollow, setAutoFollow] = useState(true);

//   const [tripData, setTripData] = useState(null);

//   // 🧾 Fetch trip details on load
// useEffect(() => {
//   const fetchTrip = async () => {
//     try {
//       const res = await fetch(`http://localhost:8000/api/trip/${tripId}`);
//       const data = await res.json();
//       setTripData(data);
//     } catch (err) {
//       console.error("Error fetching trip:", err);
//     }
//   };

//   if (tripId) fetchTrip();
// }, [tripId]);

// const drawRoute = async (start, end) => {
//   try {
//     const res = await fetch(
//       `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
//     );

//     const data = await res.json();

//     const route = data.routes[0].geometry;

//     if (map.current.getSource("route-main")) {
//       map.current.getSource("route-main").setData(route);
//     } else {
//       map.current.addSource("route-main", {
//         type: "geojson",
//         data: route,
//       });

//       map.current.addLayer({
//         id: "route-main",
//         type: "line",
//         source: "route-main",
//         paint: {
//           "line-width": 5,
//           "line-color": "#28a745",
//         },
//       });
//     }
//   } catch (err) {
//     console.error("Route error:", err);
//   }
// };

//   // 🗺 INIT MAP
//   useEffect(() => {
//     if (map.current) return;

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [78.4867, 17.385],
//       zoom: 12,
//     });

//     map.current.addControl(new mapboxgl.NavigationControl());

//     // 📍 Marker
//     marker.current = new mapboxgl.Marker({ color: "red" })
//       .setLngLat([78.4867, 17.385])
//       .addTo(map.current);

//     // 🟦 Route line
//     map.current.on("load", () => {
//       map.current.addSource("route", {
//         type: "geojson",
//         data: {
//           type: "Feature",
//           geometry: {
//             type: "LineString",
//             coordinates: [],
//           },
//         },
//       });

//       map.current.addLayer({
//         id: "route",
//         type: "line",
//         source: "route",
//         paint: {
//           "line-width": 4,
//           "line-color": "#007bff",
//         },
//       });
//     });
//     if (!map.current || !tripData) return;

//   const { start, end } = tripData;

//   // 🟢 FROM marker
//   new mapboxgl.Marker({ color: "green" })
//     .setLngLat([start.lng, start.lat])
//     .setPopup(new mapboxgl.Popup().setText("Start Location"))
//     .addTo(map.current);

//   // 🔵 TO marker
//   new mapboxgl.Marker({ color: "blue" })
//     .setLngLat([end.lng, end.lat])
//     .setPopup(new mapboxgl.Popup().setText("Destination"))
//     .addTo(map.current);

//   // 🎯 Fit map to both points
//   const bounds = new mapboxgl.LngLatBounds()
//     .extend([start.lng, start.lat])
//     .extend([end.lng, end.lat]);

//   map.current.fitBounds(bounds, { padding: 80 });
//   }, [tripData]);

//   // 📡 SOCKET LISTENER
//   useEffect(() => {
//     if (!tripId) return;

//     socket.emit("joinTrip", tripId);

//     const handleLocation = (data) => {
//       const { lat, lng } = data;

//       setStatus("Live Tracking");

//       // ✅ Smooth animation
//       const start = marker.current.getLngLat();
//       const end = [lng, lat];

//       let i = 0;
//       const steps = 20;

//       const animate = () => {
//         i++;
//         const latNow = start.lat + (end[1] - start.lat) * (i / steps);
//         const lngNow = start.lng + (end[0] - start.lng) * (i / steps);

//         marker.current.setLngLat([lngNow, latNow]);

//         if (i < steps) requestAnimationFrame(animate);
//       };

//       animate();

//       // 🟦 Update route line
//       routeCoords.current.push([lng, lat]);

//       const route = map.current.getSource("route");
//       if (route) {
//         route.setData({
//           type: "Feature",
//           geometry: {
//             type: "LineString",
//             coordinates: routeCoords.current,
//           },
//         });
//       }

//       // 🎯 Auto follow
//       if (autoFollow) {
//         map.current.flyTo({
//           center: [lng, lat],
//           speed: 1.2,
//         });
//       }
//     };

//     const handleSOS = (data) => {
//       setStatus("🚨 Emergency Mode");

//       new mapboxgl.Marker({ color: "red" })
//         .setLngLat([data.location.lng, data.location.lat])
//         .addTo(map.current);

//       alert("🚨 Emergency Triggered!");
//     };

//     socket.on("LIVE_LOCATION_UPDATE", handleLocation);
//     socket.on("SOS_TRIGGERED", handleSOS);

//     return () => {
//       socket.off("LIVE_LOCATION_UPDATE", handleLocation);
//       socket.off("SOS_TRIGGERED", handleSOS);
//     };
//   }, [tripId, autoFollow]);

//   return (
//     <div
//       style={{
//         height: "150vh",
//         width: "100%",
//         position: "relative",
//         padding: "150px",
//         background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
//       }}
//     >
//       {/* 🔴 STATUS PANEL */}
//       <div
//         style={{
//           position: "absolute",
//           top: "20px", // distance from top
//           left: "50%", // move to middle horizontally
//           transform: "translateX(-50%)",
//           background: "white",
//           padding: "12px 16px",
//           borderRadius: "12px",
//           zIndex: 10,
//           boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
//           minWidth: "200px",
//           textAlign: "center",
//         }}
//       >
//         <div style={{ marginBottom: "8px" }}>
//           <b>Status:</b> {status}
//         </div>

//         <button
//           onClick={() => setAutoFollow(!autoFollow)}
//           style={{
//             padding: "6px 10px",
//             borderRadius: "6px",
//             border: "none",
//             background: "#007bff",
//             color: "white",
//             cursor: "pointer",
//           }}
//         >
//           {autoFollow ? "Stop Follow" : "Follow User"}
//         </button>
//       </div>

//       {/* 🗺 MAP */}
//       <div
//         ref={mapContainer}
//         style={{
//           height: "100%",
//           width: "100%",
//         }}
//       />
//     </div>
//   );
// };

// export default TrackPage;
