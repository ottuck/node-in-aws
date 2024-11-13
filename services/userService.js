// services/userService.js
import { redisClient } from '../config/redisConfig.js';

const KEYS = {
  USER_PREFIX: 'chat:user:',
};

const EXPIRE_TIMES = {
  USER_DATA: 48 * 60 * 60, // 48시간
};

class UserService {
  constructor(redis) {
    this.redis = redis;
  }

  async saveUser(userId, userInfo) {
    const key = KEYS.USER_PREFIX + userId;
    await this.redis.hset(key, {
      ...userInfo,
      lastActive: new Date().toISOString(),
    });
    await this.redis.expire(key, EXPIRE_TIMES.USER_DATA);
    return await this.getUser(userId);
  }

  async getUser(userId) {
    const key = KEYS.USER_PREFIX + userId;
    const user = await this.redis.hgetall(key);
    return Object.keys(user).length ? user : null;
  }

  async updateLastActive(userId) {
    const key = KEYS.USER_PREFIX + userId;
    await this.redis.hset(key, 'lastActive', new Date().toISOString());
    await this.redis.expire(key, EXPIRE_TIMES.USER_DATA);
  }
}

export const userService = new UserService(redisClient);
