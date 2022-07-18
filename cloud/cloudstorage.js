// Imports the Google Cloud Video Intelligence library
const videoIntelligence = require('@google-cloud/video-intelligence');
const fs = require('fs');
const { format, parseISO, intervalToDuration } = require('date-fns');
const keyword = require('../keywords/keywords');
const Keyword = require('../database/keyword_schema');
const Commonword = require('../database/commonword_schema');
const ffmpeg = require('fluent-ffmpeg');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);
const input_path = 'input.mp4';
const output_path = 'output.mp4';

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
async function analyzeVideoTranscript(filename, user_id, patient_id, file) {
  const keywordsArray = await Keyword.findOne({
    user_id: user_id,
    pat_id: patient_id,
  });

  const commonWords = await Commonword.findOne({
    pat_id: patient_id,
  });

  let keyword_load = [];
  if (keywordsArray !== null) {
    keyword_load = keywordsArray.words;
  }

  if (commonWords !== null) {
    keyword_load.concat(commonWords.words);
  }

  const gcsUri = `gs://swu-eyear/${filename}`;
  const videoContext = {
    speechTranscriptionConfig: {
      sampleRateHertz: 2200,
      languageCode: 'ko-KR',
      enableAutomaticPunctuation: true, // 자동 구두점 활성화
      speechContexts: [
        {
          phrases: keyword_load,
        },
      ],
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

  // // 파이썬 파일에 보내기
  // keyword(transcription, user_id, patient_id);

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
            const stratOffset =
              parseInt(group[0].startTime.seconds ?? 0) +
              (group[0].startTime.nanos ?? 0) / 1000000000;

            const endOffset =
              parseInt(group[group.length - 1].endTime.seconds ?? 0) +
              (group[group.length - 1].endTime.nanos ?? 0) / 1000000000;

            return {
              startTime: stratOffset,
              endTime: endOffset,
              sentence: group.map((word) => word.word).join(' '),
            };
          });
        })
        .flat();
    })
    .flat();

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

      startTime.hours = (startTime.hours<10) ? `0${startTime.hours}` : `${startTime.hours}`;
      startTime.minutes = (startTime.minutes<10) ? `0${startTime.minutes}` : `${startTime.minutes}`;
      startTime.seconds = (startTime.seconds<10) ? `0${startTime.seconds}` : `${startTime.seconds}`;

      endTime.hours = (endTime.hours<10) ? `0${endTime.hours}` : `${endTime.hours}`;
      endTime.minutes = (endTime.minutes<10) ? `0${endTime.minutes}` : `${endTime.minutes}`;
      endTime.seconds = (endTime.seconds<10) ? `0${endTime.seconds}` : `${endTime.seconds}`;

      return `${index + 1}\n${startTime.hours}:${startTime.minutes}:${
        startTime.seconds
      },000 --> ${endTime.hours}:${endTime.minutes}:${endTime.seconds},000\n${
        sentence.sentence
      }`;
    })
    .join('\n\n');

  const vttname = filename.split('.')[0];
  const subtitlePath = `${vttname}.srt`;

  // 다 생성한 srt 파일을 로컬에 임시 저장
  await fs.writeFile(subtitlePath, subtitleContent, function (error) {
    //function(error) 추가해야 함
    console.log('write end!');
  });

  // 영상 파일을 로컬에 받아옴
  await fs.writeFile('input.mp4', file.buffer, function (error) {
    //function(error) 추가해야 함
    console.log('save input');
  });

  // 현재 영상 파일과 자막 파일 합치기 - 로컬
  await ffmpeg(input_path)
    .videoCodec('libx264')
    .size('1280x720')
    .outputOptions([
      `-vf subtitles=${subtitlePath}`,
      '-movflags faststart'
    ])
    .save(output_path)
    .on('error', function(err){
      console.log('An error occurred:' + err.message);
    })
    .on('end', function(){
      console.log("Processing finished!");
      fs.unlink(subtitlePath, function (err) {
        if (err) {
          console.log('Error : ', err);
        }else{
          console.log('삭제 완료!');
        }
      });
      // 영상 파일을 로컬에 받아옴
      fs.readFile(output_path, function (error, data) {
        if(error){
          console.error(error);
        }
        
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream();
    
    
        blobStream.on('error', (err) => {
          console.error(err);
        });
    
        // 업로드 실행
        blobStream.end(data);
      });
    })
}

module.exports = analyzeVideoTranscript;
