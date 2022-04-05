const express = require('express');
const router = express.Router();

router.get('/receive', (req, res) => {
  res.send('기관 받은 편지 확인 페이지');
});

router.get('/send', (req, res) => {
  res.send('기관 보낸 편지 확인 페이지');
});

router.get('/detail/:postid', (req, res) => {
  res.send('기관 편지 상세 페이지');
});

router.get('/post', (req, res) => {
  res.send('기관 편지 작성 페이지');
});

router.get('/manage', (req, res) => {
  res.send('기관 환자 관리 페이지');
});

module.exports = router;
