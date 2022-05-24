const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Post = require('../database/post_schema');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const router = express.Router();

router.get('/receive', (req, res) => {
  res.send('기관 받은 편지 확인 페이지');
});

router.get('/send', (req, res) => {
  res.send('기관 보낸 편지 확인 페이지');
});

router.get('/detail/:postid', (req, res) => {
  res.send('기관 편지 상세 페이지');
});

router.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'upload.html'));
});

router.get('/manage', (req, res) => {
  res.send('기관 환자 관리 페이지');
});

// 파일 서버 업로드 api
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  // 폴더 생성
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    // 저장하는 곳을 지정
    destination(req, file, done) {
      done(null, 'uploads/');
    },
    // 저장할 파일 이름 지정
    filename(req, file, done) {
      console.log(file.originalname);
      const ext = path.extname(file.originalname);
      // 파일명이 겹치는 것을 막기 위해 Date.now 사용
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  // 파일 크기를 5MB로 제한
  // limits: {fileSize: 5 * 1024 * 1024},
});

async function findUser(username) {
  try {
    const user = await User.findOne({ username: username });
    return user.user_id;
  } catch (err) {
    console.error(err);
    next(err);
  }
}

router.post('/post', upload.array('many'), async (req, res, next) => {
  if (!req) return;
  try {
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      from: req.body.pat_id,
      to: await findUser(req.body.receiver),
      check: false,
    });

    await req.files.map((file) => {
      // 여러 파일이 들어오므로 map() 사용
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      if (type === 'mp4') {
        // 동영상
        Video.create({
          video: file.path,
          post_id: post.post_id,
        });
      } else if (type === 'png' || 'jpeg' || 'jpg') {
        // 이미지
        Image.create({
          image: file.path,
          post_id: post.post_id,
        });
      }
      return type;
    });

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

module.exports = router;
