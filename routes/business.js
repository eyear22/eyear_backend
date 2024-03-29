const express = require('express');
const bcrypt = require('bcrypt');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Relation = require('../database/relationship_schema');
const Patient = require('../database/patient_schema');
const Hospital = require('../database/hospital_schema');

const router = express.Router();
const transPort = require('../passport/email');
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
      number: v.pat_number,
      sex: v.sex,
      birth: JSON.stringify(v.birth).substr(1, 10),
      id: v._id,
    }));

    res.json(patientList);
  } catch (err) {
    next(err);
  }
});

router.post('/patient', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const id = req.session.passport.user;

    const { pat_number, pat_name, sex, birth } = req.body;

    const patient = await Patient.create({
      pat_number,
      pat_name,
      sex,
      birth,
      hos_id: id,
    });

    res.status(200).send('ok');
  } catch (err) {
    next(err);
  }
});

router.get('/search', isLoggedIn, async (req, res, next) => {
  try {
    const { user } = req.session.passport;

    const relations = await Relation.find({
      hos_id: user,
    });

    const pats = await Patient.find({
      pat_name: { $regex: req.query.value },
      _id: relations.map((v) => v.pat_id),
    });

    let posts;

    if (req.query.flag === '0') {
      posts = await Post.find({
        to: pats.map((v) => v._id),
      }).sort({ post_id: -1 });
    } else {
      posts = await Post.find({
        from: pats.map((v) => v._id),
      }).sort({ post_id: -1 });
    }

    const postList = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const post of posts) {
      // eslint-disable-next-line no-await-in-loop
      const patient = await Patient.findOne({
        _id: req.query.flag === '0' ? post.to : post.from,
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
  const exHos = await Hospital.findOne({ id });

  if (exHos) {
    const result = await bcrypt.compare(req.body.password, exHos.pwd);
    if (result) {
      const hash = await bcrypt.hash(req.body.new_password, 12);
      await User.updateOne(exHos, { pwd: hash });

      res.status(200).send('ok');
    } else {
      res.status(400).send('Password Mismatch');
    }
  } else {
    res.status(404).send('not existed hospital');
  }
});

// 비밀번호 찾기
router.get('/newPwd', async (req, res) => {
  if (!req) return;

  const { hos_name, email } = req.query;

  const exHos = await Hospital.findOne({ hos_name, email });

  if (exHos) {
    const newPwd = Math.random().toString(36);
    const hash = await bcrypt.hash(newPwd, 12);
    await Hospital.updateOne(exHos, { pwd: hash });

    const mailOptions = {
      from: `Eyear <${process.env.MAILS_EMAIL}>`,
      to: email,
      subject: `[아이어] 비밀번호 변경 안내`,
      text: `아래의 비밀번호를 사용하여 로그인 후 비밀번호를 변경해주세요. \n[임시 비밀번호] ${newPwd}`,
    };

    transPort.sendMail(mailOptions, (error) => {
      res.status(402).send('send mail error');
      throw error;
    });

    res.status(200).send('success');
  } else {
    res.status(204).send('not existed hospital');
  }
});

// 아이디 찾기
router.get('/findId', async (req, res) => {
  if (!req) return;

  const { hos_name, email } = req.query;

  const isExist = await Hospital.findOne({ hos_name, email });

  if (isExist) {
    const hospital = {
      id: isExist.hid,
      createdAt: JSON.stringify(isExist.createdAt).substr(1, 10),
    };
    res.status(200).send(hospital);
  } else {
    res.status(204).send('not existed user');
  }
});

module.exports = router;
