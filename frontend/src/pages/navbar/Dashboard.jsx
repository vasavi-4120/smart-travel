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
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import SafetyMap from "../../components/SafetyMap";
import SafeRouteMap from "../../components/SafeRouteMap";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Dashboard = () => {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [safetyScore, setSafetyScore] = useState(85);
  const [activeIncidents, setActiveIncidents] = useState(3);
  const [userLocation, setUserLocation] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  const [destination, setDestination] = useState(null);
  const [trips, setTrips] = useState([]);

  const [liveLocation, setLiveLocation] = useState(null);
  const [history, setHistory] = useState([]);

  const intervalRef = useRef(null);

  const [routeCoords, setRouteCoords] = useState([]);

  const destinationIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

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
    axios
      .get("http://localhost:8000/api/trips/myTrip", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setTrips(res.data);

          const active = res.data.find((trip) => trip.status === "Active");

          if (active) {
            setActiveTrip(active);
          }
        }
      })
      .catch((err) => console.log(err));
  }, []);

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
              "http://localhost:8000/api/trips/trackLocation",
              {
                tripId: activeTrip.tripId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              { withCredentials: true },
            );
            console.log("Geolocation triggered");

            console.log("Sending location:", {
              tripId: activeTrip.tripId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
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
    const fetchTrip = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/trips/myTrip", {
          withCredentials: true,
        });

        const active = res.data.find((trip) => trip.status === "Active");

        if (active) {
          setLiveLocation(active.liveLocation);
          setHistory(active.locationHistory || []);
          setDestination(active.to);
        } else {
          // No active trip → reset UI
          setLiveLocation(null);
          setHistory([]);
          setDestination(null);
          setRouteCoords([]);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchTrip();

    intervalRef.current = setInterval(fetchTrip, 10000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!liveLocation || !destination) return;

      try {
        const response = await axios.post(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            coordinates: [
              [Number(liveLocation.lng), Number(liveLocation.lat)],
              [Number(destination.lng), Number(destination.lat)],
            ],
          },
          {
            headers: {
              Authorization: import.meta.env.VITE_ORS_API_KEY,
              "Content-Type": "application/json",
            },
          },
        );

        const coords = response.data.features[0].geometry.coordinates.map(
          (coord) => [
            coord[1], // lat
            coord[0], // lng
          ],
        );

        setRouteCoords(coords);
      } catch (error) {
        console.error("Route API Error:", error);
      }
    };

    fetchRoute();
  }, [liveLocation, destination]);

  const cancelTrip = async (trips) => {
    try {
      await axios.put(
        `http://localhost:8000/api/trips/cancel-trip/${trips.tripId}`,
        { reason: "User cancelled manually" },
        { withCredentials: true },
      );

      alert("Trip Cancelled Successfully");

      // ✅ Update trips instantly without waiting for API refresh
      setTrips((prevTrips) =>
        prevTrips.map((t) =>
          t.tripId === trips.tripId ? { ...t, status: "Cancelled",cancelReason: "User cancelled manually",
          cancelledAt: new Date(), } : t,
        ),
      );

      // ✅ If it was active, reset activeTrip UI
      if (activeTrip?.tripId === trips.tripId) {
        setActiveTrip(null);
        setLiveLocation(null);
        setHistory([]);
        setDestination(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const FitBounds = ({ history, destination, liveLocation }) => {
    const map = useMap();

    useEffect(() => {
      const points = [];

      if (liveLocation?.lat && liveLocation?.lng) {
        points.push([liveLocation.lat, liveLocation.lng]);
      }

      if (destination?.lat && destination?.lng) {
        points.push([destination.lat, destination.lng]);
      }

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [history, destination, liveLocation, map]);

    return null;
  };

  const handleEmergencySOS = () => {
    // In real app, this would trigger emergency protocols
    alert("Emergency SOS activated! Help is on the way.");
    setEmergencyAlerts((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: "EMERGENCY SOS ACTIVATED - Authorities notified",
        type: "emergency",
        time: new Date().toLocaleTimeString(),
      },
    ]);
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

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "Active":
  //       return "success";
  //     case "Pending":
  //       return "warning";
  //     case "Cancelled":
  //       return "error";
  //     case "Completed":
  //       return "primary";
  //     default:
  //       return "default";
  //   }
  // };

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
                        <Chip
                          label={trip.status}
                          size="small"
                          color={
                            trip.status === "Active"
                              ? "success"
                              : trip.status === "Pending"
                                ? "warning"
                                : trip.status === "Cancelled"
                                  ? "error"
                                  : "default"
                          }
                        />
                        {/* <Chip
                          label={trip.status}
                          size="small"
                          color={getStatusColor(trip.status)}
                        /> */}
                      </TableCell>
                      <TableCell>
                        <Button
                          color="error"
                          className={`
    btn 
    ${
      trip.status === "Active"
        ? "bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
        : "bg-gray-300 text-gray-500 cursor-not-allowed py-1 px-3 rounded-full"
    }
  `}
                          disabled={trip.status !== "Active"}
                          onClick={() => cancelTrip(trip)}
                        >
                          Cancel Trip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <SafeRouteMap/>
      

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

// <div className="map-wrapper">
      //   <MapContainer
      //     center={
      //       liveLocation
      //         ? [liveLocation.lat, liveLocation.lng]
      //         : [18.1124, 79.0193]
      //     }
      //     // zoom={liveLocation ? 13 : 7}
      //     zoom={8}
      //     className="map-container"
      //     // style={{ height: "800px", width: "100%" }}
      //   >
      //     <TileLayer
      //       attribution="&copy; OpenStreetMap contributors"
      //       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      //     />

      //     {liveLocation && (
      //       <Marker
      //         position={[Number(liveLocation.lat), Number(liveLocation.lng)]}
      //       >
      //         <Popup>Current Location</Popup>
      //       </Marker>
      //     )}

      //     {liveLocation && destination && routeCoords.length > 0 && (
      //       <Polyline
      //         positions={routeCoords}
      //         pathOptions={{
      //           color: "#2563eb",
      //           weight: 6,
      //         }}
      //       />
      //     )}

      //     {!liveLocation && (
      //       <Circle
      //         center={[18.1124, 79.0193]}
      //         radius={50000}
      //         pathOptions={{ color: "blue", fillOpacity: 0.2 }}
      //       />
      //     )}

      //     {destination &&
      //       !isNaN(Number(destination.lat)) &&
      //       !isNaN(Number(destination.lng)) && (
      //         <Marker
      //           position={[Number(destination.lat), Number(destination.lng)]}
      //           icon={destinationIcon}
      //         >
      //           <Popup>{destination.name || "Destination"}</Popup>
      //         </Marker>
      //       )}

      //     {/* Auto Zoom */}
      //     {/* <FitBounds history={history} destination={destination} /> */}
      //   </MapContainer>
      // </div>

