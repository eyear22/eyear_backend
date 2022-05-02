// Google Cloud Storage 파일을 사용해 긴 오디오 파일 텍스트로 변환

// Imports the Google Cloud client library
const Speech = require('@google-cloud/speech');

// Creates a client
const client = new Speech.SpeechClient();
  // The path to the remote LINEAR16 file
  const gcsUri = 'gs://eyear_speech/개념1.mp3';
  async function quickstart() {
  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    //uri: gcsUri,
    // 원래 cloud에 음성 파일을 업로드 후 그걸 불러와서 하는 형식.
    // 일단 테스트용으로 실행중입니다.
    uri: gcsUri
  };

  const config = {
    encoding: 'mp3',
    sampleRateHertz: 1600,
    languageCode: 'ko-KR',
    speechContexts: [{
      phrases: ["수직적 부분 집합입니다"]
    }]
  };

  const request = {
    audio: audio,
    config: config,
  };

// Detects speech in the audio file. This creates a recognition job that you
// can wait for now, or get its result later.
const [operation] = await client.longRunningRecognize(request);
// Get a Promise representation of the final result of the job
const [response] = await operation.promise();
const transcription = response.results
  .map(result => result.alternatives[0].transcript)
  .join('\n');
console.log(`Transcription: ${transcription}`);
}
quickstart();