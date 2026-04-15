import { io } from "socket.io-client";

// let socket;

const SERVER_URL ="http://localhost:8000"  ||  import.meta.env.VITE_SERVER_URL;

const socket = io(SERVER_URL, {
  withCredentials: true,
  autoConnect: false, // important
});


export default socket;