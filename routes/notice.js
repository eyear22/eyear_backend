const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('공지사항 페이지');
});

router.get('/post', (req, res) => {
  res.send('공지사항 글 작성 페이지');
});

router.get('/:postid', (req, res) => {
  res.send('공지사항 글 상세 페이지');
});

module.exports = router;
