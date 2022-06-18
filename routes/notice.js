// 공지사항에 사용할 api 라우터 코드 파일
// 추후 개발 예정

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
