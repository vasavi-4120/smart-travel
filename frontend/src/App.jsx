import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { userDataContext } from './context/UserContext'
import Navbar from './common/Navbar.jsx'
import Footer from './common/Footer.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/navbar/Profile.jsx'
import Guidance from './pages/navbar/Guidance.jsx'
import Makeyourtrip from './pages/navbar/Makeyourtrip.jsx'
import Dashboard from './pages/navbar/Dashboard.jsx'
import TravelTips from './pages/navbar/TravelTips.jsx'
import Signup from './pages/navbar/Signup.jsx'
import Login from './pages/navbar/Login.jsx'
import NotFound from './NotFound.jsx'
import Editprofile from './pages/navbar/Editprofile.jsx'
import TrackPage from "./components/TrackPage";

function App() {
  // const {userData,setUserData} = useContext(userDataContext)
  return (
    
    <>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/traveltips' element={<TravelTips/>} />
        <Route path='/makeyourtrip' element={<Makeyourtrip/>} />
        <Route path='/guidance' element={<Guidance/>} />
        <Route path='/profile' element={<Profile/>} />
        <Route path='/editprofile' element={<Editprofile/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/login' element={<Login/>} />
        <Route path="/track/:tripId" element={<TrackPage />} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
      <Footer/>
    </>
  )
}

export default App;


