const passport = require('passport');
const localUser = require('./userLocalStrategy');
const localHospital = require('./hospitalLocalStrategy');
const User = require('../database/user_schema');

module.exports = () => {
  passport.serializeUser((user, done) => {
    // 로그인시 실행
    // 사용자 정보 객체를 세션에 저장
    console.log('serializeUser');
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    // 매 요청시 실행
    // 세션에 저장한 아이디를 통해 사용자 정보 객체를 불러오는 것
    console.log('deserializeUser');
    User.findOne({ _id: id })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

  localHospital();
  localUser();
};
