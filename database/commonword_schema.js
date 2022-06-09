// 명사 키워드 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const commonwordSchema = new Schema({
  word_id: {
    type: Number,
    unique: true,
  },
  pat_id: {
    type: Schema.ObjectId,
    ref: 'Patient',
  },
  words: {
    type: [String],
  },
});

commonwordSchema.plugin(autoIncrement.plugin, {
  model: 'Commonword',
  field: 'word_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Commonword', commonwordSchema);
