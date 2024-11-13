// app.js
import express from 'express';
import http from 'http';
import { sessionMiddleware } from './config/sessionConfig.js';
import { configureSocket } from './config/socketConfig.js';
import { chatRouter } from './routes/chatRoutes.js';

const app = express();
const server = http.createServer(app);

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static('public'));

// 라우트 설정
app.use('/', chatRouter);

// Socket.IO 설정
const io = configureSocket(server, sessionMiddleware);

// 전역적으로 io 객체 사용 가능하도록 설정
app.set('io', io);

export { app, server };