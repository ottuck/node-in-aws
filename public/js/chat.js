// public/js/chat.js

const socket = io();

// 사용자 정보 저장 변수
let currentUser = {
  username: '',
  profileImage: '',
};

// 사용자 정보 수신
socket.on('user info', (data) => {
  currentUser.username = data.username;
  currentUser.profileImage = data.profileImage;
});

// 메시지 전송
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

// 메시지 수신 및 표시
socket.on('chat message', (data) => {
  const item = document.createElement('li');
  item.innerHTML = `
    <img src="${data.profileImage}" alt="프로필 이미지" width="30" height="30" style="border-radius:50%; margin-right:10px;">
    <strong>${data.username}</strong>: ${data.message}
  `;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// 이전 메시지 로드 및 표시
socket.on('load messages', (msgs) => {
  msgs.forEach(msg => {
    const item = document.createElement('li');
    item.innerHTML = `
      <img src="${msg.profileImage}" alt="프로필 이미지" width="30" height="30" style="border-radius:50%; margin-right:10px;">
      <strong>${msg.username}</strong>: ${msg.message}
    `;
    messages.appendChild(item);
  });
  window.scrollTo(0, document.body.scrollHeight);
});
