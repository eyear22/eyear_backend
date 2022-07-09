const express = require('express');
const { Storage } = require('@google-cloud/storage');

const router = express.Router();
const Post = require('../database/post_schema');
const Patient = require('../database/patient_schema');
const Relation = require('../database/relationship_schema');
const Video = require('../database/video_schema');
const Text = require('../database/text_schema');
const User = require('../database/user_schema');
const Image = require('../database/image_schema');

const storage = new Storage();

const bucketName = process.env.GCLOUD_STORAGE_BUCKET;

// 개인 받은 편지 리스트
router.get('/receive_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    const postList = await Post.find({
      to: req.params._id,
    }).sort({ post_id: -1 });

    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const patient = await Patient.findOne({ _id: postList[i].from });
      if (patient !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          post_id: postList[i].post_id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt,
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
    }).sort({ post_id: -1 });

    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      const patient = await Patient.findOne({ _id: postList[i].to });
      if (patient !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        result[i] = {
          _id: postList[i]._id,
          post_id: postList[i].post_id,
          title: postList[i].title,
          content: postList[i].content,
          createdAt,
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

router.get('/:user_id/patientList', async (req, res, next) => {
  if (!req) return;
  try {
    const relation = await Relation.find({
      user_id: req.params.user_id,
    });

    const patients = await Patient.find({
      _id: { $in: relation.map((v) => v.pat_id) },
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

// TODO: 프론트와 연결하면 인수 추가로 변경해야함
router.get('/SearchReceive', async (req, res, next) => {
  try {
    const userId = '62a34a5fe13f9af866992c52';
    const search = '임창정';

    const patient = await Relation.find({
      user_id: userId,
    });

    const pats = await Patient.findOne({
      pat_name: search, //req.query.value,
      pat_id: patient.map((v) => v.pat_id),
    });

    const posts = await Post.find({
      from: pats._id,
    }).sort({ post_id: -1 });

    const PostList = posts.map((v) => ({
      _id: v._id,
      post_id: v.post_id,
      title: v.title,
      content: v.content,
      createdAt: JSON.stringify(v.createdAt).substr(1, 10),
      from: pats.pat_name,
      to: v.to,
      check: v.check,
    }));
    console.log(PostList);
    res.send(PostList);
  } catch (err) {
    next(err);
  }
});

router.get('/SearchSend', async (req, res, next) => {
  try {
    const userId = '62bda67c8740aea0eb93d36d';
    const search = '임창정';

    const patient = await Relation.find({
      user_id: userId,
    });

    const pats = await Patient.findOne({
      pat_name: search, //req.query.value,
      pat_id: patient.map((v) => v.pat_id),
    });

    const posts = await Post.find({
      to: pats._id,
    }).sort({ post_id: -1 });

    const PostList = posts.map((v) => ({
      _id: v._id,
      post_id: v.post_id,
      title: v.title,
      content: v.content,
      createdAt: JSON.stringify(v.createdAt).substr(1, 10),
      from: v.from,
      to: pats.pat_name,
      check: v.check,
    }));
    console.log(PostList);
    res.send(PostList);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
