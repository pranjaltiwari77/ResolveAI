import { io } from 'socket.io-client';

// Use Vite's environment variables or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});
