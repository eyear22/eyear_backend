const express = require('express'); // express 임포트
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const dbconnect = require('./models');
const mainRouter = require('./routes/main');
const joinRouter = require('./routes/join');
const userRouter = require('./routes/user');
const businessRouter = require('./routes/business');
const noticeRouter = require('./routes/notice');
const videoRouter = require('./routes/video');
const callRouter = require('./routes/call');

const app = express(); // app생성
const port = 5000;

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.get('/', () => {
  console.log('Get / 요청시에만 실행됩니다.');
});

app.use('/', mainRouter);
app.use('/join', joinRouter);
app.use('/user', userRouter);
app.use('/business', businessRouter);
app.use('/notice', noticeRouter);

app.use('/video', videoRouter);
app.use('/call', callRouter);

// 프론트에서 uploads 폴더 접근 가능하게함
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

const ObjectId = require('mongodb').ObjectId;
const { spawn } = require('child_process');
const Keyword = require('./database/keyword_schema');

function extract(text, user_id, pat_id) {
  let resultWords = [];
  let resultRanks = [];
  const cutRatio = 0.5;
  const updateRatio = 0.9;
  const result = spawn('python', ['extract.py', text]);
  result.stdout.on('data', (data) => {
    let keywords = data.toString('utf8');
    keywords = keywords.slice(1, -3);

    const regExp = /\(([^)]+)\)/;
    const keywordsArray = keywords.split(regExp);

    let i = 0;
    keywordsArray.forEach((value, index) => {
      if (index % 2 === 1) {
        const temp = value.split(', ');
        if (Number(temp[1]) > cutRatio) {
          // 일정 비율 이하 키워드는 저장하지 않음
          resultWords[i] = temp[0].slice(1, -1);
          resultRanks[i] = Number(temp[1]);
          i += 1;
        }
      }
    });
  });

  result.on('close', async (code) => {
    if (code === 0) {
      console.log('extract success');
      try {
        // 업데이트 키워드 찾기
        const preKeyword = await Keyword.findOne({
          user_id: new ObjectId(user_id),
          pat_id: new ObjectId(pat_id),
        });

        if (preKeyword === null) {
          // 첫번째 키워드일 때
          console.log('keyword create');
          const newKeywords = await Keyword.create({
            user_id: new ObjectId(user_id),
            pat_id: new ObjectId(pat_id),
            words: resultWords,
            rank: resultRanks,
          });
          return;
        }

        let preRank = preKeyword.rank;
        preRank.forEach((value, index) => {
          preRank[index] = value * updateRatio;
        });

        const updateRanks = preRank.concat(resultRanks);
        updateRanks.sort((a, b) => b - a); // 내림차순 정렬

        const updateWords = [];
        updateRanks.forEach((value1, index1) => {
          if (value1 - cutRatio > 0) {
            preRank.forEach((value2, index2) => {
              if (value1 === value2) {
                updateWords[index1] = preKeyword.words[index2];
              }
            });

            resultRanks.forEach((value3, index3) => {
              if (value1 === value3) {
                updateWords[index1] = resultWords[index3];
              }
            });
          }
        });

        try {
          const finish = await Keyword.updateOne(
            {
              user_id: new ObjectId(user_id),
              pat_id: new ObjectId(pat_id),
            },
            { words: updateWords, rank: updateRanks }
          );
          console.log('keyword update success');
          return finish;
        } catch (err) {
          return err;
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('프로세스 종료:', code);
    }
  });
}
