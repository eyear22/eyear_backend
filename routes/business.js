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


// 편지 상세 조회 - 보낸 편지를 확인
router.get('/detail/:post_id', async (req, res, next) => {
  if (!req) return;
  try {
    const PostDetail = await Post.findOne(
      {
        post_id: req.params.post_id,
      },
      {}
    ).populate('post_id');

    await Post.updateOne(
      {
        post_id: req.params.post_id,
      },
      { check: true }
    );

    const VideoUrl = await Video.find(
      {
        post_id: req.params.post_id,
      },
      { video: 1, _id: 0, post_id: 0, video_id: 1 }
    ).populate('post_id');

    let sub = [];
    let videoLocalUrl = '';
    let subLocalUrl = '';
    if(VideoUrl.length !== 0){
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

      console.log(VideoUrl[0].video);

      // 자막 url 받아오기
      sub = await Text.find({
        vid: VideoUrl[0].video_id,
      })

      // 자막 로컬에 저장
      const subFileName = sub[0].text;
      subLocalUrl = `./uploads/${subFileName}`;
      options.destination = subLocalUrl; 

      // Downloads the file - 버킷에 있는 객체 파일을 로컬에 저장
      await storage.bucket(bucketName).file('subtitle/'+ subFileName).download(options);
    }
   
    const ImageUrl = await Image.find(
      {
        post_id: req.params.post_id,
      },
      { image: 1, _id: 0, post_id: 0 }
    ).populate('post_id');

    const to = await User.findOne(
      {
        _id: PostDetail.to,
      },
      { username: 1, _id: 0 }
    );

    const from = await Patient.findOne(
      {
        _id: PostDetail.from,
      },
      { pat_name: 1, _id: 0 }
    );

    const relation = await Relation.findOne(
      {
        user_id: PostDetail.to,
      },
      { relation: 1, _id: 0 }
    );

    const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10);

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
    console.log(result)
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
