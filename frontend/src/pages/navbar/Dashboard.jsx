// src/components/Dashboard.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Avatar,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import {
  Notifications,
  LocationOn,
  Emergency,
  Warning,
  Security,
  HealthAndSafety,
  Map,
  People,
  TrendingUp,
  CheckCircle,
  Cancel,
  Menu as MenuIcon,
  ArrowBack,
  LocalPolice,
  LocalHospital,
  Phone,
  Wifi,
  BatteryFull,
  SignalCellularAlt,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
// import "leaflet/dist/leaflet.css";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Polyline,
//   Popup,
//   useMap,
//   Circle,
// } from "react-leaflet";
import SafetyMap from "../../components/SafetyMap";
import SafeRouteMap from "../../components/SafeRouteMap";
import { useContext } from "react";
import { userDataContext } from "../../context/UserContext";
import socket from "../../socket/socket";

const Dashboard = () => {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [safetyScore, setSafetyScore] = useState(85);
  const [activeIncidents, setActiveIncidents] = useState(3);
  const [userLocation, setUserLocation] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const serverUrl =  "http://localhost:8000" || import.meta.env.VITE_SERVER_URL;
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  const [destination, setDestination] = useState(null);
  const [trips, setTrips] = useState([]);
  const { userData } = useContext(userDataContext);
  const [sosData, setSosData] = useState(null);
  const [sosPlaces, setSosPlaces] = useState([]);
  const [showSOSView, setShowSOSView] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const [liveLocation, setLiveLocation] = useState(null);
  const [history, setHistory] = useState([]);

  // const socket = useRef(null);
  const otherUsers = useRef({});

  const intervalRef = useRef(null);

  const [routeCoords, setRouteCoords] = useState([]);

  // const destinationIcon = new L.Icon({
  //   iconUrl:
  //     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  //   shadowUrl: markerShadow,
  //   iconSize: [25, 41],
  //   iconAnchor: [12, 41],
  // });

  const quickStats = [
    {
      title: "Safety Score",
      value: "85%",
      subtitle: "Very Safe",
      color: "#4caf50",
      icon: <Security />,
      trend: "+2%",
    },
    {
      title: "Active Incidents",
      value: "3",
      subtitle: "Nearby Areas",
      color: "#ff9800",
      icon: <Warning />,
      trend: "-1",
    },
    {
      title: "Emergency Ready",
      value: "100%",
      subtitle: "Systems Online",
      color: "#2196f3",
      icon: <Emergency />,
      trend: "✓",
    },
    {
      title: "Tourists Nearby",
      value: "247",
      subtitle: "In Your Area",
      color: "#9c27b0",
      icon: <People />,
      trend: "+12",
    },
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "security",
      title: "Suspicious Activity Reported",
      location: "Central Market",
      time: "5 min ago",
      priority: "medium",
      status: "active",
    },
    {
      id: 2,
      type: "medical",
      title: "Medical Emergency",
      location: "Beach Area",
      time: "12 min ago",
      priority: "high",
      status: "responded",
    },
    {
      id: 3,
      type: "general",
      title: "Weather Alert",
      location: "City Center",
      time: "25 min ago",
      priority: "low",
      status: "resolved",
    },
  ];

  const safetyTips = [
    "Avoid poorly lit areas after dark",
    "Keep emergency contacts handy",
    "Share your location with trusted contacts",
    "Be aware of local emergency numbers",
    "Keep valuables secure",
  ];

  useEffect(() => {
    if (!userData) return;

    const fetchTrip = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/trips/myTrip`, {
          withCredentials: true,
        });
        setTrips(res.data); // Keep the table updated

        const sortedTrips = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        let active = sortedTrips.find((trip) => trip.status === "Active");

        if (!active) {
          active = sortedTrips.find((trip) => trip.status === "Emergency");
        }

        if (active) {
          setActiveTrip(active);
          setLiveLocation(active.liveLocation);
          setHistory(active.locationHistory || []);
          setDestination(active.to);
          // if (active.sosTriggered) {
          //   setSosData(active.sosLocation);
          //   setSosPlaces(active.sosPlaces || []);
          // }
        } else {
          // Only clear if there truly is no active/emergency trip
          setActiveTrip(null);
          setLiveLocation(null);
          setDestination(null);
          setRouteCoords([]);

          setSosData(null);
          setSosPlaces([]);
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          console.log(err);
        }
      }
    };
    fetchTrip();
    intervalRef.current = setInterval(fetchTrip, 10000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [userData]);

  const lastSentTimeRef = useRef(0);

  // for location tracking
  useEffect(() => {
    if (!activeTrip) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();

        if (now - lastSentTimeRef.current > 600000) {
          // 10 mins
          lastSentTimeRef.current = now;

          try {
            await axios.post(
              `${serverUrl}/api/trips/trackLocation`,
              {
                tripId: activeTrip.tripId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              { withCredentials: true },
            );
            socket.emit("LIVE_LOCATION_UPDATE", {
              tripId: activeTrip.tripId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            console.log("Geolocation triggered");

            // console.log("Sending location:", {
            //   tripId: activeTrip.tripId,
            //   lat: position.coords.latitude,
            //   lng: position.coords.longitude,
            // });
          } catch (err) {
            console.log("Location error:", err);
          }
        }
      },
      (error) => console.log(error),
      { enableHighAccuracy: true },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeTrip]);

  // for alerts
  useEffect(() => {
    // Simulate live alerts
    const alertInterval = setInterval(() => {
      setEmergencyAlerts((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now(),
          message: "System check - All services operational",
          type: "info",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }, 30000);

    return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    setShowSOSView(false);
  }, [activeTrip?.tripId]);

  useEffect(() => {
    if (!userData || !activeTrip) return;

    // ✅ CONNECT socket if not already connected
    if (!socket.connected) socket.connect();

    // ✅ JOIN ROOM once connected
    socket.emit("joinTrip", activeTrip.tripId);

    // ===============================
    // 📍 LIVE LOCATION FROM OTHERS
    // ===============================
    // const handleLiveLocation = (data) => {
    //   otherUsers.current[data.socketId] = { lat: data.lat, lng: data.lng };

    //   setEmergencyAlerts((prev) => [
    //     ...prev.slice(-4),
    //     {
    //       id: Date.now(),
    //       message: `User moving: ${data.lat}, ${data.lng}`,
    //       type: "info",
    //       time: new Date().toLocaleTimeString(),
    //     },
    //   ]);
    // };
    const handleLiveLocation = (data) => {
      // ✅ update active trip live location
      setActiveTrip((prev) =>
        prev
          ? {
              ...prev,
              liveLocation: { lat: data.lat, lng: data.lng },
            }
          : prev,
      );

      // optional alerts
      setEmergencyAlerts((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now(),
          message: `User moving: ${data.lat}, ${data.lng}`,
          type: "info",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    };

    socket.on("LIVE_LOCATION_UPDATE", handleLiveLocation);

    // ===============================
    // 🚨 SOS REAL-TIME ALERT
    // ===============================
    const handleSOS = (data) => {
      console.log("🚨 SOS RECEIVED:", data);
      setEmergencyAlerts((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `🚨 Emergency by ${data.traveler?.name}`,
          type: "emergency",
          time: new Date().toLocaleTimeString(),
        },
      ]);
      alert("🚨 Emergency Alert Received!");
    };

    socket.on("SOS_TRIGGERED", handleSOS);

    const handleStatusUpdate = (updatedTrip) => {
      console.log("🔄 Trip Status Sync:", updatedTrip.status);

      setTrips((prev) =>
        prev.map((t) => (t.tripId === updatedTrip.tripId ? updatedTrip : t)),
      );

      // If this is the current active trip, or just became active
      if (
        updatedTrip.status === "Active" ||
        updatedTrip.status === "Emergency"
      ) {
        setActiveTrip(updatedTrip);
      } else if (
        updatedTrip.status === "Completed" ||
        updatedTrip.status === "Cancelled"
      ) {
        if (activeTrip?.tripId === updatedTrip.tripId) {
          setActiveTrip(null);
        }
      }
    };

    socket.on("TRIP_STATUS_UPDATED", handleStatusUpdate);

    return () => {
      socket.off("LIVE_LOCATION_UPDATE", handleLiveLocation);
      socket.off("SOS_TRIGGERED", handleSOS);
      socket.off("TRIP_STATUS_UPDATED", handleStatusUpdate);
    };
  }, [userData, activeTrip?.tripId]);

  const cancelTrip = async (trip) => {
    try {
      await axios.put(
        `${serverUrl}/api/trips/cancel-trip/${trip.tripId}`,
        { reason: "User cancelled manually" },
        { withCredentials: true },
      );

      alert("Trip Cancelled Successfully");

      // ✅ Update trips instantly without waiting for API refresh
      setTrips((prevTrips) =>
        prevTrips.map((t) =>
          t.tripId === trip.tripId
            ? {
                ...t,
                status: "Cancelled",
                cancelReason: "User cancelled manually",
                cancelledAt: new Date(),
              }
            : t,
        ),
      );

      // ✅ If it was active, reset activeTrip UI
      if (activeTrip?.tripId === trip.tripId) {
        setActiveTrip(null);
        setLiveLocation(null);
        setHistory([]);
        setDestination(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmergencySOS = () => {
    if (!activeTrip?.tripId) {
      alert("❌ No active trip found");
      return;
    }

    alert("🚨 Emergency SOS activated!");

    setEmergencyAlerts((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: "EMERGENCY SOS ACTIVATED - Authorities notified",
        type: "emergency",
        time: new Date().toLocaleTimeString(),
      },
    ]);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const res = await fetch(
            `${serverUrl}/api/trips/trigger-emergency/${activeTrip.tripId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ latitude, longitude }),
            },
          );

          const result = await res.json(); // ✅ renamed

          if (!res.ok) throw new Error(result.message);

          // ✅ Update trips list
          if (result.trip) {
            setTrips((prev) =>
              prev.map((t) =>
                t.tripId === result.trip.tripId ? result.trip : t,
              ),
            );

            setActiveTrip(result.trip);
          }

          // ✅ Safe places
          const safePlaces = Array.isArray(result.nearbyPlaces)
            ? result.nearbyPlaces
            : [];

          // ✅ Store SOS location (CURRENT GPS)
          setSosData({
            lat: latitude,
            lng: longitude,
          });

          setSosPlaces(safePlaces);

          alert("✅ SOS sent successfully!");
        } catch (error) {
          console.error(error);
          alert("❌ Failed to send SOS. Try again.");
        }
      },
      () => {
        alert("❌ Location access denied.");
      },
    );
  };

  const handleShowSOSPlaces = async (tripId) => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/trips/sos/${tripId}`,
        { withCredentials: true },
      );

      const { sosLocation, sosPlaces } = res.data;

      if (!sosLocation || !Array.isArray(sosPlaces) || sosPlaces.length === 0) {
        alert("❌ No SOS data available for this trip");
        return;
      }

      // ✅ Update state
      setSosData(sosLocation);
      setSosPlaces(sosPlaces);

      // ✅ Better: don't overwrite full trip blindly
      // setActiveTrip((prev) =>
      //   prev
      //     ? {
      //         ...prev,
      //         status: "Emergency",
      //         sosLocation,
      //         sosPlaces,
      //       }
      //     : prev,
      // );
      setShowSOSView(true);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load SOS data");
    }
  };

  const handleSendPlaces = async (type) => {
  try {
    setLoadingType(type);

    // ❌ OLD (live location)
    // if (!activeTrip?.liveLocation?.lat || !activeTrip?.liveLocation?.lng)

    // ✅ NEW (destination)
    if (!activeTrip?.to?.lat || !activeTrip?.to?.lng) {
      alert("❌ Destination not available");
      return;
    }

    const { lat, lng } = activeTrip.to;

    console.log("📍 Sending destination:", lat, lng);

    const res = await axios.post(
      `${serverUrl}/api/trips/send-preferred-places`,
      {
        lat,
        lng,
        type,
        tripId: activeTrip.tripId,
      },
      { withCredentials: true }
    );

    alert(res.data.message);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to send places");
  } finally {
    setLoadingType(null);
  }
};

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ff4444";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#757575";
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "Emergency":
        return "error";
      case "Active":
        return "primary";
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Emergency":
        return "red";
      case "Cancelled":
        return "gray";
      case "Completed":
        return "green";
      case "Active":
        return "blue";
      default:
        return "orange";
    }
  };

  return (
    <div className="dashboard">
      <section className="relative bg-linear-to-br from-indigo-400 to-purple-700">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto text-center py-16 px-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            Smart Travel Dashboard
          </h1>
          <p className="text-lg text-white">
            Real-time dashboard empowering smart tourist safety with instant
            alerts and rapid emergency response
          </p>
          {/* Emergency SOS Button */}
          <Box className="sos-container">
            <Button
              variant="contained"
              className="sos-button"
              startIcon={<Emergency />}
              onClick={handleEmergencySOS}
            >
              EMERGENCY SOS
            </Button>
          </Box>
        </div>
      </section>

      {/* My Trips Section */}
      <Card sx={{ mt: 4, mb: 1, mx: 8 }} className="dashboard-card">
        <CardContent>
          <Typography variant="h6" gutterBottom className="card-title">
            My Trips
          </Typography>

          {trips.length === 0 ? (
            <Alert severity="info">No trips registered</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Transport</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.tripId}>
                      <TableCell>{trip.from?.name}</TableCell>
                      <TableCell>{trip.to?.name}</TableCell>
                      {/* <TableCell>
                        {trip.from?.name} ({trip.from?.lat}, {trip.from?.lng})
                      </TableCell>
                      <TableCell>
                        {trip.to?.name} ({trip.to?.lat}, {trip.to?.lng})
                      </TableCell> */}
                      <TableCell>
                        {new Date(trip.startDate).toLocaleDateString()}{" "}
                        {trip.startTime}
                      </TableCell>
                      <TableCell>
                        {new Date(trip.endDate).toLocaleDateString()}{" "}
                        {trip.endTime}
                      </TableCell>
                      <TableCell>{trip.meansOfTransport}</TableCell>
                      <TableCell>
                        {/* <Chip
                          label={trip.status}
                          size="small"
                          color={
                            trip.status === "Active"
                              ? "success"
                              : trip.status === "Pending"
                                ? "warning"
                                : trip.status === "Cancelled"
                                  ? "default"
                                  : trip.status === "Emergency"
                                    ? "error"
                                    : "default"
                          }
                        /> */}
                        <Chip
                          label={trip.status}
                          size="small"
                          color={getStatusChipColor(trip.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={2}>
                          {/* Cancel Trip Button */}
                          <Button
                            variant="contained"
                            startIcon={<Cancel />}
                            disabled={trip.status !== "Active"}
                            onClick={() => cancelTrip(trip)}
                            sx={{
                              textTransform: "none",
                              fontWeight: "bold",
                              borderRadius: "25px",
                              px: 2.5,
                              py: 0.8,
                              background:
                                trip.status === "Active"
                                  ? "linear-gradient(135deg, #7b1fa2, #9c27b0)"
                                  : "#e0e0e0",
                              color:
                                trip.status === "Active" ? "#fff" : "#9e9e9e",
                              boxShadow:
                                trip.status === "Active"
                                  ? "0 4px 10px rgba(156,39,176,0.4)"
                                  : "none",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background:
                                  trip.status === "Active"
                                    ? "linear-gradient(135deg, #6a1b9a, #8e24aa)"
                                    : "#e0e0e0",
                                transform:
                                  trip.status === "Active"
                                    ? "scale(1.05)"
                                    : "none",
                                boxShadow:
                                  trip.status === "Active"
                                    ? "0 6px 14px rgba(156,39,176,0.6)"
                                    : "none",
                              },
                            }}
                          >
                            Cancel Trip
                          </Button>

                          {/* SOS Places Button */}
                          {/* <Button
                            variant="contained"
                            startIcon={<Emergency />}
                            disabled={
                              // trip.status !== "Active" &&
                              trip.status !== "Emergency"
                            }
                            onClick={() => handleShowSOSPlaces(trip.tripId)}
                            sx={{
                              textTransform: "none",
                              fontWeight: "bold",
                              borderRadius: "25px",
                              px: 2.5,
                              py: 0.8,
                              background:
                                trip.status === "Active" ||
                                trip.status === "Emergency"
                                  ? "linear-gradient(135deg, #d32f2f, #f44336)"
                                  : "#e0e0e0",
                              color:
                                trip.status === "Active" ||
                                trip.status === "Emergency"
                                  ? "#fff"
                                  : "#9e9e9e",
                              boxShadow:
                                trip.status === "Active" ||
                                trip.status === "Emergency"
                                  ? "0 4px 10px rgba(244,67,54,0.4)"
                                  : "none",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background:
                                  trip.status === "Active" ||
                                  trip.status === "Emergency"
                                    ? "linear-gradient(135deg, #c62828, #e53935)"
                                    : "#e0e0e0",
                                transform:
                                  trip.status === "Active" ||
                                  trip.status === "Emergency"
                                    ? "scale(1.05)"
                                    : "none",
                                boxShadow:
                                  trip.status === "Active" ||
                                  trip.status === "Emergency"
                                    ? "0 6px 14px rgba(244,67,54,0.6)"
                                    : "none",
                              },
                            }}
                          >
                            SOS Places
                          </Button> */}
                          {trip.status === "Emergency" && (
                            <Button
                              variant="contained"
                              startIcon={<Emergency />}
                              onClick={() => handleShowSOSPlaces(trip.tripId)}
                              sx={{
                                textTransform: "none",
                                fontWeight: "bold",
                                borderRadius: "25px",
                                px: 2.5,
                                py: 0.8,
                                background:
                                  "linear-gradient(135deg, #d32f2f, #f44336)",
                                color: "#fff",
                                boxShadow: "0 4px 10px rgba(244,67,54,0.4)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #c62828, #e53935)",
                                  transform: "scale(1.05)",
                                  boxShadow: "0 6px 14px rgba(244,67,54,0.6)",
                                },
                              }}
                            >
                              SOS Places
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {activeTrip?.status === "Active" && (
        <Box sx={{ mx: 8, mt: 2 }}>
          <Typography variant="h6">Explore Nearby</Typography>

          <Box display="flex" gap={2} mt={1} flexWrap="wrap">
            <Button
              variant="contained"
              disabled={loadingType === "tourist"}
              onClick={() => handleSendPlaces("tourist")}
            >
            {loadingType === "tourist" ? "Sending..." : " 🏰 Tourist Places"}
            </Button>

            <Button
              variant="contained"
              color="info"
               disabled={loadingType === "museum"}
              onClick={() => handleSendPlaces("museum")}
            >
             {loadingType === "museum" ? "Sending..." : " 🏛 Museums"}
            </Button>

            <Button
              variant="contained"
              color="success"
              disabled={loadingType === "park"}
              onClick={() => handleSendPlaces("park")}
            >
              {loadingType === "park" ? "Sending..." : "🌳 Parks"}
            </Button>

            <Button
              variant="contained"
              color="warning"
              disabled={loadingType === "food"}
              onClick={() => handleSendPlaces("food")}
            >
              {loadingType === "food" ? "Sending..." : "🍽 Restaurants"}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              disabled={loadingType === "hotel"}
              onClick={() => handleSendPlaces("hotel")}
            >
              {loadingType === "hotel" ? "Sending..." : "🏨 Hotels"}
            </Button>
          </Box>
        </Box>
      )}

      {userData && activeTrip ? (
        <SafeRouteMap
          trip={activeTrip}
          sosData={showSOSView ? sosData : null}
          sosPlaces={showSOSView ? sosPlaces : []}
          triggerSOSView={showSOSView}
        />
      ) : userData ? (
        <Alert severity="info" sx={{ mx: 8, mt: 2 }}>
          Loading active trip...
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mx: 8, mt: 2 }}>
          Please signup or login and register for a trip to view live tracking
          map 🔐
        </Alert>
      )}

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card className="stat-card">
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        component="div"
                        fontWeight="bold"
                        color={stat.color}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" component="div" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stat.subtitle}
                      </Typography>
                    </Box>
                    <Box className="stat-icon" sx={{ color: stat.color }}>
                      {stat.icon}
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography
                      variant="body2"
                      sx={{ color: stat.color, fontWeight: "bold" }}
                    >
                      {stat.trend}
                    </Typography>
                    <TrendingUp
                      sx={{ fontSize: 16, ml: 0.5, color: stat.color }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Recent Alerts */}
            <Card sx={{ mb: 3 }} className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom className="card-title">
                  Recent Safety Alerts
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Alert</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentAlerts.map((alert) => (
                        <TableRow key={alert.id} className="alert-row">
                          <TableCell>
                            <Box className={`alert-type ${alert.type}`}>
                              {alert.type === "security" && <Security />}
                              {alert.type === "medical" && <LocalHospital />}
                              {alert.type === "general" && <Warning />}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {alert.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {alert.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.priority}
                              size="small"
                              sx={{
                                backgroundColor: getPriorityColor(
                                  alert.priority,
                                ),
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.status}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: getStatusColor(alert.status),
                                color: getStatusColor(alert.status),
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {alert.time}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Safety Map Preview */}
            {/* <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom className="card-title">
                  Safety Heat Map
                </Typography>
                <Box className="map-preview">
                  <Box className="map-overlay">
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      textAlign="center"
                    >
                      Interactive Safety Map
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Map />}
                      onClick={() => navigate("/safety-map")}
                      sx={{ mt: 2 }}
                    >
                      Open Full Map
                    </Button>
                  </Box>
                </Box> 
                 <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={2}
                >
                  <Box display="flex" gap={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box className="legend-safe" />
                      <Typography variant="body2">Safe</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box className="legend-warning" />
                      <Typography variant="body2">Moderate</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box className="legend-danger" />
                      <Typography variant="body2">High Risk</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Updated: Just now
                  </Typography>
                </Box>
              </CardContent>
            </Card> */}
            <SafetyMap />
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Quick Safety Tips */}
            <Card sx={{ mb: 3 }} className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom className="card-title">
                  Safety Tips
                </Typography>
                <List>
                  {safetyTips.map((tip, index) => (
                    <ListItem key={index} className="tip-item">
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="dashboard-card">
              <CardContent>
                <Typography variant="h6" gutterBottom className="card-title">
                  System Status
                </Typography>
                <Box className="status-list">
                  <Box className="status-item">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Wifi color="success" />
                      <Typography variant="body2">GPS Tracking</Typography>
                    </Box>
                    <Chip label="Active" size="small" color="success" />
                  </Box>
                  <Box className="status-item">
                    <Box display="flex" alignItems="center" gap={1}>
                      <SignalCellularAlt color="success" />
                      <Typography variant="body2">
                        Emergency Services
                      </Typography>
                    </Box>
                    <Chip label="Online" size="small" color="success" />
                  </Box>
                  <Box className="status-item">
                    <Box display="flex" alignItems="center" gap={1}>
                      <BatteryFull color="success" />
                      <Typography variant="body2">Alert System</Typography>
                    </Box>
                    <Chip label="Operational" size="small" color="success" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Live Alerts Feed */}
        {/* {emergencyAlerts.length > 0 && (
          <Card sx={{ mt: 3 }} className="alerts-feed">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Alerts Feed
              </Typography>
              <Box className="alerts-container">
                {emergencyAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.type === "emergency" ? "error" : "info"}
                    sx={{ mb: 1 }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {alert.time}
                      </Typography>
                    </Box>
                  </Alert>
                ))}
              </Box>
            </CardContent>
          </Card>
        )} */}
      </Container>
    </div>
  );
};

export default Dashboard;
