const Keyword = require('../database/keyword_schema');

const { ObjectId } = require('mongodb');
const { spawn } = require('child_process');

function extract(text, user_id, pat_id) {
  let resultWords = [];
  let resultRanks = [];
  const cutRatio = 0.28;
  const updateRatio = 0.95;
  const result = spawn('python', ['extract.py', text]);
  result.stdout.on('data', (data) => {
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
  });

  result.on('close', async (code) => {
    if (code === 0) {
      console.log('extract success');
      try {
        // 업데이트 키워드 찾기
        const preKeyword = await Keyword.findOne({
          user_id: new ObjectId(user_id),
          pat_id: new ObjectId(pat_id),
        });

        if (preKeyword === null) {
          // 첫번째 키워드일 때
          console.log('keyword create');
          const newKeywords = await Keyword.create({
            user_id: new ObjectId(user_id),
            pat_id: new ObjectId(pat_id),
            words: resultWords,
            rank: resultRanks,
          });
          return;
        }

        let preRank = preKeyword.rank;
        preRank.forEach((value, index) => {
          preRank[index] = value * updateRatio;
        });

        const updateRanks = preRank.concat(resultRanks);
        updateRanks.sort((a, b) => b - a); // 내림차순 정렬

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
          if(value < cutRatio){
            updateRanks.length = updateRanks.length - (updateRanks.length - index);
          }
        });
        

        try {
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