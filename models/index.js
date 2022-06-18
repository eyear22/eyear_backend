// 몽고디비 데이터베이스와 프로젝트의 연결을 위한 코드
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // 각 환경변수를 .env 확장자를 가진 파일에 저장해 두고 서버가 구동될 때 이 파일을 읽어 해당 값을 환경변수로 설정해 주는 역할의 라이브러리
// 데이터베이스의 중요 내용에 대한 내용은 .env 파일에 보관해두고 변수명으로 가져와서 쓰기 위해 dotenv 모듈을 사용한다.

dotenv.config();

const dbconnect = () => {
  mongoose
    .connect(
      // mongoose 연결 코드
      `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:27017/admin`,
      // .env 파일에 있는 환경 변수들을 가져와서 연결을 시도한다.
      {
        dbName: 'eyear', // 데이터베이스 이름
        // useNewUrlPaser: true,
        // useUnifiedTofology: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
      }
    )
    .then(() => console.log('MongoDB connected')) // 데이터베이스 연결 성공
    .catch((err) => {
      console.log('DB 연결 실패');
      console.log(err);
    });
};

module.exports = dbconnect;
