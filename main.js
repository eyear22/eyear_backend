const express = require('express'); // express 임포트
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const { Server } = require('socket.io');
const dbconnect = require('./models');
const mainRouter = require('./routes/main');
const joinRouter = require('./routes/join');
const userRouter = require('./routes/user');
const businessRouter = require('./routes/business');
const noticeRouter = require('./routes/notice');
const videoRouter = require('./routes/video');
const callRouter = require('./routes/call');
const loginRouter = require('./routes/login');
const askRouter = require('./routes/ask');
const passportConfig = require('./passport');

const app = express(); // app생성
const port = 5000;

passportConfig();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', mainRouter);
app.use('/join', joinRouter);
app.use('/login', loginRouter);
app.use('/user', userRouter);
app.use('/business', businessRouter);
app.use('/notice', noticeRouter);

app.use('/video', videoRouter);
app.use('/call', callRouter);
app.use('/ask', askRouter);

// 프론트에서 uploads 폴더 접근 가능하게함
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
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
