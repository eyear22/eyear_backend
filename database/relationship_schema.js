// 연결 관계 데이터베이스 스키마 정의
// 환자, 가족, 병원간의 연결 관계를 표현하기 위해 사용하는 DB

const mongoose = require('mongoose'); // mongoose 가져오기
// mongoose: mongoDB와 express 웹 애플리케이션 프레임워크 간의 연결을 생성하는 javaScript 객체 지향 프로그래밍 라이브러리

const { Schema } = mongoose;

const relationshipSchema = new Schema({
  pat_id: {
    // 관계에 있는 환자의 고유 Id
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  hos_id: {
    // 관계에 있는 환자가 속한 병원의 고유 Id
    type: Schema.ObjectId,
    ref: 'Hospital',
  },
  user_id: {
    // 관계에 있는 가족 개인의 고유 Id
    type: Schema.ObjectId,
    ref: 'User',
  },
  relation: {
    // 환자 입장에서 개인이 어떤 관계인지를 표현하는 컬럼 (예. 딸/아들/손자/손녀)
    type: String,
  },
});

module.exports = mongoose.model('Relationship', relationshipSchema); // 외부에서 해당 스키마를 사용할 수 있도록 설정
