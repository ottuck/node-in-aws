// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

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
.catch(err => console.log('MongoDB 연결 실패:', err));

// 정적 파일 제공
app.use(express.static('public'));

// 라우트 설정
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// 데이터베이스 모델 로드
const Message = require('./models/Message');

// 익명 사용자 관리 변수
let anonymousUserCount = 0;
const pokemonImages = [
  // 포켓몬 이미지 URL 목록 (필요에 따라 더 추가)
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png',
  // 필요에 따라 더 추가
];

// Socket.IO 이벤트 처리
io.on('connection', (socket) => {
  // 익명 사용자 정보 할당
  anonymousUserCount += 1;
  const username = `익명유저${anonymousUserCount}`;
  const profileImage = pokemonImages[Math.floor(Math.random() * pokemonImages.length)];

  // 클라이언트에게 사용자 정보 전송
  socket.emit('user info', { username, profileImage });

  // 접속 알림
  io.emit('system message', `${username}님이 채팅에 참여하셨습니다.`);

  // 메시지 전송 이벤트 처리
  socket.on('chat message', async (msg) => {
    try {
      const message = new Message({
        username: username,
        message: msg,
        profileImage: profileImage,
        timestamp: new Date(),
      });
      await message.save();
      io.emit('chat message', { 
        username, 
        message: msg, 
        profileImage, 
        timestamp: message.timestamp 
      });
    } catch (err) {
      console.error('메시지 저장 실패:', err);
    }
  });

  // 이전 메시지 로드
  (async () => {
    try {
      const messages = await Message.find().sort({ timestamp: 1 }).limit(100).exec();
      socket.emit('load messages', messages);
    } catch (err) {
      console.error('이전 메시지 로드 실패:', err);
    }
  })();

  // 퇴장 알림
  socket.on('disconnect', () => {
    io.emit('system message', `${username}님이 채팅을 떠나셨습니다.`);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
