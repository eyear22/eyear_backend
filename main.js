const express = require('express'); // express 임포트
const dbconnect = require('./models');
const app = express(); // app생성
const port = 5000;

app.listen(port, () => console.log(`${port}포트입니다.`));
// 몽구스 연결
dbconnect();
