let ioInstance = null;

const init = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Client connected to WebSocket: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected from WebSocket: ${socket.id}`);
    });
  });
};

const getIo = () => ioInstance;

const broadcast = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  } else {
    console.warn('Socket.IO not initialized. Cannot broadcast event:', event);
  }
};

module.exports = {
  init,
  getIo,
  broadcast
};
