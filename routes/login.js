const express = require('express');
const passport = require('passport');

const router = express.Router();
const { isNotLoggedIn } = require('./middlewares');

router.post('/user', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate('local-user', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.status(400).send(info);
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.status(200).send({ user, flag: info });
    });
  })(req, res, next);
});

router.post('/hospital', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate('local-hos', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.status(400).send(info);
    }

    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      console.log(req.isAuthenticated());
      return res.status(200).send({ user, flag: info });
    });
  })(req, res, next);
});

module.exports = router;
