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
      async (uid, password, flag, done) => {
        try {
          let exUser;
          if (flag === 0) {
            exUser = await User.findOne({ uid: uid });
          } else {
            exUser = await Hospital.findOne({ hid: uid });
          }
          if (exUser !== null) {
            const result = await bcrypt.compare(password, exUser.pwd);
            if (result) {
              done(null, exUser, flag);
            } else {
              done(null, false, { message: 'Password Mismatch' });
            }
          } else {
            done(null, false, { message: 'Not exited User' });
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
