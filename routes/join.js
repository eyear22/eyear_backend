const express = require('express');

const bcrypt = require('bcrypt');
const transPort = require('../passport/email');
const User = require('../database/user_schema');
const Patient = require('../database/patient_schema');
const Hospital = require('../database/hospital_schema');
const Relation = require('../database/relationship_schema');
const Commonword = require('../database/commonword_schema');
const addPostposition = require('../keywords/nounKeywords');

const router = express.Router();

router.get('/user_id_check/:uid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      uid: req.params.uid,
    });
    if (user === null) {
      res.status(200).send('ok');
    } else {
      res.status(400).send('exit');
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
      res.status(400).send('exit');
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

    const commonWord = await Commonword.findOne({
      pat_id,
    });

    const words = addPostposition(username.substr(1, 3));

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

    res.status(200).send('join success');
  } catch (error) {
    next(error);
  }
});

router.get('/business_id_check/:hid', async (req, res, next) => {
  try {
    const hos = await Hospital.findOne({
      hid: req.params.hid,
    });
    if (hos === null) {
      res.status(200).send('ok');
    } else {
      res.status(400).send('exit');
    }
  } catch (err) {
    next(err);
  }
});

const generateRandom = (min, max) => {
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
};

router.get('/email_check/:email', async (req, res, next) => {
  try {
    const exHos = await Hospital.findOne({
      email: req.params.email,
    });

    if (exHos === null) {
      const number = generateRandom(111111, 999999);

      const mailOptions = {
        from: `Eyear <${process.env.MAILS_EMAIL}>`,
        to: req.params.email,
        subject: '회원가입 인증 메일입니다.',
        text: `인증 코드: ${number}`,
      };

      transPort.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
          res.status(402);
          next(error);
        }
      });
      res.status(200).send(`${number}`);
    } else {
      res.status(400).send('exit');
    }
  } catch (err) {
    res.status(402);
    next(err);
  }
});

router.post('/business', async (req, res, next) => {
  const { hid, password, hos_name, address, hos_number, email } = req.body;

  const hash = await bcrypt.hash(password, 12);

  try {
    const hospital = await Hospital.create({
      hid,
      pwd: hash,
      hos_name,
      address,
      hos_number,
      email,
    });

    res.status(200).send('join success');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
