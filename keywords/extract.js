const { spawnSync } = require('child_process');

const cutRatio = 0.5; // 추출 키워드 저장 제한 비율

function extract(text) {
  const resultWords = [];
  const resultRanks = [];
  try {
    const result = spawnSync('python', ['extract.py', text]);
    const data = result.stdout;
    let keywords = data.toString('utf8');
    keywords = keywords.slice(1, -3);

    const regExp = /\(([^)]+)\)/;
    const keywordsArray = keywords.split(regExp);

    let i = 0;
    keywordsArray.forEach((value, index) => {
      if (index % 2 === 1) {
        const temp = value.split(', ');
        if (Number(temp[1]) > cutRatio) {
          // 일정 비율 이하 키워드는 저장하지 않음
          resultWords[i] = temp[0].slice(1, -1);
          resultRanks[i] = Number(temp[1]);
          i += 1;
        }
      }
    });
    const extractResult = { resultWords, resultRanks };
    return extractResult;
  } catch (error) {
    console.log(error);
  }
}

console.log(
  extract(
    '수영 수영이 수영이는 잘지내 수영이는 요즘 뭐하니 수영이랑 다음에 같이 와'
  )
);
