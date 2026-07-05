const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { port } = require('./config/env');
const sockets = require('./sockets');

const server = http.createServer(app);

// Instantiate Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize our socket helper
sockets.init(io);

// Start server
server.listen(port, () => {
  console.log(`HTTP and WebSocket Server is running on port ${port}`);
  
  // Initialize Auto-Checkout Service
  try {
    const { autoCheckoutForgottenSessions } = require('./services/cleanup.service');
    // Run once on startup
    autoCheckoutForgottenSessions();
    // Run hourly
    setInterval(autoCheckoutForgottenSessions, 60 * 60 * 1000);
  } catch (err) {
    console.error('Failed to initialize auto-checkout cleanup:', err);
  }
});
