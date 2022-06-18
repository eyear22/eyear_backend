// Imports the Google Cloud Video Intelligence library
const videoIntelligence = require('@google-cloud/video-intelligence');
const fs = require('fs');
const { intervalToDuration } = require('date-fns');
const keyword = require('../keywords/keywords');
const Text = require('../database/text_schema');
const Video = require('../database/video_schema');
const Keyword = require('../database/keyword_schema');
const Commonword = require('../database/commonword_schema');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

// Creates a client
const client = new videoIntelligence.VideoIntelligenceServiceClient();

// 파일 서버 업로드 api
// 자막 파일 업로드를 위해 필요한 subtitle 폴더 생성
try {
  fs.readdirSync('subtitle');
} catch (error) {
  console.error('subtitle 폴더가 없어 subtitle 폴더를 생성합니다.');
  // 폴더 생성
  fs.mkdirSync('subtitle');
}

// 편지쓰기 api에서 사용될 때, 필요한 인수 받아옴
async function analyzeVideoTranscript(filename, user_id, patient_id) {

  // STT 성능을 높이기 위해 DB에서 키워드 값 받아옴
  // 1. 환자 - 개인 가족 간 키워드
  const keywordsArray = await Keyword.findOne({
    user_id: user_id,
    pat_id: patient_id,
  });

  // 2. 환자와 관련된 개인의 고유 명사 키워드
  const commonWords = await Commonword.findOne({
    pat_id: patient_id,
  });

  // 키워드 배열을 합칠 변수
  let keyword_load = [];
  if (keywordsArray !== null) {
    keyword_load = keywordsArray.words;
  }

  if (commonWords !== null) {
    keyword_load.concat(commonWords.words);
  }

  // Google Cloud Storage 버킷에서 접근할 객체에 대한 Uri
  // STT를 사용하려면 Uri로 해야함.
  const gcsUri = `gs://swu_eyear/${filename}`;

  // STT 기능 실행을 위해 필요한 Context 변수
  const videoContext = {
    speechTranscriptionConfig: {
      sampleRateHertz: 2200,
      languageCode: 'ko-KR',
      enableAutomaticPunctuation: false,
      speechContexts: [
        {
          phrases: keyword_load,  // 키워드 입력
        },
      ],
    },
  };

  // STT 기능 실행
  // features에 SPEECH_TRANSCRIPTION을 입력해야함.
  const request = {
    inputUri: gcsUri,
    features: ['SPEECH_TRANSCRIPTION'],
    videoContext: videoContext,
  };

  // STT 기능 실행
  const [operation] = await client.annotateVideo(request);
  console.log('Waiting for operation to complete...');
  const [operationResult] = await operation.promise();

  // STT 결과 반환
  const annotationResults = operationResult.annotationResults[0];

  // 키워드 추출에 보낼 변수 선언
  var transcription = '';

  // 키워드 추출하기 쉽게 Array에서 String 형태로 변환
  for (const speechTranscription of annotationResults.speechTranscriptions) {
    for (const alternative of speechTranscription.alternatives) {
      transcription = transcription + alternative.transcript;
    }
  }

  // 파이썬 STT 결과 보내기
  keyword(transcription, user_id, patient_id);

  // 결과를 자막으로 변환하는 과정
  const allSentence = annotationResults.speechTranscriptions
    .map((speechTranscription) => {
      return speechTranscription.alternatives
        .map((alternative) => {
          const words = alternative.words ?? [];

          const groupOfTens = words.reduce((group, word, arr) => {
            return (
              // 글자 10개씩 끊어서 띄우기
              (arr % 10
                ? group[group.length - 1].push(word)
                : group.push([word])) && group
            );
          }, []);

          return groupOfTens.map((group) => {
            // 자막을 올리기 위해 필요한 VTT 형식에 맞게 타이밍 정보 추출
            // 자막이 시작하는 타이밍
            const stratOffset =
              parseInt(group[0].startTime.seconds ?? 0) +
              (group[0].startTime.nanos ?? 0) / 1000000000;

            // 자막이 끝나는 타이밍
            const endOffset =
              parseInt(group[group.length - 1].endTime.seconds ?? 0) +
              (group[group.length - 1].endTime.nanos ?? 0) / 1000000000;

            return {
              // 추출된 값 반환
              startTime: stratOffset,
              endTime: endOffset,
              sentence: group.map((word) => word.word).join(' '),
            };
          });
        })
        .flat();
    })
    .flat();

  // 앞에서 반환된 정보를 바탕으로 VTT 형식에 텍스트 입력
  const subtitleContent = allSentence
    .map((sentence, index) => {
      const startTime = intervalToDuration({
        start: 0,
        end: sentence.startTime * 1000,
      });
      const endTime = intervalToDuration({
        start: 0,
        end: sentence.endTime * 1000,
      });

      return `${index + 1}\n${startTime.hours}:${startTime.minutes}:${
        startTime.seconds
      }.000 --> ${endTime.hours}:${endTime.minutes}:${endTime.seconds}.000\n${
        sentence.sentence
      }`;
    })
    .join('\n\n');

  const vttname = filename.split('.')[0];
  const subtitlePath = `./subtitle/${vttname}.vtt`;

  // 다 생성한 vtt 파일을 로컬에 임시 저장
  await fs.writeFile(subtitlePath, subtitleContent, function (error) {
    //function(error) 추가해야 함
    console.log('write end!');
  });

  // 임시 저장한 파일을 GCS에 해당 객체 업로드
  await storage.bucket('swu_eyear').upload(subtitlePath, {
    destination: `subtitle/${vttname}.vtt`,
  });

  // DB 저장 준비 - 연관된 비디오의 id를 들고옴
  const video = await Video.findOne({
    video: filename,
  });

  // 자막 파일 DB 생성
  await Text.create({
    vid: `${video.video_id}`,
    text: `${vttname}.vtt`,
  });

  // Google Cloud Storage에 업로드 완료하면 로컬에 저장된 파일 삭제
  fs.unlink(subtitlePath, function (err) {
    if (err) {
      console.log('Error : ', err);
    }
  });
}

module.exports = analyzeVideoTranscript;
