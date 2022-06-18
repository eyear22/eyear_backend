const passport = require('passport'); // node.js에서 회원가입과 로그인을 쉽게 구현할 수 있도록 제공하는 모듈
const LocalStrategy = require('passport-local').Strategy; // 로컬 로그인을 사용
const bcrypt = require('bcrypt'); // 암호화 모듈 (비밀번호에 사용)

const User = require('../database/user_schema');
const Hospital = require('../database/hospital_schema');

module.exports = () => {
  passport.use(
    new LocalStrategy( // passport 모듈을 사용하여 새로운 로컬 로그인 전략 생성 -> 이 전략에 따라서 로그인을 수행한다.
      {
        usernameField: 'uid',
        passwordField: 'password',
      },
      async (uid, password, done) => {
        try {
          let exUser;
          exUser = await User.findOne({ uid: uid }); // 아이디가 uid인 가족 개인 회원이 있는지 찾는다.

          if (exUser === null) {
            // 회원이 없을 경우
            exUser = await Hospital.findOne({ hid: uid }); // 병원 회원의 아이디인지 찾는다.

            if (exUser !== null) {
              // 병원 회원의 아이디일 경우
              const result = await bcrypt.compare(password, exUser.pwd); // bcrypt 모듈을 사용하여 암호화되어 저장되어있는 비밀번호를 비교한다.
              if (result) {
                // 비밀번호가 일치할 경우
                done(null, exUser, 1); // 프론트엔드에게 회원인지 병원인지 알려주기 위해 flag 값을 (병원은 1 회원은 0) 함께 전송한다.
              } else {
                // 비밀번호가 일치하지 않을 경우
                done(null, false, { message: 'Password Mismatch' });
              }
            } else {
              // 아이디가 존재하지 않을 경우
              done(null, false, { message: 'Not exited User' }); // 개인 기관 둘 다 아님
            }
          } else {
            // 개인 회원일 경우
            const result = await bcrypt.compare(password, exUser.pwd); // bcrypt 모듈을 사용하여 암호화되어 저장되어있는 비밀번호를 비교한다.
            if (result) {
              // 비밀번호가 일치할 경우
              done(null, exUser, 0); // 프론트엔드에게 회원인지 병원인지 알려주기 위해 flag 값을 (병원은 1 회원은 0) 함께 전송한다.
            } else {
              // 비밀번호가 일치하지 않을 경우
              done(null, false, { message: 'Password Mismatch' });
            }
          }
        } catch (error) {
          // 에러처리
          console.error(error);
          done(error);
        }
      }
    )
  );
};
