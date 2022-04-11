const express = require('express'); // express 임포트
const cors = require('cors');
const bodyParser = require('body-parser');

const dbconnect = require('./models');
const mainRouter = require('./routes/main');
const joinRouter = require('./routes/join');
const userRouter = require('./routes/user');
const businessRouter = require('./routes/business');
const noticeRouter = require('./routes/notice');
const videoRouter = require('./routes/video');

const app = express(); // app생성
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// DB 연결
app.listen(port, () => console.log(`${port}포트입니다.`));
// 몽구스 연결
dbconnect();

app.get('/', () => {
  console.log('Get / 요청시에만 실행됩니다.');
});

app.use('/', mainRouter);
app.use('/join', joinRouter);
app.use('/user', userRouter);
app.use('/business', businessRouter);
app.use('/notice', noticeRouter);
app.use('/video', videoRouter);
