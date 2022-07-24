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

router.get('/detail/:noticeId', async (req, res, next) => {
  try {
    const notice = await Notice.findOne({
      notice_id: req.params.noticeId,
    });

    if (notice) {
      const formatDate = JSON.stringify(notice.createdAt).substr(1, 10);
      const result = {
        notice_id: notice.notice_id,
        title: notice.title,
        content: notice.content,
        createdAt: formatDate,
      };
      res.status(200).send(result);
    } else {
      res.status(204).send('not existed notice');
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
