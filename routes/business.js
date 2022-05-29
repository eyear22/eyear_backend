const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const Patient = require('../database/patient_schema');
const { json } = require('body-parser');
const router = express.Router();

router.get('/receive', (req, res) => {
  res.send('기관 받은 편지 확인 페이지');
});



router.get('/send', (req, res) => {
  res.send('기관 보낸 편지 확인 페이지');
});

// 편지 상세 조회 - 보낸 편지를 확인
router.get('/detail/:post_id', async (req, res, next) => {
  if (!req) return;
  try {
    const PostDetail = await Post.findOne({
      post_id: req.params.post_id,
    },{}).populate('post_id');

    const VideoUrl = await Video.find({
      post_id: req.params.post_id,
    }, {video: 1, _id:0, post_id: 0}).populate('post_id');

    // const sub = await Text.find({
    //   _id: req.params.post_id,
    // })

    const ImageUrl = await Image.find({
      post_id: req.params.post_id,
    }, {image: 1, _id:0, post_id: 0}).populate('post_id');

    const to = await User.findOne({
      _id: PostDetail.to,
    }, {username: 1, _id: 0, relationship:1});

    
    // const from = await User.findOne({
    //   _id: PostDetail.from,
    // }, {username: 1, _id: 0});

    res.json(PostDetail + VideoUrl + ImageUrl+ to);
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
      from: req.body.pat_id,
      to: (await User.findOne({ username: req.body.receiver }))._id,
      check: false,
    });

    
    console.log(req.files);

    if(req.files.length != 0){

    await req.files.map((file) => {
      // 여러 파일이 들어오므로 map() 사용
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      const blob = bucket.file(Date.now() + '.' + type);
      console.log(file.originalname);
      const blobStream = blob.createWriteStream();

      console.log('저장명' + blob.name);
      blobStream.on('error', (err) => {
        next(err);
      });
      blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      });

      // 업로드 실행
      blobStream.end(file.buffer);

      if (type === 'mp4') {
        // 동영상
        Video.create({
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
    }).populate('hos_id');
    res.json(patientList);
  } catch (err) {
    next(err);
  }
});

router.get('/:pat_id/userList', async (req, res, next) => {
  if (!req) return;
  try {
    const userList = await User.find({
      pat_id: req.params.pat_id,
    });
    res.json(userList);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
