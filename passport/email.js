const nodemailer = require('nodemailer');

const transPort = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail=.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILS_EMAIL,
    pass: process.env.MAILS_PWD,
  },
});

module.exports = transPort;
