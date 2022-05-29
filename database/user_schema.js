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
  createdAt: {
    type: Date,
    default: new Date(),
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model('User', userSchema);
