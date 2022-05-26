const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const router = express.Router();

//GCS에 업로드 하는 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    //fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// 비디오, 이미지 DB 저장
router.post('/upload', upload.array('file'), async (req, res, next) => {
  if (!req) return;
  try {
    await req.files.map((file) => {
      // 여러 파일이 들어오므로 map() 사용
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      const blob = bucket.file(Date.now() +"."+ type);
      const blobStream = blob.createWriteStream();

      blobStream.on('error', err => {
        console.log("보내는데에 오류발생!");
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
          video: `gs://${bucket.name}//${blob.name}`,
          post_id: req.body.post_id,
        });
      } else if (type === 'png' || 'jpeg' || 'jpg') {
        // 이미지
        Image.create({
          video: `gs://${bucket.name}/${blob.name}`,
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

// 비디오 path 보내기
router.post('/getVideoDetail', async (req, res, next) => {
  try {
    //const video = await Video.findOne({ post_id: req.body.post_id });
    // 비디오 path를 받아와서 보내기 - 임의로 gs 링크 지정
    const gcsUri = 'gs://swu_eyear/할머니2.mp4';

    // GCS에서 파일 받아서 video 객체를 받아오기

    res.json({ success: true, video });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
