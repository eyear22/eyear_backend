const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../database/user_schema');
const Hospital = require('../database/hospital_schema');

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'uid',
        passwordField: 'password',
      },
      async (uid, password, done) => {
        try {
          let exUser;
          exUser = await User.findOne({ uid: uid });

          if (exUser === null) {
            exUser = await Hospital.findOne({ hid: uid });

            if (exUser !== null) {
              // 기관
              done(null, exUser, 1);
            }
            // const result = await bcrypt.compare(password, exUser.pwd);
            // if (result) {
            //   done(null, exUser, 1);
            // } else {
            //   done(null, false, { message: 'Password Mismatch' });
            // }
            // } else {
            //   done(null, false, { message: 'Not exited User' }); // 개인 기관 둘 다 아님
            // }
          } else {
            done(null, exUser, 0);
            // 개인
            // const result = await bcrypt.compare(password, exUser.pwd);
            // if (result) {
            //   done(null, exUser, 0);
            // } else {
            //   done(null, false, { message: 'Password Mismatch' });
            // }
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
