const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const { Schema } = mongoose;
const videoSchema = new Schema({
  video_id: {
    type: Number,
    unique: true,
  },
  video: {
    type: String,
    required: true,
  },
  post_id: {
    type: Number,
    required: true,
  },
});

// AutoIncrease를 실현시키기 위해서 사용하는 코드
videoSchema.plugin(autoIncrement.plugin, {
  model: 'Video',
  field: 'video_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Video', videoSchema);
