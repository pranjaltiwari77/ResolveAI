import { io } from 'socket.io-client';

// Use empty string in dev to hit Vite proxy, but use real URL in production (Vercel)
const SOCKET_URL = import.meta.env.PROD && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});
