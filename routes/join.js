const express = require('express');

const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const Hospital = require('../database/hospital_schema');
const Relation = require('../database/relationship_schema');
const router = express.Router();

router.get('/business', (req, res) => {
  res.send('기관 회원가입 페이지');
});

router.get('/done', (req, res) => {
  res.send('회원가입 완료 페이지');
});

router.get('/user_id_check/:uid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      uid: req.params.uid,
    });
    if (user === null) {
      res.status(200).send('ok');
    } else {
      res.status(200).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

router.get('/user_email_check/:email', async (req, res, next) => {
  try {
    const user = await User.findOne({
      email: req.params.email,
    });
    if (user === null) {
      res.status(200).send('ok');
    } else {
      res.status(200).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

router.post('/patient_check', async (req, res, next) => {
  if (!req) return;
  try {
    const patient = await Patient.findOne({ pat_number: req.body.pat_number });
    if (patient === null) {
      res.status(200).send('not exited patient');
    } else {
      const hospital = await Hospital.findOne({ _id: patient.hos_id });
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

router.post('/user', async (req, res, next) => {
  const { uid, password, email, username, sex, pat_id, relation } = req.body;

  try {
    const hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      uid,
      email,
      username,
      sex,
      pwd: hash,
    });

    const patient = Patient.findOne({ _id: pat_id });

    await Relation.create({
      pat_id,
      hos_id: patient.hos_id,
      user_id: user,
      relation,
    });

    res.status(200).send('join success');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
