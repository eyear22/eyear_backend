const express = require('express');
const router = express.Router();
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');

// 개인 받은 편지 리스트
router.get('/receive_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      to: req.params._id,
    }).sort({ createdAt: -1 });

    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const patient = await Patient.findOne({ _id: postList[i].from });
      if (patient !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt: createdAt,
          from: patient.pat_name,
          to: postList[i].to,
          check: postList[i].check,
        };
      }
    }

    res.send(result);
  } catch (err) {
    next(err);
  }
});

// 개인 보낸 편지 리스트
router.get('/send_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      from: req.params._id,
    }).sort({ createdAt: -1 });
    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const patient = await Patient.findOne({ _id: postList[i].to });
      if (patient !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt: createdAt,
          from: postList[i].from,
          to: patient.pat_name,
          check: postList[i].check,
        };
      }
    }
    res.send(result);
  } catch (err) {
    next(err);
  }
});

router.get('/post', (req, res) => {
  res.send('개인 편지 작성 페이지');
});

router.get('/detail/:postid', (req, res) => {
  res.send('개인 편지 상세 페이지');
});

module.exports = router;
