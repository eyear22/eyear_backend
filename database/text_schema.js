// 영상 자막 데이터베이스 스키마 정의
// 보낸 영상에서 추출된 자막 정보를 저장하는 용도의 DB

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment'); // DB 데이터가 추가될 때마다 자동으로 숫자를 부여하기 위해 mongoose에서 제공하는 number auto increment를 가져온다

autoIncrement.initialize(mongoose.connection); // autoIncrement 사용을 위해 초기화

const textSchema = new Schema({
  text_id: {
    // 생성되면 자동으로 부여되는 자막의 고유한 숫자
    type: Number,
    unique: true,
  },
  text: {
    // 구글 클라우드 스토리지에 저장된 이미지 파일의 경로 저장
    type: String,
    required: true,
  },
  vid: {
    // 자막과 연결된 비디오 데이터의 고유 Id
    type: Number,
    required: true,
  },
});

textSchema.plugin(autoIncrement.plugin, {
  // text_id에 대해 자동으로 숫자 카운트를 해주기 위해 사용
  model: 'Text',
  field: 'text_id',
  startAt: 1, // 시작 숫자는 1로 설정
  increment: 1, // 1씩 증가하도록 설정
});

module.exports = mongoose.model('Text', textSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
