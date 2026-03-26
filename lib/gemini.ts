import * as FileSystem from 'expo-file-system/legacy';
import type { AssistantPayload, ChatMessage } from '@/types/chat';
import halal from '@/data/halal-keywords.json';
import haram from '@/data/haram-keywords.json';
import mashbooh from '@/data/mashbooh-keywords.json';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

function cleanJson(raw: string) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

function isOffTopic(text: string): boolean {
  const offTopicKeywords = [
    'joke',
    'funny',
    'meme',
    'porn',
    'adult',
    'nsfw',
    'haram content',
    'encourage haram',
    'make this funny',
    'make it hilarious',
    'dating tips',
    'flirt',
    'seduce',
    'inappropriate',
  ];
  const lower = text.toLowerCase();
  return offTopicKeywords.some((kw) => lower.includes(kw));
}

function isGreeting(text: string): boolean {
  const greetings = [
    'assalamu alaikum',
    'as-salamu alaikum',
    'السلام عليكم',
    'salaam',
    'salam',
    'hello',
    'hi',
    'hey',
    'good morning',
    'good evening',
    'good afternoon',
  ];
  const lower = text.toLowerCase();
  return greetings.some((g) => lower.includes(g));
}

export async function askGeminiChat(params: {
  messages: ChatMessage[];
  userText: string;
  language: string;
  images?: { uri: string; mimeType?: string; base64?: string }[];
}): Promise<AssistantPayload> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');

  if (isOffTopic(params.userText)) {
    return {
      verdict: 'general',
      language: params.language,
      shortAnswer: 'I am designed for Islamic and halal guidance only.',
      detailedAnswer:
        'I cannot assist with haram, inappropriate, or entertainment-focused misuse. Please ask about halal ingredients, Islamic guidance, Quran/Hadith-based rulings, or food permissibility.',
      detectedIngredients: [],
      evidences: [
        {
          type: 'quran',
          citation: 'Quran 2:168',
          sourceName: 'Al-Baqarah',
          url: 'https://quran.com/2/168',
        },
      ],
      followUpQuestions: [
        'Can you check if these ingredients are halal?',
        'What is the Islamic ruling on doubtful ingredients?',
        'Can you explain halal and haram in food?',
      ],
      caution: 'Please keep queries within Islamic guidelines.',
    };
  }

  if (isGreeting(params.userText) && (!params.images || params.images.length === 0)) {
    return {
      verdict: 'general',
      language: params.language,
      shortAnswer: 'Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh.',
      detailedAnswer:
        'Welcome. I can help with halal food checks, ingredient analysis, and Islamic guidance with Quran and Hadith references.',
      detectedIngredients: [],
      evidences: [],
      followUpQuestions: [
        'Can you check this product ingredients?',
        'What makes an ingredient haram?',
        'Can you explain mashbooh ingredients?',
      ],
      caution: '',
    };
  }

  const history = params.messages
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  const systemPrompt = `
You are "HalalChat Bot", a strict Islamic food and guidance assistant.

LANGUAGE RULES:
1) Detect the language from the user's latest message automatically.
2) Respond in the SAME language and script as the user.
3) If user message is mixed-language, use the dominant language style.
4) Never force Urdu or English unless explicitly requested by the user.
5) Keep Islamic terms accurate (halal, haram, mashbooh, Quran, Hadith).

CRITICAL RULES:
1) NEVER engage with requests to make haram content funny or entertaining.
2) NEVER encourage haram activities or behaviors.
3) ALWAYS respond with Islamic principles and evidence.
4) If user greets with "Assalamu Alaikum", respond with "Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh".
5) For off-topic requests, politely redirect to Islamic and halal topics.
6) Understand text and images globally (any language scripts).
7) If image is not food/ingredient related -> verdict "not-food".
8) For ingredients: classify "halal" | "haram" | "mashbooh".
9) For general Islamic questions: verdict "general".
10) If ingredient text is unclear/missing in image, use web grounding/search and clearly state that internet lookup was used.
11) For halal/haram verdicts, explain WHY and include Quran/Hadith/Sunnah references when applicable.
12) If uncertain, explicitly say uncertain.
13) Output STRICT JSON only. No markdown.

Reference keywords:
- halal: ${JSON.stringify(halal.halal_keywords)}
- haram: ${JSON.stringify(haram.haram_keywords)}
- mashbooh: ${JSON.stringify(mashbooh.mashbooh_keywords)}

JSON schema:
{
  "verdict": "halal|haram|mashbooh|not-food|general",
  "language": "string",
  "shortAnswer": "string",
  "detailedAnswer": "string",
  "detectedIngredients": ["string"],
  "imageContext": { "isFoodItem": boolean, "confidence": number, "reason": "string" },
  "evidences": [
    { "type": "quran|hadith|fiqh|note", "citation": "string", "sourceName": "string", "url": "https://..." }
  ],
  "followUpQuestions": ["string"],
  "caution": "string or null"
}
`;

  const parts: any[] = [
    {
      text: `${systemPrompt}\n\nConversation:\n${history}\n\nUser message:\n${params.userText}`,
    },
  ];

  if (params.images?.length) {
    for (const image of params.images) {
      let b64 = image.base64;

      if (!b64) {
        let readUri = image.uri;
        if (readUri.startsWith('content://')) {
          const temp = `${FileSystem.cacheDirectory}img_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: readUri, to: temp });
          readUri = temp;
        }
        b64 = await FileSystem.readAsStringAsync(readUri, { encoding: 'base64' });
      }

      parts.push({
        inline_data: {
          mime_type: image.mimeType || 'image/jpeg',
          data: b64,
        },
      });
    }
  }

  let response: Response | null = null;
  let lastError = '';

  for (const model of MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    // First attempt: with Google Search grounding
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          topP: 0.9,
          topK: 40,
        },
      }),
    });

    // Fallback: same model without tools (if tool unsupported)
    if (!response.ok && response.status === 400) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            topP: 0.9,
            topK: 40,
          },
        }),
      });
    }

    if (response.ok) break;

    const errText = await response.text();
    lastError = `[${model}] ${response.status} ${errText}`;

    if (response.status !== 404) break;
  }

  if (!response || !response.ok) {
    throw new Error(`Gemini API failed: ${lastError || 'Unknown error'}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response');

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    parsed = {
      verdict: 'general',
      language: params.language,
      shortAnswer: 'I could not parse model output.',
      detailedAnswer: cleanJson(text),
      detectedIngredients: [],
      evidences: [],
      followUpQuestions: [],
      caution: 'Model returned non-JSON output.',
    };
  }

  const groundingChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const groundedLinks = groundingChunks
    .map((c: any) => c?.web)
    .filter(Boolean)
    .slice(0, 3)
    .map((w: any) => ({
      type: 'note',
      citation: w.title || 'Web reference',
      sourceName: w.domain || 'Web',
      url: w.uri || '',
    }))
    .filter((e: any) => e.url);

  const evidences = Array.isArray(parsed.evidences) ? parsed.evidences : [];
  const mergedEvidences = evidences.length > 0 ? evidences : groundedLinks;

  const usedInternet = groundedLinks.length > 0;
  const detailedAnswer =
    (parsed.detailedAnswer ?? '') +
    (usedInternet
      ? '\n\nNote: Some ingredient details were verified using internet lookup due to unclear or missing label information.'
      : '');

  return {
    verdict: parsed.verdict ?? 'general',
    language: parsed.language ?? 'auto',
    shortAnswer: parsed.shortAnswer ?? 'No answer generated.',
    detailedAnswer,
    detectedIngredients: Array.isArray(parsed.detectedIngredients) ? parsed.detectedIngredients : [],
    imageContext: parsed.imageContext,
    evidences: mergedEvidences,
    followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
    caution: parsed.caution ?? '',
  };
}