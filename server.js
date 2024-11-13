// server.js
import { app, server } from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
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
