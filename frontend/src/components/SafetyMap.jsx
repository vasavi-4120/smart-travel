import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import { Map } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔹 Fix Leaflet default marker icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const SafetyMap = () => {
  const navigate = useNavigate();
  const [safetyData, setSafetyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSafetyData([
        {
          lat: 40.7128,
          lng: -74.006,
          riskLevel: "high",
          location: "Downtown",
          incidents: 15,
        },
        {
          lat: 40.758,
          lng: -73.9855,
          riskLevel: "moderate",
          location: "Times Square",
          incidents: 8,
        },
        {
          lat: 40.7831,
          lng: -73.9712,
          riskLevel: "safe",
          location: "Central Park",
          incidents: 2,
        },
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "safe":
        return "#4caf50";
      case "moderate":
        return "#ff9800";
      case "high":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getRiskRadius = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return 20;
      case "moderate":
        return 15;
      case "safe":
        return 10;
      default:
        return 10;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Safety Heat Map
        </Typography>

        <Box sx={{ height: 300, position: "relative" }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <MapContainer
              center={[40.7128, -74.006]}
              zoom={12}
              style={{
                height: "100%",
                width: "100%",
                borderRadius: "8px",
              }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {safetyData.map((point) => (
                <CircleMarker
                  key={`${point.lat}-${point.lng}`}
                  center={[point.lat, point.lng]}
                  radius={getRiskRadius(point.riskLevel)}
                  pathOptions={{
                    color: getRiskColor(point.riskLevel),
                    fillColor: getRiskColor(point.riskLevel),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{point.location}</strong>
                      <br />
                      Risk Level:{" "}
                      <span
                        style={{
                          color: getRiskColor(point.riskLevel),
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {point.riskLevel}
                      </span>
                      <br />
                      {point.incidents && (
                        <span>Incidents: {point.incidents}</span>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}

          {/* Overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(2px)",
              pointerEvents: "none",
              "& button": { pointerEvents: "auto" },
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                backgroundColor: "rgba(255,255,255,0.9)",
                p: 1,
                borderRadius: 1,
              }}
            >
              Interactive Safety Map
            </Typography>

            <Button
              variant="outlined"
              startIcon={<Map />}
              onClick={() => navigate("/safety-map")}
              sx={{ mt: 2, backgroundColor: "white" }}
            >
              Open Full Map
            </Button>
          </Box>
        </Box>

        {/* Legend */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
        >
          <Box display="flex" gap={2}>
            {["safe", "moderate", "high"].map((level) => (
              <Box
                key={level}
                display="flex"
                alignItems="center"
                gap={0.5}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: getRiskColor(level),
                  }}
                />
                <Typography variant="body2">
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary">
            Updated: Just now
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SafetyMap;