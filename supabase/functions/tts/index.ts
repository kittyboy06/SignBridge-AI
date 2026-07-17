import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Tiny 1-second silent MP3 encoded in Base64 (to serve as an immediate play-success trigger for mock modes)
const SILENT_MP3_BASE64 = 
  '//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAMAAAMSAAAAcAACcQAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      languageCode = 'ta-IN', 
      voiceGender = 'FEMALE', 
      speakingRate = 1.0, 
      pitch = 0.0,
      voiceTier = 'NEURAL2' 
    } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY') || Deno.env.get('GOOGLE_TRANSLATION_API_KEY');

    // MOCK MODE FALLBACK: If no key, return silent mp3 and a mock flag
    if (!apiKey) {
      console.warn('GOOGLE_TTS_API_KEY environment variable is not set. Running in MOCK mode...');
      
      return new Response(
        JSON.stringify({ 
          audioContent: SILENT_MP3_BASE64, 
          isMock: true,
          mockText: text
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine voice name prefix based on tier and gender
    // For Tamil (ta-IN):
    // Standard: ta-IN-Standard-A (Female), ta-IN-Standard-B (Male)
    // WaveNet: ta-IN-Wavenet-A (Female), ta-IN-Wavenet-B (Male)
    // Neural2: ta-IN-Neural2-A (Female), ta-IN-Neural2-B (Male)
    let voiceName = '';
    const genderSuffix = voiceGender === 'MALE' ? 'B' : 'A';
    
    if (voiceTier === 'NEURAL2') {
      voiceName = `${languageCode}-Neural2-${genderSuffix}`;
    } else if (voiceTier === 'WAVENET') {
      voiceName = `${languageCode}-Wavenet-${genderSuffix}`;
    } else {
      voiceName = `${languageCode}-Standard-${genderSuffix}`;
    }

    // Call Google Cloud TTS API
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: voiceGender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Google TTS API failed');
    }

    return new Response(JSON.stringify({ audioContent: result.audioContent, isMock: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
