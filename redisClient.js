// redisClient.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis 설정
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

class RedisClient {
  constructor() {
    this.client = new Redis(REDIS_CONFIG);
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.client.on('error', (err) => {
      console.error('Redis 연결 에러:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis 연결 시도 중...');
    });

    this.client.on('ready', () => {
      console.log('Redis 서버 연결 준비 완료!');
    });

    this.client.on('end', () => {
      console.log('Redis 연결 종료됨.');
    });
  }

  getClient() {
    return this.client;
  }
}

const redisClient = new RedisClient();

// 키 및 만료 시간 설정
const KEYS = {
  USER_PREFIX: 'chat:user:',
  RECENT_MESSAGES: 'chat:recent_messages',
};

const EXPIRE_TIMES = {
  USER_DATA: 48 * 60 * 60, // 48시간
  RECENT_MESSAGES_LIMIT: 100, // 최근 100개 메시지 유지
};

// 사용자 정보 관리 클래스
class UserManager {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async saveUser(userId, userInfo) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      await this.redis.hset(key, {
        ...userInfo,
        lastActive: new Date().toISOString(),
      });
      await this.redis.expire(key, EXPIRE_TIMES.USER_DATA);
      console.log('사용자 정보 저장 완료:', userId);
      return await this.getUser(userId);
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
      throw error;
    }
  }

  async getUser(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      const user = await this.redis.hgetall(key);
      return Object.keys(user).length ? user : null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  }

  async updateLastActive(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      await this.redis.hset(key, 'lastActive', new Date().toISOString());
      await this.redis.expire(key, EXPIRE_TIMES.USER_DATA);
      console.log('사용자 활동 시간 업데이트:', userId);
    } catch (error) {
      console.error('사용자 활동 시간 업데이트 실패:', error);
    }
  }

  async removeUser(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      await this.redis.del(key);
      console.log('사용자 제거:', userId);
    } catch (error) {
      console.error('사용자 제거 실패:', error);
    }
  }
}

// 메시지 관리 클래스
class MessageManager {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async addMessage(message) {
    try {
      if (!message || !message.message) {
        throw new Error('Invalid message data');
      }

      const messageString = JSON.stringify(message);
      await this.redis.lpush(KEYS.RECENT_MESSAGES, messageString);
      await this.redis.ltrim(KEYS.RECENT_MESSAGES, 0, EXPIRE_TIMES.RECENT_MESSAGES_LIMIT - 1);
      console.log('새 메시지 저장 완료');
      return message;
    } catch (error) {
      console.error('메시지 저장 실패:', error);
      throw error;
    }
  }

  async getRecentMessages(limit = EXPIRE_TIMES.RECENT_MESSAGES_LIMIT) {
    try {
      const messages = await this.redis.lrange(KEYS.RECENT_MESSAGES, 0, limit - 1);
      const parsedMessages = messages.map((msg) => JSON.parse(msg));
      console.log(`최근 메시지 ${parsedMessages.length}개 조회됨`);
      return parsedMessages;
    } catch (error) {
      console.error('메시지 조회 실패:', error);
      return [];
    }
  }
}

// 매니저 인스턴스 생성
const userManager = new UserManager(redisClient.getClient());
const messageManager = new MessageManager(redisClient.getClient());

export {
  redisClient,
  userManager,
  messageManager,
};
