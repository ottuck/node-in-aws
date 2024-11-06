const socket = io();

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

// 메시지 수신
socket.on('chat message', (data) => {
  const item = document.createElement('li');
  item.textContent = `${data.user}: ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// 이전 메시지 로드
socket.on('load messages', (msgs) => {
  msgs.forEach(msg => {
    const item = document.createElement('li');
    item.textContent = `${msg.user}: ${msg.message}`;
    messages.appendChild(item);
  });
  window.scrollTo(0, document.body.scrollHeight);
});
