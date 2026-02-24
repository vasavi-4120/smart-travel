import React, { useContext, useState } from 'react'
import { IoEye,IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import  {userDataContext}  from '../../context/UserContext';
import axios from "axios"

function SignIn() {
  const [showPassword,setShowPassword] = useState(false)
  const {serverUrl,userData,setUserData} = useContext(userDataContext)
  const navigate = useNavigate()
  const [email,setEmail ] = useState("")
  const [password,setPassword ] = useState("")
  const [err,setErr] = useState("")
  const [loading,setLoading] = useState(false)

  const handleSignIn = async (e) => {
  e.preventDefault();
  setErr("");
  setLoading(true);

  try {
    const result = await axios.post(
      `${serverUrl}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );

    //  SET ONLY USER OBJECT
    setUserData(result.data.user);

    setLoading(false);
    navigate("/profile");
  } catch (error) {
    console.log(error);
    setUserData(null);
    setLoading(false);
    setErr(error.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-100 via-purple-100 to-indigo-200">
  <form
    onSubmit={handleSignIn}
    className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
  >
    <h1 className="text-3xl font-bold text-center text-violet-700">
      Welcome Back
    </h1>

    <p className="text-center text-gray-500">
      Sign in to <span className="text-violet-600 font-semibold">Smart Travel</span>
    </p>

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

    {/* Error */}
    {err && <p className="text-red-500 text-sm">{err}</p>}

    {/* Button */}
    <button
      disabled={loading}
      className="w-full h-12 bg-violet-600 hover:bg-violet-700
      text-white rounded-xl font-semibold transition"
    >
      {loading ? "Logging in..." : "Login"}
    </button>

    <p
      className="text-center text-gray-600 cursor-pointer"
      onClick={() => navigate("/signup")}
    >
      Don’t have an account?
      <span className="text-violet-600 font-semibold"> Sign Up</span>
    </p>
  </form>
</div>

  )
}

export default SignIn
