// public/js/chat.js

const socket = io();

// 현재 클라이언트의 사용자 정보
let currentUser = {
  id: '',
  username: '',
  profileImage: '',
};

// 사용자 식별자 초기화
function initUser() {
  // localStorage에서 사용자 ID 가져오기
  let storedUserId = localStorage.getItem('userId');

  if (!storedUserId) {
    // 사용자 ID가 없으면 새로 생성
    storedUserId = generateUniqueId();
    localStorage.setItem('userId', storedUserId);
  }

  currentUser.id = storedUserId;

  // 서버에 사용자 ID 전달하여 사용자 정보 요청
  socket.emit('request user info', { userId: currentUser.id });
}

// 고유한 사용자 ID 생성 함수
function generateUniqueId() {
  return 'user-' + Math.random().toString(36).substr(2, 16);
}

// 초기화 함수 호출
initUser();

// 사용자 정보 수신
socket.on('user info', (data) => {
  currentUser.username = data.username;
  currentUser.profileImage = data.profileImage;
  console.log('User info received:', currentUser);
});

const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const messagesContainer = document.getElementById('messages-container');  

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', {
      userId: currentUser.id,
      message: input.value,
    });
    input.value = '';
  }
});

// 메시지 렌더링 함수
function renderMessage(data) {
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
    // 본인이 보낸 메시지: 메시지 버블 뒤에 프로필 이미지
    item.appendChild(bubbleDiv);
    item.appendChild(profileDiv);
  } else {
    // 상대방이 보낸 메시지: 프로필 이미지 뒤에 메시지 버블
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
  msgs.forEach((msg) => {
    renderMessage(msg);
  });

  // 자동 스크롤: 메시지 로드 후 스크롤 맨 아래로 이동
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

  // 자동 스크롤
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
