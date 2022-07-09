const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../database/user_schema');

module.exports = () => {
  passport.use(
    'local-user',
    new LocalStrategy(
      {
        usernameField: 'id',
        passwordField: 'password',
      },
      async (id, password, done) => {
        try {
          const exUser = await User.findOne({ uid: id });

          if (exUser === null) {
            done(null, false, { message: 'Not exited User' });
          } else {
            const result = await bcrypt.compare(password, exUser.pwd);
            if (result) {
              done(null, exUser, 0);
            } else {
              done(null, false, { message: 'Password Mismatch' });
            }
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
