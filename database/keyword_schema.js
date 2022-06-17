// 키워드 데이터베이스 스키마 정의
// 환자와 가족 개인 사이에서 주고받는 영상에서 추출한 키워드와 중요도 값을 저장하는 용도의 DB

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const keywordSchema = new Schema({
  keyword_id: {
    // 생성되면 자동으로 부여되는 키워드의 고유한 숫자
    type: Number,
    unique: true,
  },
  user_id: {
    // 해당 키워드와 연결된 가족 개인의 Id
    type: Schema.ObjectId,
    ref: 'User',
  },
  pat_id: {
    // 해당 키워드와 연결된 환자 개인의 Id
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  words: {
    // 문맥에서 추출한 중요 키워드
    type: [String],
  },
  rank: {
    // 문맥에서 추출한 중요 키워드에 대한 중요도 값
    type: [Number],
  },
});

keywordSchema.plugin(autoIncrement.plugin, {
  // keyword_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Keyword',
  field: 'keyword_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Keyword', keywordSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
