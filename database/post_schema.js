// 편지 데이터베이스 스키마 정의
// 환자와 가족 개인이 주고받는 영상 및 사진과 글을 통합하는 편지

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const postSchema = new Schema({
  post_id: {
    // 생성되면 자동으로 부여되는 편지 게시글의 고유한 숫자
    type: Number,
    unique: true,
  },
  title: {
    // 편지 게시글 제목
    type: String,
    required: true,
  },
  content: {
    // 편지 게시글 글
    type: String,
    required: true,
  },
  createdAt: {
    // 편지 게시글 생성일자
    type: Date,
    default: new Date(), // 생성되는 순간의 Date 값으로 설정
  },
  from: {
    // 편지를 보내는 사람의 Id
    type: Schema.ObjectId,
    required: true,
  },
  to: {
    // 편지를 받는 사람의 Id
    type: Schema.ObjectId,
    required: true,
  },
  check: {
    // 받은 사람이 해당 편지를 확인하였는지에 대한 여부를 체크하기 위한 칼럼
    type: Boolean,
    required: true,
  },
});

postSchema.plugin(autoIncrement.plugin, {
  // post_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Post',
  field: 'post_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Post', postSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
