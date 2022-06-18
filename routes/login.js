const express = require('express');
const passport = require('passport');

const router = express.Router();

// 로그인 구현 코드
router.post('/', async (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    // 작성한 local 전략 수행
    // 전략 수행 후 authenticate의 콜백 함수가 실행된다.
    if (authError) {
      // 전략 수행에서 에러가 있었을 경우
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      // 사용자가 없거나 비밀번호가 틀린 경우
      return res.status(400).send(info);
    }

    return req.login(user, (loginError) => {
      // 사용자가 존재하며 비밀번호가 일치할 경우
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.status(200).send({ user, flag: info }); // 프론트엔드에 해당 사용자 정보와 병원인지 개인 회원인지를 확인할 수 있는 flag 값을 전송한다.
    });
  })(req, res, next);
});

module.exports = router;
