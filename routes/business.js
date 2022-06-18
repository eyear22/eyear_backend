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
    // PostDB에서 기관에게 보내어진 편지 객체를 검색
    const postList = await Post.find({
      to: req.params._id,
    }).sort({ post_id: -1 });

    // 받아온 객체에서 화면에 띄워주기 위한 정보 추출
    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      // 보낸이를 개인 DB에서 정보 추출
      const user = await User.findOne({ _id: postList[i].from });
      if (user !== null) {
        // 생성 날짜를 화면에 띄우기 알맞는 형태로 변환
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
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

    // 프론트에게 전달
    res.send(result);
  } catch (err) {
    next(err);
  }
});

// 기관 보낸 편지 리스트
router.get('/send_list/:_id', async (req, res, next) => {
  if (!req) return;
  try {
    // PostDB에서 기관이 보낸 편지 객체를 검색 - 배열로 받아옴
    const postList = await Post.find({
      from: req.params._id,
    }).sort({ post_id: -1 });
    const result = [];
    for (let i = 0; i < postList.length; i++) {
      // eslint-disable-next-line
      // 받는이를 개인 DB에서 정보 추출
      const user = await User.findOne({ _id: postList[i].to });
      if (user !== null) {
        const createdAt = JSON.stringify(postList[i].createdAt).substr(1, 10);
        // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
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
    // 프론트에게 전달
    res.send(result);
  } catch (err) {
    next(err);
  }
});

// 편지 상세 조회
router.get('/detail/:post_id', async (req, res, next) => {
  if (!req) return;
  try {
    // 선택한 편지 id로 PostDB에 검색
    const PostDetail = await Post.findOne(
      {
        post_id: req.params.post_id,
      },
      {}
    ).populate('post_id');

    // 받은 편지에서 읽은 편지 읽음 표시 하기
    await Post.updateOne(
      {
        post_id: req.params.post_id,
      },
      { check: true }
    );

    // 받은 편지에 Video가 존재하는지 VideoDB에 검색
    // 존재할 경우 VideoUrl와 Video_id 값만 들고오기 [자막 검색을 위해]
    const VideoUrl = await Video.find(
      {
        post_id: req.params.post_id,
      },
      { video: 1, _id: 0, post_id: 0, video_id: 1 }
    ).populate('post_id');

    let sub = [];
    let videoLocalUrl = '';
    let subLocalUrl = '';
    if (VideoUrl.length !== 0) {
      // 비디오 로컬에 저장
      // GCS에서 파일 받아서 video 객체를 받아오기
      // GCS에 저장된 파일 이름
      const FileName = VideoUrl[0].video;
      videoLocalUrl = `./uploads/${FileName}`;
      const options = {
        destination: videoLocalUrl,
      };

      // Downloads the file - 버킷에 있는 객체 파일을 로컬에 저장
      await storage.bucket(bucketName).file(FileName).download(options);

      // 자막 url 받아오기
      sub = await Text.find({
        vid: VideoUrl[0].video_id,
      });

      // 자막 로컬에 저장하기 위해
      // 자막 파일 이름과 로컬에 저장할 경로 설정
      // options.destination -> GCS에서 다운 받을 경로 지정
      const subFileName = sub[0].text;
      subLocalUrl = `./uploads/${subFileName}`;
      options.destination = subLocalUrl;

      // Downloads the file - 버킷에 있는 객체 파일을 로컬에 저장
      // 자막 파일 저장
      await storage
        .bucket(bucketName)
        .file('subtitle/' + subFileName)
        .download(options);
    }

    // 받은 편지에 Image가 존재하는지 ImageDB에 검색
    const ImageUrl = await Image.find(
      {
        post_id: req.params.post_id,
      },
      { image: 1, _id: 0, post_id: 0 }
    ).populate('post_id');

    // 보낸이에 대한 정보를 개인DB에 검색
    const to = await User.findOne(
      {
        _id: PostDetail.to,
      },
      { username: 1, _id: 0 }
    );

    // 받는이에 대한 정보를 환자DB에 검색
    const from = await Patient.findOne(
      {
        _id: PostDetail.from,
      },
      { pat_name: 1, _id: 0 }
    );

    // 환자의 입장에서 개인과 어떠한 관계가 있는지 검색
    // RelationDB에 보낸이(개인)에 대한 아이디 검색
    const relation = await Relation.findOne(
      {
        user_id: PostDetail.to,
      },
      { relation: 1, _id: 0 }
    );

    // UI에 띄우기 위해 날짜 형식 고치기
    const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10);

    // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
    const result = {
      detail: PostDetail,
      video: VideoUrl,
      image: ImageUrl,
      to: to,
      from: from,
      Sub: sub,
      relation: relation,
      date: formatDate,
      videoUrl: videoLocalUrl,
      subUrl: subLocalUrl,
    };
    console.log(result);
    res.send(result);
  } catch (err) {
    next(err);
  }
});


router.get('/manage', (req, res) => {
  res.send('기관 환자 관리 페이지');
});

// 환자와 관련된 가족 리스트
router.get('/:pat_id/userList', async (req, res, next) => {
  if (!req) return;
  try {
    // 환자 - 개인 간의 관계 객체를 RelationDB에 검색
    const useridList = await Relation.find({
      pat_id: req.params.pat_id,
    });

    // 관계 객체에서 개인에 대한 정보를 검색
    const familyList = await User.find({
      _id: { $in: useridList.map((v) => v.user_id) },
    });


    // 프론트엔드에서 이해하기 쉬운 형태로 데이터 정리
    const family = familyList.map((v) => ({
      name: v.username,
      id: v._id,
    }));

    // 프론트로 전달
    res.json(family);
  } catch (err) {
    next(err);
  }
});

// 기관 입장에서 환자 리스트
router.get('/:hos_id/patientList', async (req, res, next) => {
  if (!req) return;
  try {
    // 기관에 소속된 환자 정보 PatientDB에 검색
    const patients = await Patient.find({
      hos_id: req.params.hos_id,
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
