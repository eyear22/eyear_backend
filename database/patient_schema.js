// 환자 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose; // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const patientSchema = new Schema({
  pat_number: {
    // 환자 인증번호
    // 환자 개인을 인증할 수 있는 환자의 고유 식별 번호
    type: String,
    unique: true, // 환자 개인을 식별하는 용도로 사용하기 때문에 unique를 true로 설정
    required: true,
  },
  pat_name: {
    // 환자 이름
    type: String,
    required: true,
  },
  sex: {
    // 환자 성별
    type: String,
    required: true,
  },
  birth: {
    // 환자 생년월일
    type: Date,
    required: true,
  },
  hos_id: {
    // 환자가 속해있는 병원의 Id
    type: Schema.ObjectId,
    ref: 'Hospital',
  },
});

module.exports = mongoose.model('Patient', patientSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
