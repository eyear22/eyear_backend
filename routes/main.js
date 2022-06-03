const express = require('express');
const router = express.Router();
const Post = require('../database/post_schema');

router.get('/login', (req, res) => {
  res.send('로그인 페이지');
});

router.get('/findId', (req, res) => {
  res.send('아이디 찾기 페이지');
});

router.get('/findPwd', (req, res) => {
  res.send('비밀번호 찾기 페이지');
});

router.get('/modifyPwd', (req, res) => {
  res.send('비밀번호 변경 페이지');
});

router.get('/receive_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      to: req.params._id,
    });

    res.json(postList);
  } catch (err) {
    next(err);
  }
});

router.get('/send_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      from: req.params._id,
    });

    res.json(postList);
  } catch (err) {
    next(err);
  }
});
module.exports = router;
