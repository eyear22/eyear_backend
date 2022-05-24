
// Imports the Google Cloud Video Intelligence library
const videoIntelligence = require('@google-cloud/video-intelligence');
const fs = require('fs');
const { intervalToDuration } = require('date-fns');

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

const gcsUri = 'gs://swu_eyear/할머니2.mp4';

async function analyzeVideoTranscript() {
  const videoContext = {
    speechTranscriptionConfig: {
        sampleRateHertz: 1600,
        languageCode: 'ko-KR',
      enableAutomaticPunctuation: true, //자동 구두점 활성화
      speechContexts: [{
          phrases: ["한율 조금 저렴하거든요", "박막례입니다", "팁이야"]
        }],
    },
  };

  const request = {
    inputUri: gcsUri,
    features: ['SPEECH_TRANSCRIPTION'],
    videoContext: videoContext,
    // 이게 되는 건지 확인 불가!
  };

  const [operation] = await client.annotateVideo(request);
  console.log('Waiting for operation to complete...');
  const [operationResult] = await operation.promise();
  // There is only one annotation_result since only
  // one video is processed.
  const annotationResults = operationResult.annotationResults[0];

  // 파이썬 파일에 보내기
  // annotationResults.speechTranscriptions

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
  const subtitlePath = `../subtitle/subtitle.vtt`;
  await  fs.writeFile(subtitlePath,  subtitleContent, function(error) { //function(error) 추가해야 함
    console.log('write end!');
    });
}

analyzeVideoTranscript();