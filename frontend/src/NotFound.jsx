import React from 'react'
import {Link, Navigate, useNavigate} from 'react-router-dom'

function NotFound() {
    const navigate=useNavigate()
  return (
     <div className='container p-5 mb-5'>
      <div className='row text-center'>
        <h1 className='mt-5'>404 Not Found</h1>
        <p>
          Sorry, the page you are looking for does not exist.
        </p>
        {/* <Link to="/">Go Home</Link> */}
        <button className='p-2 btn btn-primary fs-5 mb-5' 
        style={{width:"15%" , margin:"0 auto",backgroundColor:"#7c3aed",border:"none"}} 
        onClick={()=> navigate("/")}>
            Go Home
        </button>
      </div>
    </div>
  )
}

export default NotFound
