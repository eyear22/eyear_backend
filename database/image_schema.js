const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

const { Schema } = mongoose;
const imageSchema = new Schema({
  img_id: {
    type: Number,
    unique: true,
  },
  image: {
    type: String,
    required: true,
  },
  post_id: {
    type: Number,
    required: true,
  },
});

// AutoIncrease를 실현시키기 위해서 사용하는 코드
imageSchema.plugin(autoIncrement.plugin, {
  model: 'Image',
  field: 'img_id',
  startAt: 1,
  increment: 1,
});

module.exports = mongoose.model('Image', imageSchema);
