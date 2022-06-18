// 회원가입
const express = require('express');

const bcrypt = require('bcrypt');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const Hospital = require('../database/hospital_schema');
const Relation = require('../database/relationship_schema');
const Commonword = require('../database/commonword_schema');
const addPostposition = require('../keywords/nounKeywords');

const router = express.Router();

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

// 아이디 중복 확인 api
router.get('/user_id_check/:uid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      // 해당 아이디를 사용하는 개인 회원이 있는지 확인
      uid: req.params.uid,
    });
    if (user === null) {
      // 없으면 ok
      res.status(200).send('ok');
    } else {
      // 있으면 exit 를 프론트엔드에게 전송한다
      res.status(200).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

// 이메일 중복 확인 api
router.get('/user_email_check/:email', async (req, res, next) => {
  try {
    const user = await User.findOne({
      // 해당 이메일을 사용하는 개인 회원이 있는지 확인
      email: req.params.email,
    });
    if (user === null) {
      // 없으면 ok
      res.status(200).send('ok');
    } else {
      // 있으면 exit 를 프론트엔드에게 전송한다
      res.status(200).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

// 환자 확인 api
// 회원가입 페이지에서 자신과 연결한 환자이 고유 번호를 입력하면 환자가 존재하는지, 환자에 대한 데이터를 찾아 전송해주는 apiß
router.post('/patient_check', async (req, res, next) => {
  if (!req) return;
  try {
    // 해당 고유번호를 가진 환자가 존재하는지 확인
    const patient = await Patient.findOne({ pat_number: req.body.pat_number });
    if (patient === null) {
      // 환자가 존재하지 않을 때
      res.status(200).send('not exited patient');
    } else {
      // 고유번호 환자가 존재할 때
      const hospital = await Hospital.findOne({ _id: patient.hos_id });
      // 해당 고유번호를 가진 환자와 연관된 정보들을 프론트에게 전달해준다.
      const result = {
        pat_id: patient._id,
        hos_name: hospital.hos_name,
        pat_name: patient.pat_name,
        birth: JSON.stringify(patient.birth).split('T')[0].substring(1),
      };
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

// 개인 회원가입 api
router.post('/user', async (req, res, next) => {
  const { uid, password, email, username, sex, pat_id, relation } = req.body;

  try {
    // 전달받은 비밀번호를 암호화하여 저장한다.
    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      // 개인 회원 생성
      uid,
      email,
      username,
      sex,
      pwd: hash,
    });

    const patient = Patient.findOne({ _id: pat_id });

    await Relation.create({
      // 새로 생성된 개인과 환자의 관계를 따로 저장한다.
      pat_id,
      hos_id: patient.hos_id,
      user_id: user,
      relation,
    });

    const commonWord = await Commonword.findOne({
      pat_id,
    });

    const words = addPostposition(username.substr(1, 3));
    // 개인의 이름 데이터를 활용하여 phrase 값으로 사용할 데이터를 생성한다.

    // 이름 데이터를 활용한 키워드 저장
    if (commonWord === null) {
      await Commonword.create({
        pat_id,
        words,
      });
    } else {
      const preWords = commonWord.words;
      const updateWords = preWords.concat(words);
      await Commonword.updateOne(
        {
          pat_id,
        },
        { words: updateWords }
      );
    }
    // 회원가입이 성공했다는 것을 프론트에게 알려준다.
    res.status(200).send('join success');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
