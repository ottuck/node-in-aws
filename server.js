// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB 연결 성공'))
  .catch((err) => console.log('MongoDB 연결 실패:', err));

// 정적 파일 제공
app.use(express.static('public'));

// 라우트 설정
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// 데이터베이스 모델 로드
const Message = require('./models/Message');

// 사용자 정보를 저장할 메모리 객체
const users = {};

// 포켓몬 이미지 URL 목록
const pokemonImages = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',
  // 필요에 따라 더 추가하세요
];

// 사용자 정리 주기 (예: 1시간마다 검사)
const USER_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1시간
// 비활성 사용자 제거 시간 기준 (예: 48시간)
const USER_INACTIVE_THRESHOLD = 48 * 60 * 60 * 1000; // 48시간

// 사용자 정리 함수
function cleanUpInactiveUsers() {
  const now = Date.now();
  for (const userId in users) {
    const user = users[userId];
    if (now - user.lastActive.getTime() > USER_INACTIVE_THRESHOLD) {
      delete users[userId];
      console.log(`비활성 사용자 제거: ${userId}`);
    }
  }
}

// 사용자 정리 작업 스케줄링
setInterval(cleanUpInactiveUsers, USER_CLEANUP_INTERVAL);

// Socket.IO 이벤트 처리
io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  // 클라이언트로부터 사용자 정보 요청 수신
  socket.on('request user info', (data) => {
    const userId = data.userId;

    let user = users[userId];
    let isNewUser = false;

    if (!user) {
      // 새로운 사용자 생성
      const username = generateRandomUsername();
      const profileImage = getRandomProfileImage();
      user = {
        id: userId,
        username: username,
        profileImage: profileImage,
        connectTime: new Date(),
        lastActive: new Date(),
      };
      users[userId] = user;
      isNewUser = true;
    } else {
      // 기존 사용자: 접속 시간 및 마지막 활동 시간 업데이트
      user.connectTime = new Date();
      user.lastActive = new Date();
    }

    // 사용자 정보 전달
    socket.emit('user info', user);

    // 새로운 사용자일 경우에만 접속 알림
    if (isNewUser) {
      io.emit('system message', `${user.username}님이 채팅에 참여하셨습니다.`);
    }

    // 이전 메시지 로드: 접속 시간 이후의 메시지만 로드
    (async () => {
      try {
        const messages = await Message.find({ timestamp: { $gte: user.connectTime } })
          .sort({ timestamp: 1 })
          .exec();
        socket.emit('load messages', messages);
      } catch (err) {
        console.error('이전 메시지 로드 실패:', err);
      }
    })();
  });

  // 메시지 전송 이벤트 처리
  socket.on('chat message', async (msg) => {
    const userId = msg.userId;
    const messageText = msg.message;
    const user = users[userId];

    if (user) {
      // 마지막 활동 시간 업데이트
      user.lastActive = new Date();

      try {
        const message = new Message({
          userId: user.id,
          username: user.username,
          message: messageText,
          profileImage: user.profileImage,
          timestamp: new Date(),
        });
        await message.save();
        io.emit('chat message', {
          userId: user.id,
          username: user.username,
          message: messageText,
          profileImage: user.profileImage,
          timestamp: message.timestamp,
        });
      } catch (err) {
        console.error('메시지 저장 실패:', err);
      }
    } else {
      console.error('사용자를 찾을 수 없습니다:', userId);
    }
  });

  // 퇴장 알림
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제됨:', socket.id);
    // 필요에 따라 사용자 정보 정리
  });
});

// 유틸리티 함수
function generateRandomUsername() {
  return '익명유저' + Math.floor(Math.random() * 10000);
}

function getRandomProfileImage() {
  return pokemonImages[Math.floor(Math.random() * pokemonImages.length)];
}

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
