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
});
