import React, { useContext, useMemo, useEffect, useState } from "react";
import profile from "../../assets/profile.png";
import { userDataContext } from "../../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socket from "../../socket/socket";
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
// import {
//   Notifications,
//   LocationOn,
//   Emergency,
//   Warning,
//   Security,
//   HealthAndSafety,
//   Map,
//   People,
//   TrendingUp,
//   CheckCircle,
//   Cancel,
//   Menu as MenuIcon,
//   ArrowBack,
//   LocalPolice,
//   LocalHospital,
//   Phone,
//   Wifi,
//   BatteryFull,
//   SignalCellularAlt,
// } from "@mui/icons-material";

const dummyUser = {
  name: "Guest User",
  _id: "*********",
  email: "guest@smarttravel.com",
  contact: "Not available",
  address: "Not available",
  trips: [],
};

function Profile() {
  const { userData, setUserData, loading } = useContext(userDataContext);
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

  // Memoize the user object to avoid unnecessary object creation on every render
  const user = useMemo(
    () => ({
      username: userData?.username || userData?.name || dummyUser.name,
      _id: userData?._id || dummyUser._id,
      email: userData?.email || dummyUser.email,
      contact: userData?.contact || dummyUser.contact,
      address: userData?.address || dummyUser.address,
      profileImage: userData?.profileImage || null,
      trips: userData?.trips || [],
    }),
    [userData],
  );

  const imageSrc = useMemo(() => {
    const BACKEND_URL = "http://localhost:8000"; // Your backend port

    if (!userData) return profile;

    // If it's a new upload preview (File object)
    if (userData.profileImage instanceof File) {
      return URL.createObjectURL(userData.profileImage);
    }

    // If it's a URL from the database (e.g., "uploads/image.jpg")
    if (userData.profileImage?.url) {
      // Check if the URL is already a full path (like from Cloudinary)
      // or just a local path (starts with 'uploads')
      return userData.profileImage.url.startsWith("http")
        ? userData.profileImage.url
        : `${BACKEND_URL}/${userData.profileImage.url}`;
    }

    return profile;
  }, [userData]);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8000/api/auth/logout",
        {},
        { withCredentials: true },
      );
      setUserData(null);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
  const fetchTrips = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/trips/myTrip`, {
        withCredentials: true,
      });
      setTrips(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setTrips([]);
      } else {
        console.error("Failed to fetch trips", err);
      }
    }
  };

  if (userData) {
    fetchTrips();
  } else {
    setTrips([]);
  }
}, [userData]);
  useEffect(() => {
    if (!userData) return;

    if (!socket.connected) socket.connect();

    const handleStatusUpdate = (updatedTrip) => {
      setTrips((prevTrips) =>
        prevTrips.map((t) =>
          t.tripId === updatedTrip.tripId ? updatedTrip : t,
        ),
      );
    };

    socket.on("TRIP_STATUS_UPDATED", handleStatusUpdate);

    return () => {
      socket.off("TRIP_STATUS_UPDATED", handleStatusUpdate);
    };
  }, [userData]);
  // useEffect(() => {
  //   const fetchTrips = async () => {
  //     try {
  //       const res = await axios.get(`${serverUrl}/api/trips/myTrip`, {
  //         withCredentials: true,
  //       });
  //       setTrips(res.data);
  //     } catch (err) {
  //       if (err.response?.status === 401) {
  //         // ✅ Expected when not logged in
  //         setTrips([]);
  //       } else {
  //         console.error("Failed to fetch trips", err);
  //       }
  //     }
  //   };

  //   // 🚀 Only call if user is logged in
  //   if (userData) {
  //     fetchTrips();
  //   } else {
  //     setTrips([]); // clear trips for guest
  //   }
  // }, [userData]);

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

  const deleteTrip = async (tripId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this trip?",
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${serverUrl}/api/trips/delete-trip/${tripId}`, {
        withCredentials: true,
      });

      setTrips((prev) => prev.filter((t) => t.tripId !== tripId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center my-14 gap-12 px-2">
      {/* PROFILE CARD */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-200 mx-4 p-6 w-full lg:w-96 transition hover:shadow-violet-200 hover:shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-violet-500 text-sm">Welcome</p>
            <p className="text-3xl font-bold text-violet-800">
              {user.username}
            </p>
            <p className="text-sm font-bold text-violet-800">ID: {user._id}</p>
          </div>
          <img
            src={imageSrc}
            alt="Profile"
            className="rounded-full h-20 w-20 object-cover ring-4 ring-violet-300"
          />
        </div>

        <div className="space-y-3 text-violet-700">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Contact" value={user.contact} />
          <InfoRow label="Address" value={user.address} />
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {userData ? (
            <>
              <button
                onClick={handleLogout}
                className="bg-violet-500 hover:bg-violet-600 transition text-white rounded-4xl p-3"
              >
                Logout
              </button>
              <button
                onClick={() => navigate("/editprofile")}
                className="bg-violet-500 hover:bg-violet-600 transition text-white rounded-4xl p-3"
              >
                Edit Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/signup")}
              className="bg-violet-500 hover:bg-violet-600 transition text-white rounded-4xl p-3"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>

      {/* TRIP HISTORY */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-200 p-6 w-full lg:flex-1">
        <h2 className="text-xl font-semibold text-center text-violet-800 mb-4">
          Trip History
        </h2>
        {!userData ? (
          <Alert severity="warning">
            Please sign up or login to view your trips
          </Alert>
        ) : trips.length === 0 ? (
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
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.tripId}>
                    <TableCell>{trip.from?.name}</TableCell>
                    <TableCell>{trip.to?.name}</TableCell>
                    <TableCell>
                      {new Date(trip.startDate).toLocaleDateString()}{" "}
                      {trip.startTime}
                    </TableCell>
                    <TableCell>
                      {new Date(trip.endDate).toLocaleDateString()}{" "}
                      {trip.endTime}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.status}
                        size="small"
                        color={getStatusChipColor(trip.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        disabled={trip.status === "Active"}
                        onClick={() => deleteTrip(trip.tripId)}
                        className={`px-3 py-1 rounded-2xl text-white ${
                          trip.status === "Active"
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-purple-700 hover:bg-pink-600"
                        }`}
                      >
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {/* <TableBody>
                {user.trips.map((trip) => (
                  <TableRow key={trip.tripId || trip._id}>
                    <TableCell>
                      {trip.from?.name || trip.from || "N/A"}
                    </TableCell>
                    <TableCell>{trip.to?.name || trip.to || "N/A"}</TableCell>
                    <TableCell>
                      {trip.startDate
                        ? new Date(trip.startDate).toLocaleDateString()
                        : "N/A"}{" "}
                      {trip.startTime || ""}
                    </TableCell>
                    <TableCell>
                      {trip.endDate
                        ? new Date(trip.endDate).toLocaleDateString()
                        : "N/A"}{" "}
                      {trip.endTime || ""}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.status || "Unknown"}
                        size="small"
                        color={
                          trip.status === "Active"
                            ? "success"
                            : trip.status === "Pending"
                              ? "warning"
                              : trip.status === "Completed"
                                ? "info"
                                : trip.status === "Emergency"
                                  ? "error"
                                  : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody> */}
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}

// Small helper component for cleaner JSX
const InfoRow = ({ label, value }) => (
  <p className="text-lg">
    <span className="font-semibold text-violet-800">{label}:</span> {value}
  </p>
);

export default Profile;
