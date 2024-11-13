// config/redisConfig.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('error', (err) => {
  console.error('Redis 연결 에러:', err);
});

redisClient.on('connect', () => {
  console.log('Redis 연결 시도 중...');
});

redisClient.on('ready', () => {
  console.log('Redis 서버 연결 준비 완료!');
});

redisClient.on('end', () => {
  console.log('Redis 연결 종료됨.');
});
