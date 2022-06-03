const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../database/user_schema');

const router = express.Router();

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

router.get('/user_id_check/:uid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      uid: req.params.uid,
    });
    if (user === null) {
      res.status(200).send('ok');
    } else {
      res.status(200).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
