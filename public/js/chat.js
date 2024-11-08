// public/js/chat.js

const socket = io();

// 현재 클라이언트의 사용자 정보
let currentUser = {
  username: '',
  profileImage: '',
};

// 사용자 정보 수신
socket.on('user info', (data) => {
  currentUser.username = data.username;
  currentUser.profileImage = data.profileImage;
  console.log('User info received:', currentUser);
});

// 메시지 전송
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const messagesContainer = document.getElementById('messages-container');  

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

// 메시지 수신 및 표시
socket.on('chat message', (data) => {
  if (!currentUser.username) {
    console.warn('User info not received yet.');
    return;
  }

  const item = document.createElement('li');

  // 메시지 종류 결정
  const isSent = data.username === currentUser.username;
  const messageType = isSent ? 'sent' : 'received';

  item.classList.add('message', messageType);

  // 프로필 이미지
  if (!isSent) {
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile');
    const img = document.createElement('img');
    img.src = data.profileImage;
    img.alt = '프로필 이미지';
    profileDiv.appendChild(img);
    item.appendChild(profileDiv);
  }

  // 메시지 내용 및 시간
  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  bubbleDiv.textContent = data.message;

  // 시간 표시
  const timestampSpan = document.createElement('span');
  timestampSpan.classList.add('timestamp');
  const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timestampSpan.textContent = time;

  bubbleDiv.appendChild(timestampSpan);

  item.appendChild(bubbleDiv);
  messages.appendChild(item);

  // 자동 스크롤: messages-container에 scrollTop 설정
  item.scrollIntoView({ behavior: 'smooth' });
});

// 이전 메시지 로드 및 표시
socket.on('load messages', (msgs) => {
  if (!currentUser.username) {
    console.warn('User info not received yet.');
    return;
  }

  msgs.forEach(msg => {
    const item = document.createElement('li');

    // 메시지 종류 결정
    const isSent = msg.username === currentUser.username;
    const messageType = isSent ? 'sent' : 'received';

    item.classList.add('message', messageType);

    // 프로필 이미지
    if (!isSent) {
      const profileDiv = document.createElement('div');
      profileDiv.classList.add('profile');
      const img = document.createElement('img');
      img.src = msg.profileImage;
      img.alt = '프로필 이미지';
      profileDiv.appendChild(img);
      item.appendChild(profileDiv);
    }

    // 메시지 내용 및 시간
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = msg.message;

    // 시간 표시
    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestampSpan.textContent = time;

    bubbleDiv.appendChild(timestampSpan);

    item.appendChild(bubbleDiv);
    messages.appendChild(item);
  });

  // 자동 스크롤: messages-container에 scrollTop 설정
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// 시스템 메시지 수신 및 표시
socket.on('system message', (msg) => {
  const item = document.createElement('li');
  item.classList.add('message', 'system');

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble', 'system');
  bubbleDiv.textContent = msg;

  item.appendChild(bubbleDiv);
  messages.appendChild(item);

  // 자동 스크롤: messages-container에 scrollTop 설정
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
