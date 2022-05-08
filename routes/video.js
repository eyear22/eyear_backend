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
      console.log('받아와지나?');
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      // Create a new blob in the bucket and upload the file data.
      // !!! file.originalname을 삭제하고 다른 걸로 대체할 방법 찾아보기.
    const blob = bucket.file(file.originalname + Date.now() +"."+ type);
    console.log(file.originalname);
    const blobStream = blob.createWriteStream();
    //blob.name = Date.now();

    console.log("저장명" + blob.name);
    blobStream.on('error', err => {
      console.log("보내는데에 오류발생!");
      next(err);
    });
    blobStream.on('finish', () => {
      console.log('잘 보내졌어');
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );
    });

    blobStream.end(file.buffer);
  });
    
  res.status(200).send('ok');
  }catch(error){
    console.log(err);
    next(err);
  }
 
   //return type;
 });
 
  /*
 await req.files.map((file) =>{
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
        // 영상 업로드 후 DB에 저장할 정보 생성
        if(type === 'mp4'){
          //영상일 경우
          const v = Video.create({
            video: file.path,
            post_id: req.body.post_id
          });
  
          // 영상의 경우 음성을 추출해서 따로 저장
          const to_audio_file = file.originalname + Date.now() +".mp3";
          const voice = new ffmpeg(file,  (err, file)=>{ 
             if (!err) {
                 //#2. 동영상에서 음성 추출 추출하기 (비동기 방식)
                 
              console.log('음성 추출');
                 file.fnExtractSoundToMP3(to_audio_file, (error, files)=>{
                     if(!error) {
                       console.log('finish audio!');
                     }else{
                       console.log(error.message);
                     }
                 });
             }
         })
         
         //3. 추출한 음성 GCS에 전송
         const mp3blob = bucket.file(voice);
         const mp3blobStream = mp3blob.createWriteStream();
        
         mp3blobStream.on('finish', () =>{
           const publicUrl = format(
            `https://storage.googleapis.com/${bucket.name}/voice/${blob.name}`
           );
           res.status(200).send(publicUrl);
         });
         mp3blobStream.end(req.file.buffer);
        }else if (type === 'png' || 'jpeg' || 'jpg') {
          // 이미지
          Image.create({
            image: file.path,
            post_id: req.body.post_id,
          });
        }
        
      // Create a new blob in the bucket and upload the file data.
      const blob = bucket.file(req.file.originalname);
      console.log(req.file.originalname);
      const blobStream = blob.createWriteStream();
      blob.name += Date.now();

      blobStream.on('error', err => {
        next(err);
      });
      blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        res.status(200).send(publicUrl);
      });

      blobStream.end(req.file.buffer);


      return type;
    });
    res.status(200).send('ok');
    
    console.log('완료');
  }catch(err){
    console.log(err);
    next(err);
  }

  */


// 비디오, 이미지 DB 저장
/*

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

router.post('/upload', upload.array('file'), async (req, res, next) => {
  if (!req) return;
  try {
    await req.files.map((file) => {
      // 여러 파일이 들어오므로 map() 사용
      const type = file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1); // 파일 type
      if (type === 'mp4') {
        // 동영상
        const v = Video.create({
          video: file.path,
          post_id: req.body.post_id,
        });

        // 오디오 추출
        // 저장할 파일 이름 및 형식 지정
        const name = path.basename(file.originalname, "mp4");
        const to_audio_file = "uploads/"+ name + Date.now() +".mp3";
         new ffmpeg(file.path,  (err, file)=>{ 
            if (!err) {
                //#2. 동영상에서 음성 추출 추출하기 (비동기 방식)
                file.fnExtractSoundToMP3(to_audio_file, (error, files)=>{
                    if(!error) {
                      console.log('finish audio!');
                    }else{
                      console.log(error.message);
                    }
                });
            }
        })

      
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

*/

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
