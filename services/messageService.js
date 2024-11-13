// services/messageService.js
import { redisClient } from '../config/redisConfig.js';
import Message from '../models/Message.js';

const KEYS = {
  RECENT_MESSAGES: 'chat:recent_messages',
};

const EXPIRE_TIMES = {
  RECENT_MESSAGES_LIMIT: 100, // 최근 100개 메시지 유지
};

class MessageService {
  constructor(redis) {
    this.redis = redis;
  }

  async addMessageToRedis(message) {
    const messageString = JSON.stringify(message);
    await this.redis.lpush(KEYS.RECENT_MESSAGES, messageString);
    await this.redis.ltrim(KEYS.RECENT_MESSAGES, 0, EXPIRE_TIMES.RECENT_MESSAGES_LIMIT - 1);
  }

  async getRecentMessages(limit = EXPIRE_TIMES.RECENT_MESSAGES_LIMIT) {
    const messages = await this.redis.lrange(KEYS.RECENT_MESSAGES, 0, limit - 1);
    return messages.map((msg) => JSON.parse(msg));
  }

  async saveMessageToMongo(messageData) {
    const message = new Message(messageData);
    await message.save();
    return message;
  }
}

export const messageService = new MessageService(redisClient);
