const fs = require('fs');
const path = require('path');
const https = require('https');

const audioDir = path.join(__dirname, '..', 'public', 'audio', 'emergency');

const phrases = [
  { id: 'need_help', text_en: 'I need help', text_ta: 'எனக்கு உதவி தேவை' },
  { id: 'ambulance', text_en: 'Call an ambulance', text_ta: 'ஆம்புலன்ஸை அழைக்கவும்' },
  { id: 'hospital', text_en: 'Where is the hospital?', text_ta: 'மருத்துவமனை எங்கே இருக்கிறது?' },
  { id: 'deaf_hearing', text_en: 'I am deaf or hard of hearing', text_ta: 'நான் காது கேளாதவர்' },
  { id: 'emergency', text_en: 'There is an emergency', text_ta: 'இங்கே ஒரு அவசர நிலை உள்ளது' },
  { id: 'contact_family', text_en: 'Please contact my family', text_ta: 'எனது குடும்பத்தினரை தொடர்பு கொள்ளவும்' }
];

// Tiny 1-second silent MP3 base64 buffer for mock placeholders
const SILENT_MP3_BUF = Buffer.from(
  '//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAMAAAMSAAAAcAACcQAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'base64'
);

async function generateAudio() {
  console.log('Starting Emergency Audio Pre-cache Generation...');
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_TRANSLATION_API_KEY;

  if (!apiKey) {
    console.warn('WARNING: GOOGLE_TTS_API_KEY is not set. Generating silent placeholder MP3s for build-safety...');
    
    for (const phrase of phrases) {
      fs.writeFileSync(path.join(audioDir, `${phrase.id}_ta.mp3`), SILENT_MP3_BUF);
      fs.writeFileSync(path.join(audioDir, `${phrase.id}_en.mp3`), SILENT_MP3_BUF);
    }
    console.log('Successfully generated offline silent dummy files in:', audioDir);
    return;
  }

  console.log('GCP credentials detected. Querying Google Cloud TTS for premium cached voices...');
  
  for (const phrase of phrases) {
    try {
      console.log(`Synthesizing: "${phrase.text_ta}"...`);
      await fetchGoogleTts(phrase.text_ta, 'ta-IN', 'ta-IN-Neural2-A', path.join(audioDir, `${phrase.id}_ta.mp3`), apiKey);
      
      console.log(`Synthesizing: "${phrase.text_en}"...`);
      await fetchGoogleTts(phrase.text_en, 'en-US', 'en-US-Neural2-F', path.join(audioDir, `${phrase.id}_en.mp3`), apiKey);
    } catch (err) {
      console.error(`Failed to synthesize phrase ${phrase.id}:`, err.message);
      console.log('Writing fallback silence...');
      fs.writeFileSync(path.join(audioDir, `${phrase.id}_ta.mp3`), SILENT_MP3_BUF);
      fs.writeFileSync(path.join(audioDir, `${phrase.id}_en.mp3`), SILENT_MP3_BUF);
    }
  }

  console.log('Finished emergency pre-cache audio generation.');
}

function fetchGoogleTts(text, languageCode, voiceName, outputPath, key) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 }
    });

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode !== 200 || !result.audioContent) {
            return reject(new Error(result.error?.message || 'TTS request failed'));
          }
          const buf = Buffer.from(result.audioContent, 'base64');
          fs.writeFileSync(outputPath, buf);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

generateAudio().catch(err => {
  console.error('Fatal generator error:', err);
});
