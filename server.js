// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient, userManager, messageManager } from './redisClient.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server);

// 세션 미들웨어 설정
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient.getClient() }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  secure: false, // HTTPS가 아닌 경우 false로 설정,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }, // 1일
});

app.use(sessionMiddleware);

// Socket.IO와 세션 미들웨어 연동
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// 정적 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile('chat.html', { root: './public' });
});

// 데이터베이스 모델 로드
import Message from './models/Message.js';

// 유틸리티 함수
function generateRandomUsername() {
  return '익명유저' + Math.floor(Math.random() * 10000);
}

// 프로필 이미지 URL 목록
const profileImages = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
];

function getRandomProfileImage() {
  return profileImages[Math.floor(Math.random() * profileImages.length)];
}

// Socket.IO 이벤트 처리
io.on('connection', async (socket) => {
  console.log('사용자 연결됨:', socket.id);

  const session = socket.request.session;

  if (!session.userId) {
    // 새로운 사용자
    const userId = 'user-' + Math.random().toString(36).substr(2, 16);
    const username = generateRandomUsername();
    const profileImage = getRandomProfileImage();

    session.userId = userId;
    session.username = username;
    session.profileImage = profileImage;
    session.save(); // 세션 저장

    await userManager.saveUser(userId, {
      id: userId,
      username: username,
      profileImage: profileImage,
      connectTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    socket.emit('user info', { id: userId, username, profileImage });
  } else {
    // 기존 사용자
    const userId = session.userId;
    const user = await userManager.getUser(userId);
    if (user) {
      await userManager.updateLastActive(userId);
      socket.emit('user info', { ...user });
    }
  }

  // 사용자를 'global' 방에 추가
  socket.join('global');

  // 현재 온라인 사용자 수 가져오기
  const onlineCount = io.sockets.adapter.rooms.get('global').size;

  // 모든 클라이언트에게 온라인 사용자 수 업데이트
  io.emit('online users update', onlineCount);

  // 시스템 메시지로 새로운 사용자 알림
  socket.broadcast.emit('system message', `${session.username}님이 채팅에 참여하셨습니다. (현재 ${onlineCount}명 접속 중)`);

  // 최근 메시지 로드
  const recentMessages = await messageManager.getRecentMessages();
  if (recentMessages.length > 0) {
    socket.emit('load messages', recentMessages);
  }

  // 메시지 전송 이벤트 처리
  socket.on('chat message', async (msg) => {
    try {
      const userId = session.userId;
      const user = await userManager.getUser(userId);

      if (user) {
        await userManager.updateLastActive(userId);

        const message = new Message({
          userId: user.id,
          username: user.username,
          message: msg.message,
          profileImage: user.profileImage,
          timestamp: new Date(),
        });

        await message.save();

        // Redis에 최근 메시지 저장
        await messageManager.addMessage({
          userId: user.id,
          username: user.username,
          message: msg.message,
          profileImage: user.profileImage,
          timestamp: message.timestamp,
        });

        io.emit('chat message', {
          userId: user.id,
          username: user.username,
          message: msg.message,
          profileImage: user.profileImage,
          timestamp: message.timestamp,
        });
      }
    } catch (error) {
      console.error('메시지 처리 중 에러:', error);
      socket.emit('error', '메시지 전송 중 오류가 발생했습니다.');
    }
  });

  // 연결 해제 처리
  socket.on('disconnect', async () => {
    console.log('사용자 연결 해제됨:', socket.id);

    // 온라인 사용자 수 업데이트
    const onlineCount = io.sockets.adapter.rooms.get('global')?.size || 0;

    // 모든 클라이언트에게 온라인 사용자 수 업데이트
    io.emit('online users update', onlineCount);

    // 시스템 메시지로 사용자 퇴장 알림
    socket.broadcast.emit('system message', `${session.username}님이 퇴장하셨습니다. (현재 ${onlineCount}명 접속 중)`);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB 연결 성공');

    // 서버 시작
    server.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 중 에러 발생:', error);
    process.exit(1);
  }
};

startServer();
