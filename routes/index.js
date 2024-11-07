// routes/index.js

const express = require('express');
const router = express.Router();

// 채팅 페이지
router.get('/', (req, res) => {
  res.sendFile('chat.html', { root: './public' });
});

module.exports = router;
