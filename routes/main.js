const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  res.send('로그인 페이지');
});

router.get('/findId', (req, res) => {
  res.send('아이디 찾기 페이지');
});

router.get('/findPwd', (req, res) => {
  res.send('비밀번호 찾기 페이지');
});

router.get('/modifyPwd', (req, res) => {
  res.send('비밀번호 변경 페이지');
});

module.exports = router;
