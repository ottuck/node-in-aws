const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// '/' 경로로 들어오는 요청을 homeController의 home 메서드로 처리
router.get('/', homeController.home);

module.exports = router;
