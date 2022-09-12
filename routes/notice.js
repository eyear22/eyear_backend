const express = require('express');

const router = express.Router();
const Notice = require('../database/notice_schema');

// 공지사항 글 작성
router.post('/', async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const notice = await Notice.create({
      title,
      content,
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

// 공지사항 리스트
router.get('/all', async (req, res, next) => {
  try {
    const notices = await Notice.find({}).sort({ _id: -1 });

    if (notices.length !== 0) {
      const result = notices.map((notice) => {
        const formatDate = JSON.stringify(notice.createdAt).substr(1, 10);
        return {
          notice_id: notice.notice_id,
          title: notice.title,
          content: notice.content,
          createdAt: formatDate,
        };
      });
      res.status(200).send(result);
    } else {
      res.status(204).send('empty notice list');
    }
  } catch (err) {
    next(err);
  }
});

router.patch('/:noticeId', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const { noticeId } = req.params;

    const notice = await Notice.findOne({
      notice_id: noticeId,
    });

    if (notice) {
      await Notice.updateOne(notice, { title, content });
      res.status(200).send(noticeId);
    } else {
      res.status(404).send('not existed notice');
    }
  } catch (err) {
    next(err);
  }
});

router.delete('/:noticeId', async (req, res, next) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findOne({
      notice_id: noticeId,
    });

    if (notice) {
      await Notice.deleteOne(notice);
      res.status(200).send(noticeId);
    } else {
      res.status(404).send('not existed notice');
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
