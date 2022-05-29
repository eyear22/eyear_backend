// 자막 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const autoIncrement = require('mongoose-auto-increment');

const { Schema } = mongoose;
autoIncrement.initialize(mongoose.connection);

const textSchema = new Schema({
  text_id: {
    type: Number,
    unique: true,
  },
  text: {
    type: String,
    required: true,
  },
  vid: {
    type: Number,
    required: true,
  },
});

// AutoIncrease를 실현시키기 위해서 사용하는 코드
textSchema.plugin(autoIncrement.plugin, {
  model: 'Text',
  field: 'text_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Text', textSchema);
