const express = require('express'); // 서버 구축에 사용할 Node.js에서 제공하는 express 프레임워크
const cors = require('cors'); // 리소스가 안전한지 검사하는 cors
const bodyParser = require('body-parser'); // request의 body 부분을 파싱하기 위한 모듈
const cookieParser = require('cookie-parser'); // 사용자 정보 쿠키에 사용되는 모듈
const path = require('path'); // 경로를 설정할 때 사용하는 모듈
const session = require('express-session'); // 세션 정의에 사용되는 모듈

const passport = require('passport'); // 로그인 및 회원가입 구현에 사용되는 모듈
const dbconnect = require('./models'); // 몽고디비 데이터베이스 연결에 사용
const mainRouter = require('./routes/main'); // 개인과 병원 공통 라우터
const joinRouter = require('./routes/join'); // 회원가입 라우터
const userRouter = require('./routes/user'); // 개인 회원 동작을 제어하는 라우터
const businessRouter = require('./routes/business'); // 병원 회원 동작을 제어하는 라우터
const noticeRouter = require('./routes/notice'); // 공지사항 라우터 ->  추후 개발 예정
const videoRouter = require('./routes/video'); // 비디오 관련 작업을 제어하는 라우터
const callRouter = require('./routes/call'); // 실시간 화상 통화 작업을 제어하는 라우터 ->  추후 개발 예정
const loginRouter = require('./routes/login'); // 로그인 라우터
const passportConfig = require('./passport'); // 로그인 및 회원가입을 제어하는 Passport 라우터

const app = express(); // express app 생성
const port = 5000; // 사용할 포트번호 설정

passportConfig();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // 인코딩 설정
app.use(cors());
app.use(cookieParser(process.env.COOKIE_SECRET)); // 쿠키 사용을 위한 설정
app.use(
  // 세션 설정
  session({
    resave: false, // 요청이 올 때마다 아무 변경이 없어도 다시 저장할 것인가에 대한 설정 -> 저장하지 않도록 설정함
    saveUninitialized: false, // 서버 스토리지를 아끼기 위해 데이터 없는 세션은 저장하지 않는다.
    secret: process.env.COOKIE_SECRET,
    cookie: {
      // 쿠키 생성 옵션
      // 보안 설정 (배포 시에는 true로 변경)
      httpOnly: true,
      secure: false,
    },
  })
);

app.use(passport.initialize()); // 로그인 및 회원가입에 사용할 passport 초기화
app.use(passport.session()); // 세션 정보를 회원 구분에 사용

app.get('/', () => {
  console.log('Get / 요청시에만 실행됩니다.');
});

// 각 url에 들어온 요청을 어떤 라우터에서 처리할지 설정해주는 코드
app.use('/', mainRouter);
app.use('/join', joinRouter);
app.use('/login', loginRouter);
app.use('/user', userRouter);
app.use('/business', businessRouter);
app.use('/notice', noticeRouter);

app.use('/video', videoRouter);
app.use('/call', callRouter);

// 프론트에서 uploads 폴더 접근 가능하게함
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 실시간 화상 통화를 위한 socket 연결 코드 -> 추후 개발 예정
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    console.log('join_room:', roomId);
    socket.join(roomId);
    socket.to(roomId).emit('welcome');
  });

  socket.on('offer', (offer, roomId) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice', (ice, roomId) => {
    socket.to(roomId).emit('ice', ice);
  });
});

// DB 연결
server.listen(port, () => console.log(`${port}포트입니다.`));
// 몽구스 연결

dbconnect();
