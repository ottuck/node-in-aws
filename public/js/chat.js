// public/js/chat.js

// Socket.IO 클라이언트 초기화
const socket = io();

// 현재 클라이언트의 사용자 정보
let currentUser = {
  id: '',
  username: '',
  profileImage: '',
};

// 온라인 사용자 수 업데이트 함수
function updateOnlineCount(count) {
  const onlineCountElement = document.getElementById('online-count');
  if (onlineCountElement) {
    onlineCountElement.textContent = `접속자 수: ${count}`;
  }
}

// 사용자 정보 수신
socket.on('user info', (data) => {
  currentUser.id = data.id;
  currentUser.username = data.username;
  currentUser.profileImage = data.profileImage;

  console.log('User info received:', currentUser);
});

// 온라인 사용자 수 업데이트 이벤트 처리
socket.on('online users update', (count) => {
  updateOnlineCount(count);
});

// 메시지 렌더링 함수
function renderMessage(data) {
  const messages = document.getElementById('messages');

  const item = document.createElement('li');

  // 메시지 종류 결정
  const isSent = data.userId === currentUser.id;
  const messageType = isSent ? 'sent' : 'received';

  item.classList.add('message', messageType);

  // 프로필 이미지 추가
  const profileDiv = document.createElement('div');
  profileDiv.classList.add('profile');
  const img = document.createElement('img');
  img.src = data.profileImage || '/images/default-profile.png';
  img.alt = '프로필 이미지';
  profileDiv.appendChild(img);

  // 메시지 내용 및 시간 추가
  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  bubbleDiv.textContent = data.message;

  // 시간 표시
  const timestampSpan = document.createElement('span');
  timestampSpan.classList.add('timestamp');
  const time = new Date(data.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  timestampSpan.textContent = time;

  bubbleDiv.appendChild(timestampSpan);

  // 요소 조합
  if (isSent) {
    item.appendChild(bubbleDiv);
    item.appendChild(profileDiv);
  } else {
    item.appendChild(profileDiv);
    item.appendChild(bubbleDiv);
  }

  messages.appendChild(item);

  // 자동 스크롤
  item.scrollIntoView({ behavior: 'smooth' });
}

// 메시지 수신 및 표시
socket.on('chat message', (data) => {
  renderMessage(data);
});

// 이전 메시지 로드 및 표시
socket.on('load messages', (msgs) => {
  const messagesContainer = document.getElementById('messages-container');

  msgs.reverse().forEach((msg) => {
    renderMessage(msg);
  });

  // 자동 스크롤
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// 시스템 메시지 수신 및 표시
socket.on('system message', (msg) => {
  const messages = document.getElementById('messages');

  const item = document.createElement('li');
  item.classList.add('message', 'system');

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble', 'system');
  bubbleDiv.textContent = msg;

  item.appendChild(bubbleDiv);
  messages.appendChild(item);

  // 자동 스크롤
  item.scrollIntoView({ behavior: 'smooth' });
});

// 에러 메시지 처리
socket.on('error', (error) => {
  console.error('Socket error:', error);
  const messages = document.getElementById('messages');

  const item = document.createElement('li');
  item.classList.add('message', 'system');

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble', 'system');
  bubbleDiv.textContent = `Error: ${error}`;

  item.appendChild(bubbleDiv);
  messages.appendChild(item);

  // 자동 스크롤
  item.scrollIntoView({ behavior: 'smooth' });
});

// 서버와의 연결이 끊어졌을 때 처리
socket.on('disconnect', () => {
  console.log('서버와 연결이 끊어졌습니다.');
  const messages = document.getElementById('messages');

  const item = document.createElement('li');
  item.classList.add('message', 'system');

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble', 'system');
  bubbleDiv.textContent = '서버와 연결이 끊어졌습니다. 페이지를 새로고침하세요.';

  item.appendChild(bubbleDiv);
  messages.appendChild(item);

  // 자동 스크롤
  item.scrollIntoView({ behavior: 'smooth' });
});

// 채팅 입력 폼 처리
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat message', {
      message: input.value,
    });
    input.value = '';
  }
});
