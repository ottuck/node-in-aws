const express = require('express');
const app = express();
const homeRoute = require('./routes/homeRoute');
const PORT = 3000;

// 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', './views');

// 라우트 설정
app.use('/', homeRoute);

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
