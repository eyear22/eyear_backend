const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../database/video_schema');
const Image = require('../database/image_schema');
const Text = require('../database/text_schema');
//const ffmpeg = require('fluent-ffmpeg');
const ffmpeg = require('ffmpeg')

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

// 비디오, 이미지 DB 저장
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
                //#2. 동영상에서 이미지를 추출하기 (비동기 방식)
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

/*

convert(file, file.originalname + '.mp3', function(err){
  if(!err){
    console.log('conversion complete');
  }else{
    console.log("에러발생");
  }
});
function convert(input, output, callback) {
  ffmpeg(input)
      .output(output)
      .on('end', function() {                    
          console.log('conversion ended');
          callback(null);
      }).on('error', function(err){
          console.log('error: ', err.code, err.msg);
          callback(err);
      }).run();
}


const targetMP4File = 'upload/nextlevel1650094319041.mp4'  //영상 파일
const to_audio_file = './sample.mp3'  //오디오 파일

new ffmpeg(targetMP4File,  (err, video)=>{  
    if (!err) {
        //#2. 동영상에서 이미지를 추출하기 (비동기 방식)
        video.fnExtractSoundToMP3(to_audio_file, (error, files)=>{
            if(!error) console.log('finish audio!')
        });       
    }
})
*/

module.exports = router;
