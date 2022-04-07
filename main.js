const express = require('express'); // express 임포트
const cors = require('cors');
const dbconnect = require('./models');
const mainRouter = require('./routes/main');
const joinRouter = require('./routes/join');
const userRouter = require('./routes/user');
const businessRouter = require('./routes/business');
const noticeRouter = require('./routes/notice');

const app = express(); // app생성
const port = 5000;
app.use(cors());

app.listen(port, () => console.log(`${port}포트입니다.`));
// 몽구스 연결
dbconnect();

app.use('/', mainRouter);
app.use('/join', joinRouter);
app.use('/user', userRouter);
app.use('/business', businessRouter);
app.use('/notice', noticeRouter);

app.use('/api/video', require('./routes/video'));
