// Imports the Google Cloud Video Intelligence library
const videoIntelligence = require('@google-cloud/video-intelligence');

// Creates a client
const client = new videoIntelligence.VideoIntelligenceServiceClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
const gcsUri = 'gs://swu_eyear/할머니2.mp4';

async function analyzeVideoTranscript() {
  const videoContext = {
    speechTranscriptionConfig: {
        sampleRateHertz: 1600,
        languageCode: 'ko-KR',
      enableAutomaticPunctuation: true, //자동 구두점 활성화
      speechContexts: [{
          phrases: ["한율 조금 저렴하거든요", "박막례입니다"]
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

  for (const speechTranscription of annotationResults.speechTranscriptions) {
    // The number of alternatives for each transcription is limited by
    // SpeechTranscriptionConfig.max_alternatives.
    // Each alternative is a different possible transcription
    // and has its own confidence score.
    for (const alternative of speechTranscription.alternatives) {
      console.log('Alternative level information:');
      console.log(`Transcript: ${alternative.transcript}`);
      console.log(`Confidence: ${alternative.confidence}`);

      
      console.log('Word level information:');
      for (const wordInfo of alternative.words) {
        const word = wordInfo.word;
        const start_time =
          wordInfo.startTime.seconds + wordInfo.startTime.nanos * 1e-9;
        const end_time =
          wordInfo.endTime.seconds + wordInfo.endTime.nanos * 1e-9;
        console.log('\t' + start_time + 's - ' + end_time + 's: ' + word);
      }
      

    }
  }
}

analyzeVideoTranscript();