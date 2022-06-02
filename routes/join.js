const express = require('express');
const Hospital = require('../database/hospital_schema');
const Patient = require('../database/patient_schema');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('회원가입 처음 페이지');
});

router.get('/user', async (req, res, next) => {
  // 병원 리스트 - 병원 아이디/병원이름
  const Hospital_List = await Hospital.find({});

  // 환자 리스트 - 고유번호/환자 아이디/환자 이름/환자 생년월일
  const Patient_List = await Patient.find({});

  const Hospital = Hospital_List.map((v) => ({
    hospitalName: v.hos_name,
    hospitalId: v._id,
  }));

  // TODO: 내림언니한테 변수 다시 변경하라고 말하기
  const Patient = Patient_List.map((v) => ({
    patientId: v._id,
    patientNum: v.pat_number,
    patientName: v.pat_name,
    patientBirth: v.birth,
  }));

  const result = {
    hospital: Hospital,
    patient: Patient
  };
  res.send(result);

  //res.send('개인 회원가입 페이지');
});

router.post('/user', async(req, res, next) => {

});

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

module.exports = router;
