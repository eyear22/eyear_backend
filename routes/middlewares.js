// 요청이 있을때 로그인을 했는지 안했는지 확인할 수 있는 코드

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send('required login');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    // 로그인 한 상태입니다
  }
};
