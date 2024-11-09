const Redis = require('ioredis');

// Redis 클라이언트 생성 시 디버그 모드 활성화
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  showFriendlyErrorStack: true,
  retryStrategy: (times) => {
    console.log(`Redis 재연결 시도 ${times}번째...`);
    return Math.min(times * 50, 2000);
  }
});

// Redis 연결 상태 모니터링
redis.on('error', (err) => {
  console.error('Redis 연결 에러:', err);
});

redis.on('connect', () => {
  console.log('Redis 연결 성공');
});

redis.on('ready', () => {
  console.log('Redis 서버 연결 준비 완료!');
});

redis.on('close', () => {
  console.log('Redis 연결이 닫혔습니다.');
});

// Redis 키 접두사 설정
const KEYS = {
  USER_PREFIX: 'chat:user:',
  RECENT_MESSAGES: 'chat:recent_messages',
  ONLINE_USERS: 'chat:online_users',
};

// 사용자 정보 관리
const userManager = {
  async saveUser(userId, userInfo) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      const result = await redis.hmset(key, {
        ...userInfo,
        lastActive: new Date().toISOString(),
      });
      console.log('사용자 정보 저장 성공:', { userId, result });

      const expireResult = await redis.expire(key, 48 * 60 * 60);
      console.log('만료 시간 설정:', { userId, expireResult });

      // 저장 확인
      const savedUser = await this.getUser(userId);
      console.log('저장된 사용자 확인:', savedUser);
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
      throw error;
    }
  },

  async getUser(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      const user = await redis.hgetall(key);
      console.log('사용자 정보 조회:', { userId, user });
      return Object.keys(user).length ? user : null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  },

  async updateLastActive(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      await redis.hset(key, 'lastActive', new Date().toISOString());
      console.log('사용자 활동 시간 업데이트:', userId);
    } catch (error) {
      console.error('사용자 활동 시간 업데이트 실패:', error);
    }
  },

  async removeUser(userId) {
    const key = KEYS.USER_PREFIX + userId;
    try {
      const result = await redis.del(key);
      console.log('사용자 제거:', { userId, result });
    } catch (error) {
      console.error('사용자 제거 실패:', error);
    }
  },
};

// 최근 메시지 관리
const messageManager = {
  async addMessage(message) {
    try {
      const messageString = JSON.stringify(message);
      await redis.lpush(KEYS.RECENT_MESSAGES, messageString);
      console.log('새 메시지 저장:', {
        username: message.username,
        message: message.message,
        timestamp: new Date(message.timestamp).toLocaleString()
      });
      
      // 최근 100개 메시지만 유지
      const trimResult = await redis.ltrim(KEYS.RECENT_MESSAGES, 0, 99);

      // 저장된 메시지 확인
      const messages = await this.getRecentMessages(1);
      console.log('최근 저장된 메시지:', messages[0]);

    } catch (error) {
      console.error('메시지 저장 실패:', error);
    }
  },

  async getRecentMessages(limit = 100) {
    try {
      const messages = await redis.lrange(KEYS.RECENT_MESSAGES, 0, limit - 1);
      const parsedMessages = messages.map(msg => JSON.parse(msg));
      console.log(`최근 메시지 ${parsedMessages.length}개 조회됨`);
      return parsedMessages;
    } catch (error) {
      console.error('메시지 조회 실패:', error);
      return [];
    }
  },
};

// 온라인 사용자 수 관리
const onlineUsersManager = {
  async addOnlineUser(userId) {
    try {
      const result = await redis.sadd(KEYS.ONLINE_USERS, userId);
      const count = await this.getOnlineCount();
      console.log('온라인 사용자 추가:', { userId, result, totalCount: count });
    } catch (error) {
      console.error('온라인 사용자 추가 실패:', error);
    }
  },

  async removeOnlineUser(userId) {
    try {
      const result = await redis.srem(KEYS.ONLINE_USERS, userId);
      const count = await this.getOnlineCount();
      console.log('온라인 사용자 제거:', { userId, result, totalCount: count });
    } catch (error) {
      console.error('온라인 사용자 제거 실패:', error);
    }
  },

  async getOnlineCount() {
    try {
      const count = await redis.scard(KEYS.ONLINE_USERS);
      console.log('현재 온라인 사용자 수:', count);
      return count;
    } catch (error) {
      console.error('온라인 사용자 수 조회 실패:', error);
      return 0;
    }
  },
};

// Redis 연결 테스트 함수
const testRedisConnection = async () => {
  try {
    // 테스트 키-값 저장
    await redis.set('test:connection', 'OK');
    const value = await redis.get('test:connection');
    console.log('Redis 연결 테스트:', value);

    // 현재 모든 키 조회
    const keys = await redis.keys('chat:*');
    console.log('현재 저장된 키:', keys);

    // 테스트 키 삭제
    await redis.del('test:connection');
  } catch (error) {
    console.error('Redis 연결 테스트 실패:', error);
    throw error; // 에러를 상위로 전파
  }
};

// 서버 시작시 테스트 실행
testRedisConnection();

module.exports = {
  redis,
  userManager,
  messageManager,
  onlineUsersManager,
  testRedisConnection,  // 테스트 함수도 export
};