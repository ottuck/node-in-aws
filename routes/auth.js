const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 회원 가입 페이지
router.get('/signup', (req, res) => {
  res.sendFile('signup.html', { root: './public' });
});

// 회원 가입 처리
router.post('/signup', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/chat');
  } catch(err) {
    res.status(500).send('회원 가입 실패');
  }
});

// 로그인 페이지
router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './public' });
});

// 로그인 처리
router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('사용자를 찾을 수 없습니다.');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }
    req.session.userId = user._id;
    res.redirect('/chat');
  } catch(err) {
    res.status(500).send('로그인 실패');
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('로그아웃 실패');
    }
    res.redirect('/login');
  });
});

module.exports = router;
