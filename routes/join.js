const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('회원가입 처음 페이지');
});

router.get('/user', (req, res) => {
  res.send('개인 회원가입 페이지');
});

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

module.exports = router;
