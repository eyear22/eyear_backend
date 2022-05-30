// 관계 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;

const relationshipSchema = new Schema({
  pat_id: {
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  hos_id: {
    type: Schema.ObjectId,
    ref: 'Hospital',
  },
  user_id: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  relation: {
    // 환자 입장에서 개인
    type: String,
  },
});

module.exports = mongoose.model('Relationship', relationshipSchema);
