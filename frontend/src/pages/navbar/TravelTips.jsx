import React, { useState, useEffect } from "react";
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
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Rating,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import {
  Search,
  FilterList,
  ExpandMore,
  LocationOn,
  Security,
  HealthAndSafety,
  LocalPolice,
  MedicalServices,
  Warning,
  Lightbulb,
  Share,
  Bookmark,
  BookmarkBorder,
  ArrowBack,
  Language,
  LocalHospital,
  Phone,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import "./TravelTips.css";

const TravelTips = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bookmarkedTips, setBookmarkedTips] = useState(new Set());
  const [viewMode, setViewMode] = useState("all");
  const [savedSearchTerm, setSavedSearchTerm] = useState("");
  const [savedCategory, setSavedCategory] = useState("all");
  const [expandedTip, setExpandedTip] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // Sample travel tips data
  const travelTips = [
    {
      id: 1,
      title: "Emergency Contact Preparation",
      category: "emergency",
      priority: "high",
      description:
        "Always save local emergency numbers in your phone and keep a physical copy.",
      detailedContent: `
        <h3>Essential Emergency Contacts</h3>
        <ul>
          <li>Local Police: 112 (EU) or 911 (US)</li>
          <li>Ambulance: 112 or 911</li>
          <li>Fire Department: 112 or 911</li>
          <li>Poison Control: Check local number</li>
          <li>Your Country's Embassy</li>
        </ul>
        <p><strong>Pro Tip:</strong> Program these numbers into your phone's speed dial and keep a card in your wallet.</p>
      `,
      tags: ["emergency", "preparation", "safety"],
      rating: 4.8,
      location: "Global",
      author: "SafeTourist Team",
      lastUpdated: "2024-01-15",
    },
    {
      id: 2,
      title: "Digital Safety Measures",
      category: "digital",
      priority: "medium",
      description: "Protect your digital information while traveling abroad.",
      detailedContent: `
        <h3>Digital Security Checklist</h3>
        <ul>
          <li>Use VPN on public Wi-Fi networks</li>
          <li>Enable two-factor authentication</li>
          <li>Backup important documents to cloud</li>
          <li>Avoid using public computers for sensitive transactions</li>
          <li>Keep devices updated with latest security patches</li>
        </ul>
      `,
      tags: ["digital", "security", "technology"],
      rating: 4.5,
      location: "Global",
      author: "Cyber Security Expert",
      lastUpdated: "2024-01-10",
    },
    {
      id: 3,
      title: "Health and Medical Preparedness",
      category: "health",
      priority: "high",
      description:
        "Essential health precautions and medical preparation for travelers.",
      detailedContent: `
        <h3>Health Preparation Guide</h3>
        <ul>
          <li>Carry a basic first-aid kit</li>
          <li>Research local hospitals and clinics</li>
          <li>Check vaccination requirements</li>
          <li>Carry prescription medications in original packaging</li>
          <li>Know your blood type and allergies</li>
        </ul>
      `,
      tags: ["health", "medical", "preparation"],
      rating: 4.9,
      location: "Global",
      author: "Medical Advisor",
      lastUpdated: "2024-01-08",
    },
    {
      id: 4,
      title: "Transportation Safety",
      category: "transport",
      priority: "medium",
      description: "Safe transportation practices in unfamiliar locations.",
      detailedContent: `
        <h3>Transportation Safety Tips</h3>
        <ul>
          <li>Use licensed taxi services or reputable ride-sharing apps</li>
          <li>Always wear seatbelts</li>
          <li>Avoid traveling at night in unfamiliar areas</li>
          <li>Keep valuables out of sight in vehicles</li>
          <li>Share your ride details with trusted contacts</li>
        </ul>
      `,
      tags: ["transport", "safety", "vehicles"],
      rating: 4.3,
      location: "Global",
      author: "Travel Safety Expert",
      lastUpdated: "2024-01-12",
    },
    {
      id: 5,
      title: "Cultural Awareness and Local Laws",
      category: "cultural",
      priority: "low",
      description:
        "Understanding local customs and regulations to avoid misunderstandings.",
      detailedContent: `
        <h3>Cultural Sensitivity Guide</h3>
        <ul>
          <li>Research local customs and dress codes</li>
          <li>Learn basic phrases in local language</li>
          <li>Understand local laws regarding photography</li>
          <li>Respect religious sites and practices</li>
          <li>Be aware of local etiquette for dining and social interactions</li>
        </ul>
      `,
      tags: ["cultural", "laws", "etiquette"],
      rating: 4.2,
      location: "Regional",
      author: "Cultural Advisor",
      lastUpdated: "2024-01-05",
    },
    {
      id: 6,
      title: "Money and Document Security",
      category: "financial",
      priority: "high",
      description:
        "Protecting your finances and important documents while traveling.",
      detailedContent: `
        <h3>Financial Security Measures</h3>
        <ul>
          <li>Use money belts or hidden pockets</li>
          <li>Carry multiple payment methods</li>
          <li>Keep digital copies of important documents</li>
          <li>Notify your bank of travel plans</li>
          <li>Use hotel safes for valuables</li>
        </ul>
      `,
      tags: ["financial", "documents", "security"],
      rating: 4.7,
      location: "Global",
      author: "Financial Security Expert",
      lastUpdated: "2024-01-18",
    },
  ];

  const categories = [
    {
      id: "all",
      label: "All Tips",
      icon: <Lightbulb />,
      count: travelTips.length,
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: <LocalPolice />,
      count: travelTips.filter((tip) => tip.category === "emergency").length,
    },
    {
      id: "health",
      label: "Health",
      icon: <MedicalServices />,
      count: travelTips.filter((tip) => tip.category === "health").length,
    },
    {
      id: "digital",
      label: "Digital",
      icon: <Security />,
      count: travelTips.filter((tip) => tip.category === "digital").length,
    },
    {
      id: "transport",
      label: "Transport",
      icon: <LocationOn />,
      count: travelTips.filter((tip) => tip.category === "transport").length,
    },
    {
      id: "cultural",
      label: "Cultural",
      icon: <Language />,
      count: travelTips.filter((tip) => tip.category === "cultural").length,
    },
    {
      id: "financial",
      label: "Financial",
      icon: <HealthAndSafety />,
      count: travelTips.filter((tip) => tip.category === "financial").length,
    },
  ];

  const priorityColors = {
    high: "#ff4444",
    medium: "#ff9800",
    low: "#4caf50",
  };

  let tipsToFilter = travelTips;

  if (viewMode === "bookmarked") {
    // If in bookmark view, the base list is ONLY the bookmarked tips
    tipsToFilter = travelTips.filter((tip) => bookmarkedTips.has(tip.id));
  }

  const filteredTips = tipsToFilter.filter((tip) => {
    const matchesSearch =
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" || tip.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleBookmark = (tipId) => {
    const newBookmarks = new Set(bookmarkedTips);
    if (newBookmarks.has(tipId)) {
      newBookmarks.delete(tipId);
    } else {
      newBookmarks.add(tipId);
    }
    setBookmarkedTips(newBookmarks);
  };

  const bookmarkedTipsData = travelTips.filter((tip) =>
    bookmarkedTips.has(tip.id),
  );

  const handleTipExpand = (tipId) => {
    setExpandedTip(expandedTip === tipId ? null : tipId);
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find((cat) => cat.id === category);
    return categoryObj ? categoryObj.icon : <Lightbulb />;
  };

  return (
    <div className="travel-tips-page">
      <section className="relative bg-gradient-to-br from-indigo-400 to-purple-700">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto text-center py-16 px-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            Smart Travel Safety Tips
          </h1>
          <p className="text-lg text-white">
            Expert advice to keep you safe and prepared during your travels
          </p>
        </div>
      </section>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Search and Filter Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search travel tips, safety advice, emergency procedures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  icon={<Warning />}
                  label="High Priority"
                  sx={{ backgroundColor: "#ffebee", color: "#d32f2f" }}
                />

                <Chip
                  icon={<Bookmark />}
                  label={`${bookmarkedTips.size} Saved`}
                  clickable
                  onClick={() => {
                    const newViewMode =
                      viewMode === "bookmarked" ? "all" : "bookmarked";

                    if (newViewMode === "bookmarked") {
                      // 🟢 ACTION: Switching TO Bookmarked View
                      // 1. SAVE the current filters (searchTerm and selectedCategory)
                      setSavedSearchTerm(searchTerm);
                      setSavedCategory(selectedCategory);

                      // 2. CLEAR the active filters to show ALL saved tips
                      setSearchTerm("");
                      setSelectedCategory("all");
                    } else {
                      // 🔴 ACTION: Switching BACK TO All Tips View
                      // 1. RESTORE the previously saved filters
                      setSearchTerm(savedSearchTerm);
                      setSelectedCategory(savedCategory);

                      // 2. Clear the saved state (optional, but good practice)
                      setSavedSearchTerm("");
                      setSavedCategory("all");
                    }

                    // 3. Update the view mode state
                    setViewMode(newViewMode);
                  }}
                  color={viewMode === "bookmarked" ? "primary" : "default"}
                  variant={viewMode === "bookmarked" ? "filled" : "outlined"}
                  sx={{
                    backgroundColor:
                      viewMode === "bookmarked" ? "#1976d2" : "#e3f2fd",
                    color: viewMode === "bookmarked" ? "white" : "#1976d2",
                  }}
                />
                {viewMode === "bookmarked"
                  ? Array.from(bookmarkedTips)
                      .map((id) => travelTips.find((tip) => tip.id === id))
                      .filter(Boolean)
                      .map((tip) => (
                        <Card key={tip.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6">{tip.title}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {tip.description}
                            </Typography>
                            <Chip label={tip.category} size="small" />
                          </CardContent>
                        </Card>
                      ))
                  : travelTips
                      .filter((tip) =>
                        tip.title
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      )
                      .filter((tip) =>
                        selectedCategory === "" ? true : tip.category === "",
                      )
                      .map((tip) => (
                        <Card key={tip.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6">{tip.title}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {tip.description}
                            </Typography>
                            <Chip label={tip.category} size="small" />
                          </CardContent>
                        </Card>
                      ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* Categories Sidebar */}
          {/* Categories Sidebar */}
          {!isMobile && (
            <Grid size={{ md: 3 }}>
              <Card className="categories-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categories
                  </Typography>
                  <List>
                    {categories.map((category) => (
                      // <ListItem
                      //   key={category.id}
                      //   button
                      //   selected={selectedCategory === category.id}
                      //   onClick={() => setSelectedCategory(category.id)}
                      //   className="category-item"
                      // >

                      //   <Box sx={{ mr: 1, color: "primary.main" }}>
                      //     {category.icon}
                      //   </Box>
                      //   <ListItemText
                      //     primary={category.label}
                      //     secondary={`${category.count} tips`}
                      //   />
                      // </ListItem>

                      <ListItem key={category.id} disablePadding>
                        <ListItemButton
                          selected={selectedCategory === category.id}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Box sx={{ mr: 1, color: "primary.main" }}>
                            {category.icon}
                          </Box>
                          <ListItemText
                            primary={category.label}
                            secondary={`${category.count} tips`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Tips Grid */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {selectedCategory === "all"
                  ? "All Safety Tips"
                  : categories.find((cat) => cat.id === selectedCategory)
                      ?.label}
                <Typography
                  component="span"
                  color="textSecondary"
                  sx={{ ml: 1 }}
                >
                  ({filteredTips.length} tips)
                </Typography>
              </Typography>
            </Box>

            {filteredTips.length === 0 ? (
              <Alert severity="info">
                No tips found matching your search criteria. Try different
                keywords or categories.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredTips.map((tip) => (
                  <Grid size={{ xs: 12 }} key={tip.id}>
                    <Card
                      className={`tip-card ${
                        expandedTip === tip.id ? "expanded" : ""
                      }`}
                    >
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={2}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box className="category-icon">
                              {getCategoryIcon(tip.category)}
                            </Box>
                            <Chip
                              label={tip.priority.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: priorityColors[tip.priority],
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => toggleBookmark(tip.id)}
                              color={
                                bookmarkedTips.has(tip.id)
                                  ? "primary"
                                  : "default"
                              }
                            >
                              {bookmarkedTips.has(tip.id) ? (
                                <Bookmark />
                              ) : (
                                <BookmarkBorder />
                              )}
                            </IconButton>
                            <IconButton size="small">
                              <Share />
                            </IconButton>
                          </Box>
                        </Box>

                        <Typography variant="h6" component="h3" gutterBottom>
                          {tip.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="textSecondary"
                          paragraph
                        >
                          {tip.description}
                        </Typography>

                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={2}
                        >
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {tip.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                onClick={() => setSearchTerm(tag)}
                              />
                            ))}
                          </Box>
                          <Rating value={tip.rating} readOnly size="small" />
                        </Box>

                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          fontSize="0.875rem"
                          color="text.secondary"
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn fontSize="small" />
                            <span>{tip.location}</span>
                          </Box>
                          <span>Updated: {tip.lastUpdated}</span>
                        </Box>

                        <Box textAlign="center" mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ExpandMore />}
                            onClick={() => handleTipExpand(tip.id)}
                          >
                            {expandedTip === tip.id ? "Show Less" : "Read More"}
                          </Button>
                        </Box>

                        {expandedTip === tip.id && (
                          <Box
                            className="tip-details"
                            mt={2}
                            p={2}
                            sx={{
                              backgroundColor: "rgba(0,0,0,0.02)",
                              borderRadius: 1,
                              borderLeft: "4px solid",
                              borderLeftColor: "primary.main",
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: tip.detailedContent,
                              }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Author: {tip.author}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filter Tips
          </Typography>
          <List>
            {categories.map((category) => (
              // <ListItem
              //   key={category.id}
              //   button
              //   selected={selectedCategory === category.id}
              //   onClick={() => {
              //     setSelectedCategory(category.id);
              //     setMobileDrawerOpen(false);
              //   }}
              // >
              //   <Box sx={{ mr: 1, color: "primary.main" }}>{category.icon}</Box>
              //   <ListItemText
              //     primary={category.label}
              //     secondary={`${category.count} tips`}
              //   />
              // </ListItem>
              <ListItem key={category.id} disablePadding>
                <ListItemButton
                  selected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Box sx={{ mr: 1, color: "primary.main" }}>
                    {category.icon}
                  </Box>
                  <ListItemText
                    primary={category.label}
                    secondary={`${category.count} tips`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          className="filter-fab"
          onClick={() => setMobileDrawerOpen(true)}
        >
          <FilterList />
        </Fab>
      )}
    </div>
  );
};

export default TravelTips;
