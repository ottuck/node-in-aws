// config/socketConfig.js
import { Server } from 'socket.io';
import { handleConnection } from '../controllers/chatController.js';

export const configureSocket = (server, middleware) => {
  const io = new Server(server);

  // Socket.IO 미들웨어 설정
  io.use((socket, next) => {
    middleware(socket.request, {}, next);
  });

  // 소켓 연결 이벤트 처리
  io.on('connection', (socket) => {
    handleConnection(socket, io);
  });

  return io;
};