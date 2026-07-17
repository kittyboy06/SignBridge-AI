import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gemini-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Map friendly language names to ISO codes for mock dictionary compatibility
const langCodeMap: Record<string, string> = {
  'English': 'en',
  'Tamil': 'ta',
  'Hindi': 'hi'
};

const tamilMocks: Record<string, string> = {
  'good morning how are you': 'காலை வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'good morning how are you?': 'காலை வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'i need some water': 'எனக்கு கொஞ்சம் தண்ணீர் வேண்டும்.',
  'i need some water.': 'எனக்கு கொஞ்சம் தண்ணீர் வேண்டும்.',
  'where is the hospital': 'மருத்துவமனை எங்கே இருக்கிறது?',
  'where is the hospital?': 'மருத்துவமனை எங்கே இருக்கிறது?',
  'i need help': 'எனக்கு உதவி தேவை',
  'i need help.': 'எனக்கு உதவி தேவை',
  'call an ambulance': 'ஆம்புலன்ஸை அழைக்கவும்',
  'call an ambulance.': 'ஆம்புலன்ஸை அழைக்கவும்',
  'i am deaf': 'நான் காது கேளாதவர்',
  'there is an emergency': 'இங்கே ஒரு அவசர நிலை உள்ளது',
  'please contact my family': 'எனது குடும்பத்தினரை தொடர்பு கொள்ளவும்',
  'thank you': 'நன்றி',
  'yes': 'ஆம்',
  'no': 'இல்லை'
};

const hindiMocks: Record<string, string> = {
  'good morning how are you': 'शुभ प्रभात, आप कैसे हैं?',
  'good morning how are you?': 'शुभ प्रभात, आप कैसे हैं?',
  'i need some water': 'मुझे थोड़ा पानी चाहिए।',
  'i need some water.': 'मुझे थोड़ा पानी चाहिए।',
  'where is the hospital': 'अस्पताल कहाँ है?',
  'where is the hospital?': 'अस्पताल कहाँ है?',
  'i need help': 'मुझे मदद चाहिए',
  'call an ambulance': 'एम्बुलेंस बुलाओ'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = req.headers.get('x-gemini-api-key') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');

    // MOCK MODE FALLBACK: If no key, run locally cached translations
    if (!apiKey) {
      console.warn('Gemini API key is not set. Running translation in MOCK mode...');
      let translatedText = '';
      const textClean = text.trim().toLowerCase();
      const targetCode = langCodeMap[targetLang] || 'ta';

      if (targetCode === 'ta') {
        translatedText = tamilMocks[textClean] || tamilMocks[textClean + '.'] || `[Tamil Mock] ${text}`;
      } else if (targetCode === 'hi') {
        translatedText = hindiMocks[textClean] || hindiMocks[textClean + '.'] || `[Hindi Mock] ${text}`;
      } else {
        translatedText = `[Mocked ${targetLang}] ${text}`;
      }

      return new Response(JSON.stringify({ translatedText, isMock: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Gemini API to translate
    const prompt = `You are a professional sign language translator for the SignBridge AI application.
Translate the following text from ${sourceLang} to ${targetLang}.
Provide a natural, clear translation that perfectly conveys the meaning.

Output ONLY a JSON object matching the requested schema.`;

    let modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-3-pro-preview',
      'gemini-pro-latest'
    ];

    try {
      const modelsListUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const modelsListRes = await fetch(modelsListUrl);
      if (modelsListRes.ok) {
        const modelsData = await modelsListRes.json();
        const apiModels = modelsData.models
          ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || [];
        
        if (apiModels.length > 0) {
          const matched = modelsToTry.filter(m => apiModels.includes(m));
          const unmatched = apiModels.filter((m: string) => !modelsToTry.includes(m));
          modelsToTry = [...matched, ...unmatched];
        }
      }
    } catch (e) {
      console.warn('Failed to query models list in translate:', e.message);
    }

    let translatedText = '';
    let apiSuccess = false;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting Gemini translation with model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Translate text: "${text}"` }]
            }],
            systemInstruction: {
              parts: [{ text: prompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  translatedText: {
                    type: 'STRING',
                    description: 'The natural translation of the input text into the target language.'
                  }
                },
                required: ['translatedText']
              },
              temperature: 0.1,
              maxOutputTokens: 1000
            }
          })
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || `API call failed for model ${model}`);
        }

        const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText !== undefined) {
          const trimmed = candidateText.trim();
          try {
            const parsed = JSON.parse(trimmed);
            translatedText = parsed.translatedText || trimmed;
          } catch (e) {
            translatedText = trimmed;
          }
          apiSuccess = true;
          console.log(`Successfully completed translation with model: ${model}`);
          break;
        } else {
          throw new Error(`Empty content returned by model ${model}`);
        }
      } catch (err) {
        console.warn(`Model ${model} failed in translate:`, err.message);
        lastError = err;
      }
    }

    if (!apiSuccess) {
      throw new Error(lastError?.message || 'All Gemini models failed in translate');
    }

    return new Response(JSON.stringify({ translatedText, isMock: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
