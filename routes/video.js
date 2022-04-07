const express = require('express');

const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.diskStorage({
    // 저장하는 곳을 지정
    destination(req, file, done) {
      done(null, 'uploads/');
    },
    // 저장할 파일 이름 지정
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      console.log('파일명 확인' + ext);
      // 파일명이 겹치는 것을 막기 위해 Date.now 사용
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
});

router.post('/uploadfiles', upload.single('file'), (req, res) => {
  // 비디오를 서버에 저장
  console.log(req.files, req.body);
  res.send('success');
});

module.exports = router;
