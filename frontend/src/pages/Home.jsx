import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Alert,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  LocationOn,
  Emergency,
  Warning,
  Phone,
  Map,
  Security,
  Language,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const emergencyServices = [
    {
      title: "Emergency SOS",
      description: "Immediate assistance with one tap",
      icon: <Emergency sx={{ fontSize: 40 }} />,
      color: "#ff4444",
      action: () => handleEmergencySOS(),
    },
    {
      title: "Report Incident",
      description: "Report safety concerns or incidents",
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: "#ff9800",
      action: () => navigate("/report-incident"),
    },
    {
      title: "Live Location",
      description: "Share your real-time location",
      icon: <LocationOn sx={{ fontSize: 40 }} />,
      color: "#2196f3",
      action: () => navigate("/live-location"),
    },
    {
      title: "Safety Check",
      description: "Schedule safety check-ins",
      icon: <Security sx={{ fontSize: 40 }} />,
      color: "#4caf50",
      action: () => navigate("/safety-check"),
    },
  ];

  const safetyTips = [
    "Keep emergency contacts handy",
    "Share your itinerary with trusted contacts",
    "Be aware of local emergency numbers",
    "Avoid isolated areas after dark",
    "Keep valuables secure and out of sight",
  ];

  const handleEmergencySOS = () => {
    setEmergencyAlert(true);
    // In a real app, this would trigger API calls to emergency services
    setTimeout(() => setEmergencyAlert(false), 5000);
  };

  const navigationItems = [
    "Home",
    "Safety Map",
    "Emergency Contacts",
    "Travel Tips",
    "Profile",
  ];

  return (
    <div className="homepage">
      {/* Emergency Alert */}
      {emergencyAlert && (
        <Alert
          severity="error"
          className="emergency-alert"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setEmergencyAlert(false)}
            >
              DISMISS
            </Button>
          }
        >
          Emergency alert sent! Help is on the way. Your location has been
          shared with emergency services.
        </Alert>
      )}

      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-indigo-400 to-purple-700">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto text-center py-16 px-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Safety Companion
          </h1>
          <p className="text-lg text-white">
            Smart emergency response and safety services for tourists
          </p>
        </div>
        
      </section>

      {/* Emergency Services */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Emergency Services
        </Typography>
        <Typography
          variant="h6"
          component="p"
          textAlign="center"
          color="textSecondary"
          mb={4}
        >
          Quick access to safety and emergency features
        </Typography>

        <Grid container spacing={4}>
          {emergencyServices.map((service, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                className="service-card"
                sx={{
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
                onClick={service.action}
              >
                <CardContent>
                  <Box sx={{ color: service.color, mb: 2 }}>{service.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Safety Tips */}
      <Box className="safety-tips-section" py={8}>
        <Container>
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            color="white"
          >
            Safety Tips
          </Typography>
          <Grid container spacing={2} justifyContent="center" mt={2}>
            {safetyTips.map((tip, index) => (
              <Grid key={index}>
                <Chip
                  label={tip}
                  variant="outlined"
                  sx={{
                    color: "white",
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Quick Actions */}
      <Container sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="quick-action-card">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Phone sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6">Emergency Contacts</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Local police, ambulance, and embassy contacts for your current
                  location
                </Typography>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate("/emergency-contacts")}
                  >
                    View Contacts
                  </Button>
                </CardActions>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="quick-action-card">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Map sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6">Safety Map</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  View safe zones, emergency services, and reported incidents in
                  your area
                </Typography>
                <CardActions>
                  <Button size="small" onClick={() => navigate("/safety-map")}>
                    Open Map
                  </Button>
                </CardActions>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Home;
