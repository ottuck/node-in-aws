const express = require('express');
const router = express.Router();

// 인증 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
}

// 채팅 페이지
router.get('/chat', isAuthenticated, (req, res) => {
  res.sendFile('chat.html', { root: './public' });
});

// 홈 페이지 리다이렉트
router.get('/', (req, res) => {
  res.redirect('/chat');
});

module.exports = router;
