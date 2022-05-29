// 개인(유저) 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
  uid: {
    type: String,
    unique: true,
    required: true,
  },
  pwd: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  pat_id: {
    type: [Schema.ObjectId],
    ref: 'Patient',
    required: true,
  }, // Array이기는 한데 여기 안에서 미리 배열을 만들어서 입력할건지?
  hos_id: {
    type: [Schema.ObjectId],
    ref: 'Hospital',
    required: true,
  }, // (이어서) 아니면 환자 정보를 입력할 때 만들어서 입력할건지?
  createdAt: {
    type: Date,
    default: new Date(),
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  relationship: {
    type: [String],
    required: true,
  }
});

module.exports = mongoose.model('User', userSchema);
