const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const Hospital = require('../database/hospital_schema');

module.exports = () => {
  passport.use(
    'local-hos',
    new LocalStrategy(
      {
        usernameField: 'id',
        passwordField: 'password',
      },
      async (id, password, done) => {
        try {
          const exHos = await Hospital.findOne({ hid: id });

          if (exHos === null) {
            done(null, false, { message: 'Not exited Hospital' });
          } else {
            const result = await bcrypt.compare(password, exHos.pwd);
            if (result) {
              done(null, exHos, 1);
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
