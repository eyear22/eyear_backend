// 명사 키워드 데이터베이스 스키마 정의
// 가족 개인이 회원가입을 진행했을 때 이름 데이터를 가공하여 저장하는 용도의 DB

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const commonwordSchema = new Schema({
  word_id: {
    // 생성되면 자동으로 부여되는 숫자
    type: Number,
    unique: true,
  },
  pat_id: {
    // 환자의 고유한 아이디 (어떤 환자의 가족 이름 데이터인지 구분을 위해 사용한다)
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  words: {
    // 이름 데이터를 활용한 키워드 값을 배열로 저장한다
    type: [String],
  },
});

commonwordSchema.plugin(autoIncrement.plugin, {
  // word_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Commonword',
  field: 'word_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Commonword', commonwordSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
