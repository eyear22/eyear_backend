// 병원 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;

const hospitalSchema = new Schema({
  hid: {
    type: String,
    unique: true,
    required: true,
  },
  pwd: {
    type: String,
    required: true,
  },
  hos_name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  hos_number: {
    // 전화번호
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = mongoose.model('Hospital', hospitalSchema);
