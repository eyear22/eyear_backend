const express = require('express');
const Hospital = require('../database/hospital_schema');
const Patient = require('../database/patient_schema');
const User = require('../database/user_schema');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('회원가입 처음 페이지');
});

router.get('/user', async (req, res, next) => {
  if (!req) return;
  try{
    // 병원 리스트 - 병원 고유 아이디/병원이름
    const Hospital_List = await Hospital.find({});

    const hospital = Hospital_List.map((v) => ({
      hospitalName: v.hos_name,
      hospitalId: v._id,
    }));

    res.send(hospital);
  } catch (err) {
    next(err);
  }

});

router.post('/user', async(req, res, next) => {
  if (!req) return;
  try{
    if(req.body.patientName != '' && req.body.patientId != ''){

    }else{
      // 환자 이름과 넘버 검색해서 보내주기
      // 환자 리스트 - 고유번호/환자 아이디/환자 이름/환자 생년월일
      const Patient = await Patient.findOne({
        pat_number: req.body.patientId,
      });
  
      const result = {
        patientId: Patient.pat_number,
        patientName: Patient.pat_name,
        patientBirth: Patient.birth
      };

      console.log(result);
      res.send(result);
    }
  }catch (err) {
    console.log(err);
    next(err);
  }
});

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

module.exports = router;
