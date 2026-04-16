import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const userDataContext = createContext();

function UserContext({ children }) {
  // const serverUrl =import.meta.env.VITE_SERVER_URL || "http://localhost:8000" ;
  const serverUrl =
    import.meta.env.VITE_SERVER_URL?.trim() || "http://localhost:8000";
  // const serverUrl = "http://localhost:8000" || import.meta.env.VITE_SERVER_URL;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleCurrentUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/auth/me`, {
        withCredentials: true,
      });

      setUserData(res.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        setUserData(null);
      } else {
        console.error("Auth error:", error);
        setUserData(null); // ensure state consistency
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, [serverUrl]);

  const contextValue = {
    serverUrl,
    userData,
    setUserData,
    loading,
  };

  return (
    <userDataContext.Provider value={contextValue}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
