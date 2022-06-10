const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Relation = require('../database/relationship_schema');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const Patient = require('../database/patient_schema');
const router = express.Router();
const Text = require('../database/text_schema');
const Cloud = require('../cloud/cloudstorage');

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
          createdAt: createdAt,
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
          createdAt: createdAt,
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

      console.log(videoLocalUrl);

      // 자막 url 받아오기
      sub = await Text.find({
        vid: VideoUrl[0].video_id,
      });
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
    };
    console.log(result);
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

//GCS에 업로드 하는 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    //fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

router.post('/post', upload.array('many'), async (req, res, next) => {
  if (!req) return;
  try {
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      // createdAt: formatDate,
      from: req.body.pat_id,
      to: (await User.findOne({ username: req.body.receiver }))._id,
      check: false,
    });

    if (req.files.length != 0) {
      await req.files.map((file) => {
        // 여러 파일이 들어오므로 map() 사용
        const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
        const blob = bucket.file(Date.now() + '.' + type);
        console.log(file.originalname);
        const blobStream = blob.createWriteStream();

        blobStream.on('error', (err) => {
          next(err);
        });
        blobStream.on('finish', () => {
          // The public URL can be used to directly access the file via HTTP.
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

          // 영상일 경우 자막 파일 생성
          if (type === 'mp4') {
            Cloud(`${blob.name}`, post.to, post.from);
          }
        });

        // 업로드 실행
        blobStream.end(file.buffer);
        if (type === 'mp4') {
          // 동영상
          const v = Video.create({
            video: `${blob.name}`,
            post_id: post.post_id,
          });
        } else if (type === 'png' || 'jpeg' || 'jpg') {
          // 이미지
          Image.create({
            image: `${blob.name}`,
            post_id: post.post_id,
          });
        }
        return type;
      });
    }
    res.status(200).send('ok');
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get('/:hos_id/patientList', async (req, res, next) => {
  if (!req) return;
  try {
    const patientList = await Patient.find({
      hos_id: req.params.hos_id,
    });

    const patient = patientList.map((v) => ({
      name: v.pat_name,
      id: v._id,
    }));

    res.json(patient);
  } catch (err) {
    next(err);
  }
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
