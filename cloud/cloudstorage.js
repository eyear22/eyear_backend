// Google Cloud Storage 파일을 사용해 긴 오디오 파일 텍스트로 변환

// Imports the Google Cloud client library
const Speech = require('@google-cloud/speech');
const fs = require('fs');

// Creates a client
const client = new Speech.SpeechClient();
async function quickstart() {
  // The path to the remote LINEAR16 file
  //const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';
  const filename = '../uploads/nextlevel.1650285151213.mp3';

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    //uri: gcsUri,
    // 원래 cloud에 음성 파일을 업로드 후 그걸 불러와서 하는 형식.
    // 일단 테스트용으로 실행중입니다.
    content: fs.readFileSync(filename)
  };
  const config = {
    encoding: 'MP3',
    sampleRateHertz: 16000,
    languageCode: 'ko-KR',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
}
quickstart();