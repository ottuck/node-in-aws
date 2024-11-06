const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Redis 클라이언트 설정
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 연결 성공'))
.catch(err => console.log('MongoDB 연결 실패:', err));

// 세션 미들웨어 설정
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);

// Socket.IO에 세션 미들웨어 통합
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// 정적 파일 제공
app.use(express.static('public'));

// 라우트 설정
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');

app.use('/auth', authRoutes);
app.use('/', indexRoutes);

// Socket.IO 이벤트 처리
const Message = require('./models/Message');
const User = require('./models/User');

io.on('connection', (socket) => {
  const session = socket.request.session;
  if (!session.userId) {
    return;
  }

  socket.on('chat message', async (msg) => {
    const user = await User.findById(session.userId);
    const message = new Message({
      user: user.username,
      message: msg,
      timestamp: new Date(),
    });
    await message.save();
    io.emit('chat message', { user: user.username, message: msg });
  });

  // 이전 메시지 로드
  Message.find().sort({ timestamp: 1 }).limit(100).exec((err, messages) => {
    if (!err) {
      socket.emit('load messages', messages);
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
