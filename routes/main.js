const express = require('express');
const multer = require('multer');

const Post = require('../database/post_schema');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');

const router = express.Router();
const { Storage } = require('@google-cloud/storage');
const Cloud = require('../cloud/cloudstorage');

const storage = new Storage();

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
      from: req.body.from,
      to: req.body.to,
      check: false,
    });

    if (req.files.length !== 0) {
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

module.exports = router;
