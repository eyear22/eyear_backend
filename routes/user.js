const express = require('express');

const bcrypt = require('bcrypt');

const router = express.Router();
const Post = require('../database/post_schema');
const Patient = require('../database/patient_schema');
const Relation = require('../database/relationship_schema');

const User = require('../database/user_schema');

const { isLoggedIn } = require('./middlewares');

// 개인 받은 편지 리스트
router.get('/receiveList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const { user } = req.session.passport;
    const postList = await Post.find({
      to: user,
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
router.get('/sendList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const { user } = req.session.passport;

    const postList = await Post.find({
      from: user,
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

router.get('/patientList', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const { user } = req.session.passport;

    const relation = await Relation.find({
      user_id: user,
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

router.get('/search', isLoggedIn, async (req, res, next) => {
  try {
    const { user } = req.session.passport;

    const relations = await Relation.find({
      user_id: user,
    });

    const pats = await Patient.find({
      pat_name: { $regex: req.query.value },
      _id: relations.map((v) => v.pat_id),
    });

    const posts = await Post.find({
      to: req.query.flag === '0' ? user : pats.map((v) => v._id),
      from: req.query.flag === '0' ? pats.map((v) => v._id) : user,
    }).sort({ post_id: -1 });

    const postList = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const post of posts) {
      // eslint-disable-next-line no-await-in-loop
      const patient = await Patient.findOne({
        _id: req.query.flag === '0' ? post.from : post.to,
      });
      postList.push({
        post_id: post.post_id,
        title: post.title,
        content: post.content,
        createdAt: JSON.stringify(post.createdAt).substr(1, 10),
        from: req.query.flag === '0' ? patient.pat_name : post.from,
        to: req.query.flag === '0' ? post.to : patient.pat_name,
        check: post.check,
      });
    }

    res.status(200).send(postList);
  } catch (err) {
    next(err);
  }
});

// 로그인한 상태에서 비밀번호를 변경하고 싶은 경우
router.patch('/modifyPwd', isLoggedIn, async (req, res) => {
  if (!req) return;

  const id = req.session.passport.user;
  const exUser = await User.findOne({ id });

  if (exUser) {
    const result = await bcrypt.compare(req.body.password, exUser.pwd);
    if (result) {
      const hash = await bcrypt.hash(req.body.new_password, 12);
      await User.updateOne(exUser, { pwd: hash });

      res.status(200).send('ok');
    } else {
      res.status(400).send('Password Mismatch');
    }
  } else {
    res.status(404).send('not existed user');
  }
});

module.exports = router;
