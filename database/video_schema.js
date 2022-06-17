// 영상 데이터를 저장할 데이터베이스 스키마 정의
// 편지 보내기에 첨부한 영상에 대한 정보를 저장하는 용도의 DB

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const videoSchema = new Schema({
  video_id: {
    // 생성되면 자동으로 부여되는 영상의 고유한 숫자
    type: Number,
    unique: true,
  },
  video: {
    // 구글 클라우드 스토리지에 저장된 영상 파일의 경로 저장
    type: String,
    required: true,
  },
  post_id: {
    // 해당 영상을 첨부한 편지의 id 값
    // 편지를 보여줄 때 이어진 영상과 함께 보여줘야하기 때문에 스키마에 함께 저장한다.
    type: Number,
    required: true,
  },
});

videoSchema.plugin(autoIncrement.plugin, {
  // video_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Video',
  field: 'video_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Video', videoSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
