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

// 메시지 수신 및 표시
socket.on('chat message', (data) => {
  const item = document.createElement('li');
  
  // 메시지 종류 결정
  const isSent = data.username === currentUser.username;
  const messageType = isSent ? 'sent' : 'received';
  
  item.classList.add('message', messageType);
  
  if (!isSent) {
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile');
    const img = document.createElement('img');
    img.src = data.profileImage;
    img.alt = '프로필 이미지';
    profileDiv.appendChild(img);
    item.appendChild(profileDiv);
  }
  
  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  bubbleDiv.textContent = data.message;
  
  const timestampSpan = document.createElement('span');
  timestampSpan.classList.add('timestamp');
  const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timestampSpan.textContent = time;
  
  bubbleDiv.appendChild(timestampSpan);
  
  item.appendChild(bubbleDiv);
  messages.appendChild(item);
  
  // 자동 스크롤
  messages.scrollTop = messages.scrollHeight;
});

// 이전 메시지 로드 및 표시
socket.on('load messages', (msgs) => {
  msgs.forEach(msg => {
    const item = document.createElement('li');
    
    // 메시지 종류 결정 (sent or received)
    const isSent = msg.username === '익명유저1'; // 임시 로직, 실제로는 사용자 식별 방법 필요
    const messageType = isSent ? 'sent' : 'received';
    
    item.classList.add('message', messageType);
    
    const profileDiv = document.createElement('div');
    profileDiv.classList.add('profile');
    const img = document.createElement('img');
    img.src = msg.profileImage;
    img.alt = '프로필 이미지';
    profileDiv.appendChild(img);
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.textContent = msg.message;
    
    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestampSpan.textContent = time;
    
    bubbleDiv.appendChild(timestampSpan);
    
    item.appendChild(profileDiv);
    item.appendChild(bubbleDiv);
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
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
  messages.scrollTop = messages.scrollHeight;
});
