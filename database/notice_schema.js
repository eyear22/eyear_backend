// 공지사항 데이터베이스 스키마 정의 -> 추후 개발 예정

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const noticeSchema = new Schema({
  notice_id: {
    // 생성되면 자동으로 부여되는 공지사항 글의 고유한 숫자
    type: Number,
    unique: true,
  },
  title: {
    // 공지사항 제목
    type: String,
    required: true,
  },
  content: {
    // 공지사항 내용
    type: String,
    required: true,
  },
  createdAt: {
    // 공지사항 글 생성일자
    type: Date,
    default: new Date(), // 생성되는 순간의 Date 값으로 설정
  },
  hos_id: {
    // 연결된 병원의 고유 id
    type: Schema.ObjecId,
    ref: 'Hospital',
    required: false,
  },
});

noticeSchema.plugin(autoIncrement.plugin, {
  // notice_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Notice',
  field: 'notice_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Notice', noticeSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
