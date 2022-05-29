// 공지사항 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const noticeSchema = new Schema({
  notice_id: {
    type: Number,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  hos_id: {
    type: String,
    required: false,
  },
});

// AutoIncrease를 실현시키기 위해서 사용하는 코드
noticeSchema.plugin(autoIncrement.plugin, {
  model: 'Notice',
  field: 'notice_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Notice', noticeSchema);
