const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbconnect = () => {
  mongoose
    .connect(
      `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:27017/admin`,
      {
        dbName: 'eyear',
        // useNewUrlPaser: true,
        // useUnifiedTofology: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
      }
    )
    .then(() => console.log('MongoDB conected'))
    .catch((err) => {
      console.log('DB 연결 실패');
      console.log(err);
    });
};

module.exports = dbconnect;
