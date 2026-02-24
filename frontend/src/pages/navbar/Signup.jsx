import React, { useContext, useState } from "react";
import { IoEye } from "react-icons/io5";
import { IoEyeOff } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../../context/UserContext.jsx";
import axios from "axios";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, userData, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      let result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          username,
          email,
          password,
          contact,
          address,
        },
        { withCredentials: true }
      );
      console.log(result.data);
      setUserData(result.data.user);
      navigate("/profile");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setUserData(null);

      if (error.response && error.response.data.message) {
        setErr(error.response.data.message);
      } else {
        setErr("Something went wrong. Please try again.");
      }
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-100 via-purple-100 to-indigo-200">
      <form
        onSubmit={handleSignUp}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-violet-700">
          Create Account
        </h1>

        <p className="text-center text-gray-500">
          Join{" "}
          <span className="text-violet-600 font-semibold">Smart Travel</span>
        </p>

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="w-full h-12 px-4 rounded-xl border border-gray-300
      focus:ring-2 focus:ring-violet-400 focus:outline-none"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          required
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          className="w-full h-12 px-4 rounded-xl border border-gray-300
      focus:ring-2 focus:ring-violet-400 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        {/* Contact */}
        <input
          type="text"
          placeholder="Contact Number"
          className="w-full h-12 px-4 rounded-xl border border-gray-300
      focus:ring-2 focus:ring-violet-400 focus:outline-none"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
        />

        {/* Address */}
        <input
          type="text"
          placeholder="Address"
          className="w-full h-12 px-4 rounded-xl border border-gray-300
      focus:ring-2 focus:ring-violet-400 focus:outline-none"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-12 px-4 rounded-xl border border-gray-300
        focus:ring-2 focus:ring-violet-400 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <span
            className="absolute right-4 top-3 cursor-pointer text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <IoEyeOff /> : <IoEye />}
          </span>
        </div>

        {err && <p className="text-red-500 text-sm text-center">{err}</p>}

        {/* Button */}
        <button
          disabled={loading}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700
      text-white rounded-xl font-semibold transition"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p
          className="text-center text-gray-600 cursor-pointer"
          onClick={() => navigate("/login")}
        >
          Already have an account?
          <span className="text-violet-600 font-semibold"> Login</span>
        </p>
      </form>
    </div>
  );
}

export default Signup;
