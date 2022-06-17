// 가족 개인(유저) 데이터베이스 스키마 정의

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;

const userSchema = new Schema({
  uid: {
    // 개인 로그인에 사용할 아이디
    type: String,
    unique: true, // 아이디는 고유한 값이여야 하기 때문에 unique 설정을 true로 설정
    required: true,
  },
  pwd: {
    // 개인 로그인에 사용할 비밀번호
    type: String,
    required: true,
  },
  username: {
    // 개인 이름
    type: String,
    required: true,
  },
  createdAt: {
    // 개인 데이터 생성일자
    type: Date,
    default: new Date(), // 생성되는 순간의 Date 값으로 설정
  },
  sex: {
    // 개인 성별
    type: String,
    required: true,
  },
  email: {
    // 개인 이메일 주소
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model('User', userSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
