import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const userDataContext = createContext();

function UserContext({ children }) {
  const serverUrl = "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleCurrentUser = async () => {
  try {
    const res = await axios.get(
      `${serverUrl}/api/auth/me`,
      { withCredentials: true }
    );

    setUserData(res.data.user);
  } catch (error) {
    if (error.response?.status === 401) {
      // ✅ Expected → user not logged in
      setUserData(null);
    } else {
      console.error("Auth error:", error);
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    handleCurrentUser();
  }, []);

  return (
    <userDataContext.Provider
      value={{ serverUrl, userData, setUserData, loading }}
    >
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
