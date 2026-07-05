import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_BASE_URL = 'http://localhost:5000';

let socketInstance = null;

// Helper to make authenticated fetch requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Initialize or return active WebSocket connection
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_BASE_URL);
  }
  return socketInstance;
}
