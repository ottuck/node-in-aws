// controllers/chatController.js
import { userService } from '../services/userService.js';
import { messageService } from '../services/messageService.js';
import { generateRandomUsername, getRandomProfileImage } from '../utils/helpers.js';

export const handleConnection = async (socket, io) => {
  console.log('사용자 연결됨:', socket.id);

  const session = socket.request.session;

  if (!session.userId) {
    // 새로운 사용자
    const userId = 'user-' + Math.random().toString(36).substr(2, 16);
    const username = generateRandomUsername();
    const profileImage = getRandomProfileImage();

    session.userId = userId;
    session.username = username;
    session.profileImage = profileImage;
    session.save();

    await userService.saveUser(userId, {
      id: userId,
      username,
      profileImage,
      connectTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    socket.emit('user info', { id: userId, username, profileImage });
  } else {
    // 기존 사용자
    const userId = session.userId;
    const user = await userService.getUser(userId);
    if (user) {
      await userService.updateLastActive(userId);
      socket.emit('user info', { ...user });
    }
  }

  // 사용자를 'global' 방에 추가
  socket.join('global');

  // 온라인 사용자 수 업데이트
  updateOnlineUsers(io);

  // 시스템 메시지로 새로운 사용자 알림
  socket.broadcast.emit('system message', `${session.username}님이 채팅에 참여하셨습니다.`);

  // 최근 메시지 로드
  const recentMessages = await messageService.getRecentMessages();
  if (recentMessages.length > 0) {
    socket.emit('load messages', recentMessages);
  }

  // 메시지 이벤트 처리
  socket.on('chat message', async (msg) => {
    await handleChatMessage(socket, io, msg);
  });

  // 연결 해제 처리
  socket.on('disconnect', async () => {
    console.log('사용자 연결 해제됨:', socket.id);
    updateOnlineUsers(io);
    socket.broadcast.emit('system message', `${session.username}님이 퇴장하셨습니다.`);
  });
};

const updateOnlineUsers = (io) => {
  const onlineCount = io.sockets.adapter.rooms.get('global')?.size || 0;
  io.emit('online users update', onlineCount);
};

const handleChatMessage = async (socket, io, msg) => {
  try {
    const session = socket.request.session;
    if (!session || !session.userId) {
      console.log('세션이 존재하지 않습니다.');
      return; // 세션이 없으면 메시지 처리를 중단
    }
    const userId = session.userId;
    const user = await userService.getUser(userId);
    if (!user) {
      console.log('사용자 정보가 없습니다.');
      return;
    }
    if (user) {
      await userService.updateLastActive(userId);

      const messageData = {
        userId: user.id,
        username: user.username,
        message: msg.message,
        profileImage: user.profileImage,
        timestamp: new Date(),
      };

      // MongoDB에 메시지 저장
      await messageService.saveMessageToMongo(messageData);

      // Redis에 최근 메시지 저장
      await messageService.addMessageToRedis(messageData);

      // 모든 클라이언트에게 메시지 브로드캐스트
      io.emit('chat message', messageData);
    }
  } catch (error) {
    console.error('메시지 처리 중 에러:', error);
    socket.emit('error', '메시지 전송 중 오류가 발생했습니다.');
  }
};
