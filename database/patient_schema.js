// 환자 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const { Schema } = mongoose;

const patientSchema = new Schema({
  pat_number: {
    type: String,
    unique: true,
    required: true,
  },
  pat_name: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
    required: true,
  },
  birth: {
    type: Date,
    required: true,
  },
  hos_id: {
    type: Schema.ObjectId,
    ref: 'Hospital',
  },
  user_id: {
    type: [Schema.ObjectId],
    ref: 'User',
  },
});

module.exports = mongoose.model('Patient', patientSchema);
