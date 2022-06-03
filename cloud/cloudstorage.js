
// Imports the Google Cloud Video Intelligence library
const videoIntelligence = require('@google-cloud/video-intelligence');
const fs = require('fs');
const { intervalToDuration } = require('date-fns');
const keyword = require('../keywords/keywords');
const Text = require('../database/text_schema');
const Video = require('../database/video_schema');
const Keyword = require('../database/keyword_schema');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

// Creates a client
const client = new videoIntelligence.VideoIntelligenceServiceClient();


// 파일 서버 업로드 api
try {
    fs.readdirSync('subtitle');
  } catch (error) {
    console.error('subtitle 폴더가 없어 subtitle 폴더를 생성합니다.');
    // 폴더 생성
    fs.mkdirSync('subtitle');
  }

// DB에 해당 값 받아오려면 인수 변경해야함
async function analyzeVideoTranscript(filename, user_id, patient_id) {
  const keywordsArray = await Keyword.findOne({
    user_id: user_id,
    patient_id: patient_id
  });

  console.log(keywordsArray.words);
  let keyword_load = []
  if(keywordsArray != null){
    keyword_load = keywordsArray.words;
  }


  const gcsUri = `gs://swu_eyear/${filename}`;
  const videoContext = {
    speechTranscriptionConfig: {
        sampleRateHertz: 2200,
        languageCode: 'ko-KR',
      enableAutomaticPunctuation: true, //자동 구두점 활성화
      speechContexts: [{
          phrases: keyword_load
        }],
    },
  };

  const request = {
    inputUri: gcsUri,
    features: ['SPEECH_TRANSCRIPTION'],
    videoContext: videoContext,
  };

  const [operation] = await client.annotateVideo(request);
  console.log('Waiting for operation to complete...');
  const [operationResult] = await operation.promise();

  const annotationResults = operationResult.annotationResults[0];

  // 키워드 추출에 보낼 변수 선언
  var transcription = '';
  for (const speechTranscription of annotationResults.speechTranscriptions) {

    for (const alternative of speechTranscription.alternatives) {
      transcription = transcription + alternative.transcript;
    }
  }

  // 파이썬 파일에 보내기
  keyword(transcription, user_id, patient_id);

  const allSentence = annotationResults.speechTranscriptions
  .map((speechTranscription) => {
    return speechTranscription.alternatives
    .map((alternative) => {
      const words = alternative.words ?? [];

      const groupOfTens = words.reduce((group, word, arr) => {
        return (
          // 글자 10개씩 끊어서 문장 만들기
          (arr % 10
            ? group[group.length - 1].push(word)
            : group.push([word])) && group
        );
      }, []);

      return groupOfTens.map((group) => {
        const stratOffset = parseInt(group[0].startTime.seconds ?? 0) + (group[0].startTime.nanos ?? 0) / 1000000000;

        const endOffset = parseInt(group[group.length - 1].endTime.seconds ?? 0) + (group[group.length -1].endTime.nanos ?? 0) /1000000000;
        
        return {
          startTime: stratOffset,
          endTime: endOffset,
          sentence: group.map((word) => word.word).join(" "),
        };
      });
    }).flat();
  }).flat();

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

    return `${index  +  1}\n${startTime.hours}:${startTime.minutes}:${startTime.seconds},000 --> ${endTime.hours}:${endTime.minutes}:${endTime.seconds},000\n${sentence.sentence}`;
  }).join("\n\n");

  const vttname = filename.split('.')[0];  
  const subtitlePath = `./subtitle/${vttname}.vtt`;

  // 다 생성한 vtt 파일을 로컬에 임시 저장
  await fs.writeFile(subtitlePath, subtitleContent, function(error) { //function(error) 추가해야 함
    console.log('write end!');
  });

  // 임시 저장한 파일을 GCS에 해당 객체 업로드
  await storage.bucket('swu_eyear').upload(subtitlePath, {
    destination: `subtitle/${vttname}.vtt`,
  });

  // DB 저장 준비 - 연관된 비디오의 id를 들고옴
  const video = await Video.findOne(
    {
      video: filename,
    }
  );

  // 자막 파일 DB 생성
  await Text.create({
    vid: `${video.video_id}`,
    text: `${vttname}.vtt`,
  });

  fs.unlink(subtitlePath, function(err){
    if(err) {
      console.log("Error : ", err)
    }
  })
}


module.exports = analyzeVideoTranscript;