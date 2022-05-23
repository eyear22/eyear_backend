// 키워드 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const keywordSchema = new Schema({
  keyword_id: {
    type: Number,
    unique: true,
  },
  user_id: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  pat_id: {
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  words: {
    type: [String],
  },
  rank: {
    type: [Number],
  },
});

keywordSchema.plugin(autoIncrement.plugin, {
  model: 'Keyword',
  field: 'keyword_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Keyword', keywordSchema);
