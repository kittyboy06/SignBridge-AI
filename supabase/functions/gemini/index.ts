import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gemini-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple rules for mock fallback if no API key is provided
function cleanRawLetters(text: string): string {
  const clean = text.toUpperCase().replace(/[^A-Z\s]/g, '');
  
  // Basic heuristic cleanup of duplicated characters due to static classification frames
  // e.g. "QQJQQQOOOBAJOOOOO" -> "Q J Q O B A J O"
  const words = clean.split(/\s+/);
  const cleanedWords = words.map(word => {
    let result = '';
    let lastChar = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (char !== lastChar) {
        result += char;
        lastChar = char;
      }
    }
    return result;
  });
  
  const deduplicated = cleanedWords.join(' ');

  // Direct mock mappings for demonstration
  const mappings: Record<string, string> = {
    'GOOD MORNING HOW ARE YOU': 'Good morning, how are you?',
    'I NEED SOME WATER': 'I need some water.',
    'WHERE IS THE HOSPITAL': 'Where is the hospital?',
    'I NEED HELP': 'I need help.',
    'CALL AN AMBULANCE': 'Call an ambulance.',
    'I AM DEAF': 'I am deaf.',
    'THANK YOU': 'Thank you.'
  };

  for (const [key, val] of Object.entries(mappings)) {
    if (deduplicated.includes(key) || key.includes(deduplicated) && deduplicated.length > 3) {
      return val;
    }
  }

  // Capitalize first letter and add period as fallback
  const sentence = deduplicated.charAt(0) + deduplicated.slice(1).toLowerCase();
  return sentence ? `${sentence}.` : 'Show your hand to sign.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = req.headers.get('x-gemini-api-key') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');

    // MOCK MODE FALLBACK: If no key, run rule-based mock correction
    if (!apiKey) {
      console.warn('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set. Running in MOCK mode...');
      const enhancedText = cleanRawLetters(text);
      return new Response(JSON.stringify({ enhancedText, isMock: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vocabularyList = [
      'afternoon', 'animal', 'bad', 'beautiful', 'big', 'bird', 'blind', 'cat', 'cheap', 
      'clothing', 'cold', 'cow', 'curved', 'deaf', 'dog', 'dress', 'dry', 'evening', 
      'expensive', 'famous', 'fast', 'female', 'fish', 'flat', 'friday', 'good', 'happy', 
      'hat', 'healthy', 'horse', 'hot', 'hour', 'light', 'long', 'loose', 'loud', 'minute', 
      'monday', 'month', 'morning', 'mouse', 'narrow', 'new', 'night', 'old', 'pant', 
      'pocket', 'quiet', 'sad', 'saturday', 'second', 'shirt', 'shoes', 'short', 'sick', 
      'skirt', 'slow', 'small', 'suit', 'sunday', 't_shirt', 'tall', 'thursday', 'time', 
      'today', 'tomorrow', 'tuesday', 'ugly', 'warm', 'wednesday', 'week', 'wet', 'wide', 
      'year', 'yesterday', 'young'
    ];

    const prompt = `You are the backend AI interpreter for a sign language translator application called SignBridge AI.
The user is communicating using a combination of two methods:
1. Fingerspelling letters (A to Z) sequentially to spell out words.
2. Signing continuous words from a specific trained vocabulary of 76 words:
[${vocabularyList.join(', ')}]

The input sequence of signs/letters you receive is noisy. It may contain duplicate characters, spelling mistakes, isolated letters that should be merged into words, or words without proper grammar.
Your task is to interpret this noisy input, leverage the vocabulary and fingerspelled sequences, and output ONLY the single, clean, grammatically correct, natural English sentence that the user is trying to communicate.

Do not include any greeting, explanation, thought process, notes, or extra punctuation. Output exactly and only the final corrected sentence.

Noisy Input: "${text}"
Cleaned Output:`;

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
      console.log('Querying list of models from Gemini API...');
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
      console.warn('Failed to query models list, using default model list:', e.message);
    }

    let enhancedText = '';
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
              parts: [{ text: `Noisy Input: "${text}"` }]
            }],
            systemInstruction: {
              parts: [{ text: prompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  enhancedText: {
                    type: 'STRING',
                    description: 'The clean, grammatically correct, natural English sentence reconstructed from the sign language input.'
                  }
                },
                required: ['enhancedText']
              },
              temperature: 0.2,
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
            enhancedText = parsed.enhancedText || trimmed;
          } catch (e) {
            enhancedText = trimmed;
          }
          apiSuccess = true;
          console.log(`Successfully completed enhancement with model: ${model}`);
          break;
        } else {
          throw new Error(`Empty content returned by model ${model}`);
        }
      } catch (err) {
        console.warn(`Model ${model} failed:`, err.message);
        lastError = err;
      }
    }

    if (!apiSuccess) {
      throw new Error(lastError?.message || 'All Gemini models failed');
    }

    return new Response(JSON.stringify({ enhancedText, isMock: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
