const express = require('express');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Relation = require('../database/relationship_schema');
const Patient = require('../database/patient_schema');

const storage = new Storage();
const router = express.Router();
const Text = require('../database/text_schema');

const bucketName = process.env.GCLOUD_STORAGE_BUCKET;

// 기관 받은 편지 리스트
router.get('/receive_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      to: req.params._id,
    }).sort({ post_id: -1 });

    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const user = await User.findOne({ _id: postList[i].from });
      if (user !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          post_id: postList[i].post_id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt,
          from: user.username,
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

// 기관 보낸 편지 리스트
router.get('/send_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      from: req.params._id,
    }).sort({ post_id: -1 });
    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const user = await User.findOne({ _id: postList[i].to });
      if (user !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          post_id: postList[i].post_id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt,
          from: postList[i].from,
          to: user.username,
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
  console.log('불러오기!');
  res.sendFile(path.join(__dirname, '..', 'upload.html'));
});

router.get('/manage', (req, res) => {
  res.send('기관 환자 관리 페이지');
});

// 환자와 관련된 가족 리스트
router.get('/:pat_id/userList', async (req, res, next) => {
  if (!req) return;
  try {
    const useridList = await Relation.find({
      pat_id: req.params.pat_id,
    });

    const familyList = await User.find({
      _id: { $in: useridList.map((v) => v.user_id) },
    });

    const family = familyList.map((v) => ({
      name: v.username,
      id: v._id,
    }));
    res.json(family);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
