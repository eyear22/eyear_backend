const express = require('express');
const { Storage } = require('@google-cloud/storage');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Relation = require('../database/relationship_schema');
const Patient = require('../database/patient_schema');
const Text = require('../database/text_schema');

const storage = new Storage();
const router = express.Router();
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;

const { isLoggedIn } = require('./middlewares');

// 기관 받은 편지 리스트
router.get('/receiveList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const patient = await Patient.findOne({ pat_number: req.query.number });

    if (patient) {
      const postList = await Post.find({
        to: patient._id,
      }).sort({ post_id: -1 });

      const result = await Promise.all(
        postList.map(async (post) => {
          const user = await User.findOne({ _id: post.from });
          const createdAt = JSON.stringify(post.createdAt).substr(1, 10);
          return {
            _id: post._id,
            post_id: post.post_id,
            title: post.title,
            content: post.content,
            createdAt,
            from: user.username,
            to: post.to,
            check: post.check,
          };
        })
      );
      res.status(200).send(result);
    } else {
      res.status(204).send('not existed patient number');
    }
  } catch (err) {
    next(err);
  }
});

// 기관 보낸 편지 리스트
router.get('/sendList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const patient = await Patient.findOne({ pat_number: req.query.number });

    if (patient) {
      const postList = await Post.find({
        from: patient._id,
      }).sort({ post_id: -1 });

      const result = await Promise.all(
        postList.map(async (post) => {
          const user = await User.findOne({ _id: post.to });
          const createdAt = JSON.stringify(post.createdAt).substr(1, 10);
          return {
            _id: post._id,
            post_id: post.post_id,
            title: post.title,
            content: post.content,
            createdAt,
            from: post.from,
            to: user.username,
            check: post.check,
          };
        })
      );
      res.status(200).send(result);
    } else {
      res.status(204).send('not existed patient number');
    }
  } catch (err) {
    next(err);
  }
});

// 환자와 관련된 가족 리스트
router.get('/:pat_id/userList', isLoggedIn, async (req, res, next) => {
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

router.get('/patientList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const hos_id = req.session.passport.user;

    const patients = await Patient.find({
      hos_id,
    });

    const patientList = patients.map((v) => ({
      name: v.pat_name,
      id: v._id,
    }));

    res.json(patientList);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
