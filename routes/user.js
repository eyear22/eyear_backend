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
    // PostDB에서 개인에게 보내어진 편지 객체를 검색
    const postList = await Post.find({
      to: req.params._id,
    }).sort({ post_id: -1 });

    // 받아온 객체에서 화면에 띄워주기 위한 정보 추출
    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      // 보낸이를 환자 DB에서 정보 추출
      const patient = await Patient.findOne({ _id: postList[i].from });
      if (patient !== null) {
        // UI에 띄울 날짜 형식으로 변환
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
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

    // 프론트에게 전달
    res.send(result);
  } catch (err) {
    next(err);
  }
});

// 개인 보낸 편지 리스트
router.get('/send_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    // PostDB에서 개인이 보낸 편지 객체를 검색 - 배열로 받아옴
    const postList = await Post.find({
      from: req.params._id,
    }).sort({ post_id: -1 });

    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      // 받는이를 환자 DB에서 정보 추출
      const patient = await Patient.findOne({ _id: postList[i].to });
      if (patient !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
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
    // 프론트에게 전달
    res.send(result);
  } catch (err) {
    next(err);
  }
});

// 개인과 관련된 환자 리스트 => 한명의 개인이 두 명 이상의 환자 정보와 매칭됐을 때
router.get('/:user_id/patientList', async (req, res, next) => {
  if (!req) return;
  try {
    // 환자 - 개인 간의 관계 객체를 RelationDB에 검색
    const relation = await Relation.find({
      user_id: req.params.user_id,
    });

    // 관계 객체에서 환자에 대한 정보를 검색
    const patients = await Patient.find({
      _id: { $in: relation.map((v) => v.pat_id) },
    });

    // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
    const patientList = patients.map((v) => ({
      name: v.pat_name,
      id: v._id,
    }));
    // 프론트로 전달
    res.json(patientList);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
