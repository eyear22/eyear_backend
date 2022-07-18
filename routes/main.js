const express = require('express');
const multer = require('multer');

const { Storage } = require('@google-cloud/storage');
const Post = require('../database/post_schema');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const Relation = require('../database/relationship_schema');

const router = express.Router();
const Cloud = require('../cloud/cloudstorage');
const ffmpeg = require('fluent-ffmpeg');
const storage = new Storage();
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;

const { isLoggedIn } = require('./middlewares');

// GCS에 업로드 하는 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

router.post(
  '/post',
  isLoggedIn,
  upload.array('many'),
  async (req, res, next) => {
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

          console.log('들어와?');
          // 여러 파일이 들어오므로 map() 사용
          const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
          const filename = Date.now() + '.' + type;

          const blob = bucket.file(filename);
          const blobStream = blob.createWriteStream();

          if (type === 'mp4') {
            ffmpeg(file)
                .videoCodec('libx264')
                .format('mp4')
                .size('1280x720')
                .on('error', function(err){
                  console.log('An error occurred:' + err.message);
                }).on('end', function(){
                  console.log("Processing finished!");
                  file.src = filename;
                }).save(filename)
            
            console.log('돌려졌니?');
          };

          
          blobStream.on('error', (err) => {
            next(err);
          });

          // 업로드 실행
          blobStream.end(file.buffer);
          
          blobStream.on('finish', () => {
            console.log('올리기 완료');
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            // 영상일 경우 자막 파일 생성
            if (type === 'mp4') {
              Cloud(`${blob.name}`, post.to, post.from, file);
            }
          });

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
  }
);

// 보낸 편지 상세 조회
router.get('/sendDetail/:flag/:post_id', isLoggedIn, async (req, res, next) => {
  if (!req) return;
  try {
    const PostDetail = await Post.findOne(
      {
        post_id: req.params.post_id,
      },
      {}
    ).populate('post_id');

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

    let to;
    let from;
    let relation = '';

    if (req.params.flag === '0') {
      // 개인 입장
      to = await Patient.findOne(
        {
          _id: PostDetail.to,
        },
        { pat_name: 1, _id: 0 }
      );

      from = await User.findOne(
        {
          _id: PostDetail.from,
        },
        { username: 1, _id: 0 }
      );
    } else {
      // 기관 입장
      to = await User.findOne(
        {
          _id: PostDetail.to,
        },
        { username: 1, _id: 0 }
      );

      from = await Patient.findOne(
        {
          _id: PostDetail.from,
        },
        { pat_name: 1, _id: 0 }
      );

      relation = await Relation.findOne(
        {
          user_id: PostDetail.to,
          pat_id: PostDetail.from,
        },
        { relation: 1, _id: 0 }
      );
    }

    const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10);

    const result = {
      detail: PostDetail,
      video: VideoUrl,
      image: ImageUrl,
      to,
      from,
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

// 받은 편지 상세 조회
router.get(
  '/receiveDetail/:flag/:post_id',
  isLoggedIn,
  async (req, res, next) => {
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
      console.log('session', req.session);
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

      let to;
      let from;
      let relation = '';

      if (req.params.flag === '0') {
        // 개인 입장
        to = await User.findOne(
          {
            _id: PostDetail.to,
          },
          { username: 1, _id: 0 }
        );

        from = await Patient.findOne(
          {
            _id: PostDetail.from,
          },
          { pat_name: 1, _id: 0 }
        );
      } else {
        // 기관 입장
        to = await Patient.findOne(
          {
            _id: PostDetail.to,
          },
          { pat_name: 1, _id: 0 }
        );

        from = await User.findOne(
          {
            _id: PostDetail.from,
          },
          { username: 1, _id: 0 }
        );

        relation = await Relation.findOne(
          {
            pat_id: PostDetail.to,
            user_id: PostDetail.from,
          },
          { relation: 1, _id: 0 }
        );
      }

      const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10);

      const result = {
        detail: PostDetail,
        video: VideoUrl,
        image: ImageUrl,
        to,
        from,
        Sub: sub,
        relation: relation,
        date: formatDate,
        videoUrl: videoLocalUrl,
      };
      res.send(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
