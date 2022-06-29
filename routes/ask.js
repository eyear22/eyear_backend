const express = require('express');
const transPort = require('../passport/email');

const router = express.Router();

// 문의사항 전송 api
router.post('', async (req, res, next) => {
  if (!req) return;
  try {
    const mailOptions = {
      from: `Eyear <${process.env.MAILS_EMAIL}>`,
      to: 'swueyear@gmail.com',
      subject: `[고객 문의 사항] ${req.body.title}`,
      text: `회신 이메일: ${req.body.email} \n[문의 내용] \n${req.body.content}`,
    };

    transPort.sendMail(mailOptions, (error) => {
      res.status(402).send('send mail error');
      throw error;
    });
    res.status(200).send('success');
  } catch (err) {
    res.status(402).send('send mail error');
    next(err);
  }
});

module.exports = router;
