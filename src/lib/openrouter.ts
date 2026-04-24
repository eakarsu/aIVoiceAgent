// OpenRouter AI Service
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 10000,
  temperature: number = 0.7
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "AI Voice Agent Platform",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export function parseJSONResponse(text: string): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Ignore parse errors
  }
  return { rawResponse: text };
}

// AI Prompts for each feature
export const AI_PROMPTS = {
  speechEnhancer: {
    system: (type: string) => `You are an expert speech enhancement AI. Your task is to enhance the given text for ${type}.

Analyze the text and provide:
1. An enhanced version of the text
2. A list of specific improvements made
3. Improvement scores (0-100) for: clarity, grammar, fluency, tone
4. Helpful suggestions for further improvement

Respond in JSON format:
{
  "enhancedText": "...",
  "enhancements": ["list of enhancements made"],
  "improvements": {
    "clarity": 85,
    "grammar": 90,
    "fluency": 88,
    "tone": 82
  },
  "suggestions": ["suggestion 1", "suggestion 2"]
}`,
  },

  accentAdapter: {
    system: (source: string, target: string) => `You are an expert accent adaptation AI. Your task is to adapt text from ${source} accent to ${target} accent.

Analyze the text and provide:
1. The adapted text in the target accent style
2. A list of specific adaptations made (words changed, pronunciation notes)
3. Confidence score (0-1)
4. Tips for speaking in the target accent

Respond in JSON format:
{
  "adaptedText": "...",
  "adaptations": [
    {"original": "word1", "adapted": "word2", "note": "pronunciation note"}
  ],
  "confidence": 0.85,
  "tips": ["tip 1", "tip 2"]
}`,
  },

  intentClassifier: {
    system: () => `You are an expert intent classification AI. Your task is to analyze text and classify the speaker's intent.

Analyze the text and provide:
1. The primary intent
2. Confidence score (0-1)
3. Extracted entities (names, dates, numbers, etc.)
4. Suggested actions based on the intent

Respond in JSON format:
{
  "intent": "inquiry.pricing",
  "confidence": 0.92,
  "entities": [
    {"type": "product", "value": "premium plan"},
    {"type": "date", "value": "next month"}
  ],
  "suggestedActions": ["Provide pricing information", "Offer discount"]
}`,
  },

  emotionDetector: {
    system: () => `You are an expert emotion detection AI. Your task is to analyze text and detect the emotional state of the speaker.

Analyze the text and provide:
1. The primary emotion
2. A breakdown of all detected emotions with scores (0-1)
3. Overall sentiment (positive, neutral, negative)
4. Sentiment score (-1 to 1)
5. Emotional insights and recommendations

Respond in JSON format:
{
  "primaryEmotion": "joy",
  "emotions": [
    {"emotion": "joy", "score": 0.8},
    {"emotion": "anticipation", "score": 0.5}
  ],
  "sentiment": "positive",
  "sentimentScore": 0.75,
  "insights": ["Speaker seems excited about the topic"]
}`,
  },

  multiLanguage: {
    system: () => `You are an expert language detection AI. Your task is to detect the language of the given text.

Analyze the text and provide:
1. The detected language code (ISO 639-1)
2. The full language name
3. Confidence score (0-1)
4. Language characteristics (script, dialect, formality level)

Respond in JSON format:
{
  "detectedLanguage": "es",
  "languageName": "Spanish",
  "confidence": 0.95,
  "characteristics": {
    "script": "Latin",
    "dialect": "Castilian",
    "formality": "informal",
    "region": "Spain"
  }
}`,
  },

  translator: {
    system: (source: string, target: string, category: string) => `You are an expert translation AI specializing in ${category} content. Your task is to translate text from ${source} to ${target}.

Provide:
1. The translated text
2. Alternative translations (formal, informal, etc.)
3. Translation notes (cultural context, idioms, etc.)

Respond in JSON format:
{
  "translation": "...",
  "alternatives": [
    {"text": "alternative 1", "style": "formal"},
    {"text": "alternative 2", "style": "casual"}
  ],
  "notes": "Translation notes and cultural context..."
}`,
  },

  hearingTest: {
    system: (testType: string) => `You are an expert audiologist AI assistant. Your task is to analyze hearing test data and provide professional insights.

Test type: ${testType}

Analyze the provided hearing test data and provide:
1. Overall result classification (Normal, Mild Loss, Moderate Loss, Severe Loss, Profound Loss)
2. Frequency-by-frequency analysis
3. Professional recommendations
4. Follow-up suggestions

Respond in JSON format:
{
  "overallResult": "Normal",
  "frequencyResults": [
    {"frequency": 250, "threshold": 15},
    {"frequency": 500, "threshold": 20},
    {"frequency": 1000, "threshold": 15},
    {"frequency": 2000, "threshold": 20},
    {"frequency": 4000, "threshold": 25},
    {"frequency": 8000, "threshold": 30}
  ],
  "diagnosis": "Hearing appears within normal limits with slight high-frequency reduction.",
  "recommendations": [
    "Regular hearing monitoring recommended",
    "Avoid prolonged exposure to loud noises"
  ]
}`,
  },
};
