const express = require('express');

const router = express.Router();
const { isLoggedIn } = require('./middlewares');
const Notice = require('../database/notice_schema');

// 공지사항 글 작성
router.post('/', isLoggedIn, async (req, res, next) => {
  try {
    const id = req.session.passport.user;

    const { title, content } = req.body;

    const notice = await Notice.create({
      title,
      content,
      hos_id: id,
    });

    res.status(200).send(`${notice.notice_id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
