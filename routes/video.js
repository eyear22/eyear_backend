const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Text = require('../database/text_schema');
//const ffmpeg = require('fluent-ffmpeg');
const ffmpeg = require('ffmpeg')

const {format} = require('util');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

// 파일 서버 업로드 api
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  // 폴더 생성
  fs.mkdirSync('uploads');
}

const router = express.Router();

//GCS에 업로드 하는 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    //fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// Process the file upload and upload to Google Cloud Storage.
router.post('/upload', upload.array('file'), async (req, res, next) => {
console.log('post 실행');
  if (!req) {
    res.status(400).send('No file uploaded.');
    console.log('에러 발생');
    return;
  }
  try{
    await req.files.map((file) =>{
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      // Create a new blob in the bucket and upload the file data.
      // !!! file.originalname을 삭제하고 다른 걸로 대체할 방법 찾아보기.
    const blob = bucket.file(Date.now() +"."+ type);
    console.log(file.originalname);
    const blobStream = blob.createWriteStream();
    //blob.name = Date.now();

    console.log("저장명" + blob.name);
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

    /*
    if(type === 'mp4'){
          //영상일 경우
          const v = Video.create({
            //video: file.path,
            //post_id: req.body.post_id
          });
    }else if (type === 'png' || 'jpeg' || 'jpg') {
      // 이미지
      Image.create({
        //image: file.path,
        //post_id: req.body.post_id,
      });
    }
    */


  });
    
  res.status(200).send('ok');
  }catch(error){
    console.log(err);
    next(err);
  }
 
   //return type;
 });


// 비디오 path 보내기
router.post('/getVideoDetail', async (req, res, next) => {
  try {
    const video = await Video.findOne({ post_id: req.body.post_id });
    res.json({ success: true, video });
  } catch (err) {
    console.error(err);
    next(err);
  }
});



module.exports = router;
