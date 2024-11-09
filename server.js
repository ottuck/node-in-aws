// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Redis 클라이언트 import
const { 
  redis, 
  userManager, 
  messageManager, 
  onlineUsersManager,
  testRedisConnection 
} = require('./redisClient');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 포켓몬 이미지 URL 목록
const pokemonImages = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
];

// 정적 파일 제공
app.use(express.static('public'));

// 라우트 설정
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// 데이터베이스 모델 로드
const Message = require('./models/Message');

// 유틸리티 함수
function generateRandomUsername() {
  return '익명유저' + Math.floor(Math.random() * 10000);
}

function getRandomProfileImage() {
  return pokemonImages[Math.floor(Math.random() * pokemonImages.length)];
}

// Socket.IO 이벤트 처리
io.on('connection', async (socket) => {
  console.log('사용자 연결됨:', socket.id);

  // 클라이언트로부터 사용자 정보 요청 수신
  socket.on('request user info', async (data) => {
    try {
      const userId = data.userId;
      socket.userId = userId; // 소켓에 사용자 ID 저장

      let user = await userManager.getUser(userId);
      let isNewUser = false;

      if (!user) {
        // 새로운 사용자 생성
        const username = generateRandomUsername();
        const profileImage = getRandomProfileImage();
        user = {
          id: userId,
          username: username,
          profileImage: profileImage,
          connectTime: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        await userManager.saveUser(userId, user);
        await onlineUsersManager.addOnlineUser(userId);
        isNewUser = true;
      } else {
        await userManager.updateLastActive(userId);
        await onlineUsersManager.addOnlineUser(userId);
      }

      // 현재 온라인 사용자 수 조회
      const onlineCount = await onlineUsersManager.getOnlineCount();

      // 사용자 정보와 함께 온라인 사용자 수 전달
      socket.emit('user info', { ...user, onlineCount });

      if (isNewUser) {
        io.emit('system message', 
          `${user.username}님이 채팅에 참여하셨습니다. (현재 ${onlineCount}명 접속 중)`
        );
      }

      // 최근 메시지 로드
      const recentMessages = await messageManager.getRecentMessages();
      if (recentMessages.length > 0) {
        socket.emit('load messages', recentMessages);
      }

      // MongoDB에서 이전 메시지 로드
      const messages = await Message.find({})
        .sort({ timestamp: -1 })
        .limit(50)
        .exec();
      
      if (messages.length > 0) {
        socket.emit('load messages', messages.reverse());
      }

    } catch (error) {
      console.error('사용자 정보 처리 중 에러:', error);
      socket.emit('error', '사용자 정보 처리 중 오류가 발생했습니다.');
    }
  });

  // 메시지 전송 이벤트 처리
  socket.on('chat message', async (msg) => {
    try {
      const userId = msg.userId;
      const messageText = msg.message;
      const user = await userManager.getUser(userId);

      if (user) {
        await userManager.updateLastActive(userId);

        const message = new Message({
          userId: user.id,
          username: user.username,
          message: messageText,
          profileImage: user.profileImage,
          timestamp: new Date(),
        });

        await message.save();
        
        // Redis에 최근 메시지 저장
        await messageManager.addMessage({
          userId: user.id,
          username: user.username,
          message: messageText,
          profileImage: user.profileImage,
          timestamp: message.timestamp,
        });

        io.emit('chat message', {
          userId: user.id,
          username: user.username,
          message: messageText,
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
    const userId = socket.userId;
    if (userId) {
      try {
        const user = await userManager.getUser(userId);
        await onlineUsersManager.removeOnlineUser(userId);
        const onlineCount = await onlineUsersManager.getOnlineCount();
        
        if (user) {
          io.emit('system message', 
            `${user.username}님이 퇴장하셨습니다. (현재 ${onlineCount}명 접속 중)`
          );
        }
        
        // 온라인 사용자 수 업데이트 브로드캐스트
        io.emit('online users update', onlineCount);
      } catch (error) {
        console.error('사용자 연결 해제 처리 중 에러:', error);
      }
    }
    console.log('사용자 연결 해제됨:', socket.id);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');

    // Redis 연결 테스트
    await testRedisConnection();
    
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