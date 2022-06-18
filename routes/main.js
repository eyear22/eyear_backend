const express = require('express');
const multer = require('multer');

const { Storage } = require('@google-cloud/storage');
const Post = require('../database/post_schema');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Text = require('../database/text_schema');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const Relation = require('../database/relationship_schema');

const router = express.Router();
const Cloud = require('../cloud/cloudstorage');

const storage = new Storage();

const bucketName = process.env.GCLOUD_STORAGE_BUCKET; // 구글 클라우드 스토리지에 생성한 버킷의 이름

// GCS에 업로드 하는 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET); // 해당 버킷에 접근하기 위한 변수

// 편지 보내기 api
router.post('/post', upload.array('many'), async (req, res, next) => {
  if (!req) return;
  try {
    const post = await Post.create({
      // 프론트에서 전달받은 편지의 내용으로 Post 생성
      title: req.body.title,
      content: req.body.content,
      from: req.body.from,
      to: req.body.to,
      check: false,
    });

    if (req.files.length !== 0) {
      // 글 외의 영상이나 이미지 파일이 있을 경우
      await req.files.map((file) => {
        // 여러 파일이 들어오므로 map() 사용
        const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
        const blob = bucket.file(Date.now() + '.' + type); // 저장되는 날짜를 사용하여 업로드되는 비디오들의 이름이 겹치지 않도록 설정한다.
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

// 보낸 편지 상세 조회
router.get('/sendDetail/:flag/:post_id', async (req, res, next) => {
  if (!req) return;
  try {
    const PostDetail = await Post.findOne(
      // 편지의 정보를 찾는 과정: post, video, image에 대한 정보를 찾아서 묶어서 프론트에게 보내준다.
      {
        post_id: req.params.post_id,
      },
      {}
    ).populate('post_id');

    const VideoUrl = await Video.find(
      // 비디오 찾기
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
      // 이미지 찾기
      {
        post_id: req.params.post_id,
      },
      { image: 1, _id: 0, post_id: 0 }
    ).populate('post_id');

    let to; // 받는 사람을 저장할 변수
    let from; // 보낸 사람을 저장할 변수
    let relation = ''; // 환자와 개인의 관계를 저장할 변수

    if (req.params.flag === '0') {
      // 개인 입장
      // 받은 사람 (환자) 이름 데이터 찾기
      to = await Patient.findOne(
        {
          _id: PostDetail.to,
        },
        { pat_name: 1, _id: 0 }
      );

      from = await User.findOne(
        // 보낸 사람 이름 데이터 찾기
        {
          _id: PostDetail.from,
        },
        { username: 1, _id: 0 }
      );
    } else {
      // 기관(병원) 입장
      to = await User.findOne(
        // 받은 사람 (개인) 이름 데이터 찾기
        {
          _id: PostDetail.to,
        },
        { username: 1, _id: 0 }
      );

      from = await Patient.findOne(
        // 보낸 사람 (환자) 이름 데이터 찾기
        {
          _id: PostDetail.from,
        },
        { pat_name: 1, _id: 0 }
      );

      relation = await Relation.findOne(
        // 환자와 개인의 관계 정보 찾기
        {
          user_id: PostDetail.to,
          pat_id: PostDetail.from,
        },
        { relation: 1, _id: 0 }
      );
    }

    const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10); // UI로 보여주기 위해 시간 데이터를 제외한 날짜 데이터만 프론트로 전송한다.

    // 프론트에게 전송되는 편지에 대한 전체 데이터
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
router.get('/receiveDetail/:flag/:post_id', async (req, res, next) => {
  if (!req) return;
  try {
    const PostDetail = await Post.findOne(
      // 요청받은 편지 전체 데이터 찾기
      {
        post_id: req.params.post_id,
      },
      {}
    ).populate('post_id');

    await Post.updateOne(
      // 받은 편지 상세 조회를 요청했다는 것은 편지를 확인했다는 뜻임으로 check 변수를 true로 업데이트 해준다.
      {
        post_id: req.params.post_id,
      },
      { check: true }
    );

    const VideoUrl = await Video.find(
      // 편지에 포함된 비디오 찾기
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
      // 편지에 포함된 이미지 찾기
      {
        post_id: req.params.post_id,
      },
      { image: 1, _id: 0, post_id: 0 }
    ).populate('post_id');

    let to; // 받는 사람을 저장할 변수
    let from; // 보낸 사람을 저장할 변수
    let relation = ''; // 환자와 개인의 관계를 저장할 변수

    if (req.params.flag === '0') {
      // 개인 입장
      to = await User.findOne(
        {
          // 받은 사람 (개인) 이름 데이터 찾기
          _id: PostDetail.to,
        },
        { username: 1, _id: 0 }
      );

      from = await Patient.findOne(
        {
          // 보낸 사람 (환자) 이름 데이터 찾기
          _id: PostDetail.from,
        },
        { pat_name: 1, _id: 0 }
      );
    } else {
      // 기관 입장
      to = await Patient.findOne(
        {
          // 받은 사람 (환자) 이름 데이터 찾기
          _id: PostDetail.to,
        },
        { pat_name: 1, _id: 0 }
      );

      from = await User.findOne(
        {
          // 보낸 사람 (개인) 이름 데이터 찾기
          _id: PostDetail.from,
        },
        { username: 1, _id: 0 }
      );

      relation = await Relation.findOne(
        {
          // 환자와 개인의 관계 정보 찾기
          pat_id: PostDetail.to,
          user_id: PostDetail.from,
        },
        { relation: 1, _id: 0 }
      );
    }

    const formatDate = JSON.stringify(PostDetail.createdAt).substr(1, 10); // UI로 보여주기 위해 시간 데이터를 제외한 날짜 데이터만 프론트로 전송한다.

    // 프론트에게 전송되는 편지에 대한 전체 데이터
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
});

module.exports = router;
