// 추가적인 기능인 실시간 화상 통화 기능을 위한 코드
// 추후 개발 예정
const express = require('express');
const router = express.Router();
const path = require('path');
const url = require('url');

const rooms = [];

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'init.html'));
});

router.get('/room', (req, res) => {
  const queryData = url.parse(req.url, true).query;
  const business = queryData.business;

  if (business == 1) {
    //병원에서 방을 만들었을 경우
    console.log('기업 방 만들기');
    rooms.push(queryData.roomID);
    res.sendFile(path.join(__dirname, '..', 'call.html'));
  } else if (business == 0) {
    // 보호자가 링크를 통해 접속할 경우
    console.log(rooms);
    if (rooms.includes(queryData.roomID)) {
      console.log('보호자 방 참여');
      res.sendFile(path.join(__dirname, '..', 'call.html'));
    } else {
      res.send('방이 존재하지 않습니다.');
    }
  }
});

module.exports = router;
