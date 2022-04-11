const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');

// 파일 서버 업로드 api
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  // 폴더 생성
  fs.mkdirSync('uploads');
}

const router = express.Router();

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
      console.log('파일명 확인', ext);
      // 파일명이 겹치는 것을 막기 위해 Date.now 사용
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  // 파일 크기를 5MB로 제한
  // limits: {fileSize: 5 * 1024 * 1024},
});

// 비디오를 서버에 저장
router.post('/upload', upload.array('file'), async (req, res, next) => {
  if (!req) return;
  try {
    await req.files.map((file) => {
      // 여러 파일이 들어오므로 map() 사용
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      if (type === 'mp4') {
        // 동영상
        Video.create({
          video: file.path,
          post_id: req.body.post_id,
        });
      } else if (type === 'png' || 'jpeg' || 'jpg') {
        // 이미지
        Image.create({
          image: file.path,
          post_id: req.body.post_id,
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

module.exports = router;
