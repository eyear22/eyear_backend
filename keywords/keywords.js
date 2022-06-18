// 문맥 속 중요 키워드를 추출하는 동작을 하는 파일

const Keyword = require('../database/keyword_schema');

const { ObjectId } = require('mongodb');
const { spawn } = require('child_process'); // node.js로 구성된 서버에서 python 파일을 실행하기 위해 사용하는 모듈
// 자식 프로세스를 생성하여 다른 언어로 작성된 파일을 실행할 수 있다.

// 문맥 속 중요 키워드 추출 함수
function extract(text, user_id, pat_id) {
  // 인자로 받은 text에서 중요 키워드를 추출한 뒤 Keyword 데이터베이스에 가족 개인의 정보, 환자의 정보와 함께 저장한다.
  let resultWords = [];
  let resultRanks = [];
  const cutRatio = 0.3; // 키워드 추출 후 어느정도의 중요도를 가진 키워드까지 저장할 것인가에 대한 한계값 (0.3 이하의 중요도를 가진 키워드는 저장하지 않음)
  const updateRatio = 0.95; // 새로운 영상이 들어와 키워드를 업데이트할 때 사용하는 시간 가중치 값
  const result = spawn('python', ['extract.py', text]); // child_process의 spawn 함수를 사용하여 자식 프로세스를 생성하고 extract.py 파일을 실행시킨다. (비동기 실행)
  result.stdout.on('data', (data) => {
    // 파이썬 파일의 출력 결과를 data 인자로 받아 원하는 형태로 가공한다.
    let keywords = data.toString('utf8'); // 한글 데이터이기 때문에 utf-8로 변환해준다.
    keywords = keywords.slice(1, -3); // 출력 결과의 필요없는 부분 (예를들어 [ ] 같은 괄호 문자)을 삭제한다.

    const regExp = /\(([^)]+)\)/;
    const keywordsArray = keywords.split(regExp);

    let i = 0;

    // 데이터베이스에 저장할 최종 키워드와 중요도 값을 선별한다.
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
  });

  // 파이썬 실행이 끝난 뒤
  result.on('close', async (code) => {
    if (code === 0) {
      console.log('extract success');
      try {
        // 이전에 환자와 개인 사이에 저장되어 있는 키워드를 찾는다
        const preKeyword = await Keyword.findOne({
          user_id: new ObjectId(user_id),
          pat_id: new ObjectId(pat_id),
        });

        if (preKeyword === null) {
          // 환자와 개인 사이에 저장되어 있는 키워드가 없을 경우 즉, 첫번째 영상을 전송하였을 경우
          console.log('keyword create');
          const newKeywords = await Keyword.create({
            // 키워드 생성
            user_id: new ObjectId(user_id),
            pat_id: new ObjectId(pat_id),
            words: resultWords,
            rank: resultRanks,
          });
          return;
        }
        // 키워드 업데이트 진행
        let preRank = preKeyword.rank;
        preRank.forEach((value, index) => {
          // 이전에 저장되어 있던 키워드에 시간 가중치 값을 곱하여 중요도를 낮춘다.
          preRank[index] = value * updateRatio;
        });

        const preWords = preKeyword.words;
        resultWords.forEach((value, index) => {
          const i = preWords.indexOf(value);
          if (i !== -1) {
            // 동일 키워드 존재할 경우에는 더 큰 중요도로 저장한다.
            if (resultRanks[index] >= preRank[i]) {
              preRank.splice(i, 1);
              preWords.splice(i, 1);
            } else {
              resultRanks.splice(index, 1);
              resultWords.splice(index, 1);
            }
          }
        });

        const updateRanks = preRank.concat(resultRanks);
        updateRanks.sort((a, b) => b - a); // 내림차순 정렬

        // 이전의 키워드와 새로 생성된 키워드를 비교하여 저장한다.
        const updateWords = [];
        updateRanks.forEach((value1, index1) => {
          if (value1 - cutRatio > 0) {
            preRank.forEach((value2, index2) => {
              if (value1 === value2) {
                updateWords[index1] = preKeyword.words[index2];
              }
            });

            resultRanks.forEach((value3, index3) => {
              if (value1 === value3) {
                updateWords[index1] = resultWords[index3];
              }
            });
          }
        });

        // updateRanks - Rank 값 3.0 이하는 다 자르기
        updateRanks.forEach((value, index) => {
          if (value < cutRatio) {
            updateRanks.length =
              updateRanks.length - (updateRanks.length - index);
          }
        });

        try {
          // 저장한 키워드로 DB에 저장된 키워드 업데이트를 진행한다.
          const finish = await Keyword.updateOne(
            {
              user_id: new ObjectId(user_id),
              pat_id: new ObjectId(pat_id),
            },
            { words: updateWords, rank: updateRanks }
          );
          console.log('keyword update success');
          return finish;
        } catch (err) {
          return err;
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('프로세스 종료:', code);
    }
  });
}

module.exports = extract;
