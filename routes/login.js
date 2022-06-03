const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post('/user', async (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.send(info);
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.status(200).send('login success');
    });
  })(req, res, next);
});
module.exports = router;
