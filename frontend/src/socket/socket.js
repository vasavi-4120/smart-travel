import { io } from "socket.io-client";

// let socket;

const socket = io("http://localhost:8000", {
  withCredentials: true,
  autoConnect: false, // important
});

// if (!socket) {
//   socket = io("http://localhost:8000", {
//     withCredentials: true,
//     transports: ["websocket"],
//   });
// }

export default socket;