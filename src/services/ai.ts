// AI Voice Agent Services - OpenRouter Integration
// Uses OpenRouter API for AI-powered features

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ConversationContext {
  agentId: string;
  callId: string;
  history: { role: "user" | "assistant"; content: string }[];
  agentConfig: {
    personality: string;
    greeting: string;
    fallbackMessage: string;
    temperature: number;
    maxTokens: number;
  };
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  emotions: string[];
}

export interface EntityResult {
  type: string;
  value: string;
  confidence: number;
}

// Helper function to call OpenRouter API
async function callOpenRouter(
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";

  if (!apiKey) {
    console.warn("OpenRouter API key not configured, using fallback responses");
    return "";
  }

  const requestMessages = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  try {
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
        messages: requestMessages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter API call failed:", error);
    return "";
  }
}

// AI Conversation Engine - Generates natural dialogue responses
export async function generateResponse(
  context: ConversationContext,
  userMessage: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context.agentConfig);

  const messages = [
    ...context.history.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ];

  const aiResponse = await callOpenRouter(
    messages,
    systemPrompt,
    context.agentConfig.maxTokens || 500,
    context.agentConfig.temperature || 0.7
  );

  if (aiResponse) {
    return aiResponse;
  }

  // Fallback to rule-based responses if API fails
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return context.agentConfig.greeting;
  }
  if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
    return "Our business hours are Monday through Friday, 9 AM to 5 PM Eastern Time.";
  }
  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return "I can help you with pricing information. Our plans start at $29 per month. Would you like me to explain the different options?";
  }
  if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("problem")) {
    return "I understand you need assistance. Could you please describe the issue you are experiencing?";
  }
  if (lowerMessage.includes("human") || lowerMessage.includes("person") || lowerMessage.includes("agent")) {
    return "I will connect you with a human representative. Please hold while I transfer your call.";
  }

  return context.agentConfig.fallbackMessage;
}

// AI Intent Detection - Understands caller needs using OpenRouter
export async function detectIntent(message: string): Promise<IntentResult> {
  const systemPrompt = `You are an intent detection system. Analyze the user message and return a JSON object with:
- intent: the detected intent (e.g., "inquiry.pricing", "support.general", "booking.appointment", "billing.refund", "transfer.human", "greeting", "farewell", "unknown")
- confidence: a number between 0 and 1
- entities: an object with any extracted entities (phone, email, date, time, name, etc.)

Respond ONLY with valid JSON, no explanation.`;

  const response = await callOpenRouter(
    [{ role: "user", content: message }],
    systemPrompt,
    200,
    0.3
  );

  if (response) {
    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent || "unknown",
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || extractEntities(message),
      };
    } catch {
      // Fall through to rule-based detection
    }
  }

  // Fallback to rule-based intent detection
  const lowerMessage = message.toLowerCase();
  const intents: { pattern: RegExp; intent: string }[] = [
    { pattern: /\b(price|cost|pricing|quote)\b/i, intent: "inquiry.pricing" },
    { pattern: /\b(hours|open|close|schedule)\b/i, intent: "inquiry.hours" },
    { pattern: /\b(help|support|issue|problem|broken)\b/i, intent: "support.general" },
    { pattern: /\b(refund|cancel|return)\b/i, intent: "billing.refund" },
    { pattern: /\b(appointment|book|schedule|meeting)\b/i, intent: "booking.appointment" },
    { pattern: /\b(human|person|agent|representative)\b/i, intent: "transfer.human" },
    { pattern: /\b(hi|hello|hey|good morning|good afternoon)\b/i, intent: "greeting" },
    { pattern: /\b(bye|goodbye|thank you|thanks)\b/i, intent: "farewell" },
  ];

  for (const { pattern, intent } of intents) {
    if (pattern.test(lowerMessage)) {
      return {
        intent,
        confidence: 0.85,
        entities: extractEntities(message),
      };
    }
  }

  return {
    intent: "unknown",
    confidence: 0.3,
    entities: extractEntities(message),
  };
}

// AI Entity Extraction - Captures information from speech
export function extractEntities(message: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Phone number extraction
  const phoneMatch = message.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  if (phoneMatch) {
    entities.phone = phoneMatch[0];
  }

  // Email extraction
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    entities.email = emailMatch[0];
  }

  // Date extraction (simple patterns)
  const dateMatch = message.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dateMatch) {
    entities.date = dateMatch[0].toLowerCase();
  }

  // Time extraction
  const timeMatch = message.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Number extraction
  const numberMatch = message.match(/\b\d+\b/);
  if (numberMatch && !phoneMatch) {
    entities.number = numberMatch[0];
  }

  // Name extraction (basic)
  const nameMatch = message.match(/my name is\s+([A-Za-z]+)/i);
  if (nameMatch) {
    entities.name = nameMatch[1];
  }

  return entities;
}

// AI Sentiment Analysis - Detects caller mood using OpenRouter
export async function analyzeSentiment(message: string): Promise<SentimentResult> {
  const systemPrompt = `You are a sentiment analysis system. Analyze the user message and return a JSON object with:
- sentiment: "positive", "negative", or "neutral"
- score: a number between 0 and 1 indicating intensity
- emotions: an array of detected emotions (e.g., ["happy", "frustrated", "confused", "urgent", "angry", "satisfied"])

Respond ONLY with valid JSON, no explanation.`;

  const response = await callOpenRouter(
    [{ role: "user", content: message }],
    systemPrompt,
    150,
    0.3
  );

  if (response) {
    try {
      const parsed = JSON.parse(response);
      return {
        sentiment: parsed.sentiment || "neutral",
        score: parsed.score || 0.5,
        emotions: parsed.emotions || [],
      };
    } catch {
      // Fall through to rule-based analysis
    }
  }

  // Fallback to rule-based sentiment analysis
  const lowerMessage = message.toLowerCase();
  const positiveWords = ["great", "excellent", "amazing", "wonderful", "thank", "thanks", "appreciate", "happy", "pleased", "love", "perfect"];
  const negativeWords = ["terrible", "awful", "bad", "horrible", "angry", "frustrated", "upset", "disappointed", "hate", "worst", "ridiculous"];

  let positiveScore = 0;
  let negativeScore = 0;
  const emotions: string[] = [];

  for (const word of positiveWords) {
    if (lowerMessage.includes(word)) {
      positiveScore += 1;
    }
  }

  for (const word of negativeWords) {
    if (lowerMessage.includes(word)) {
      negativeScore += 1;
    }
  }

  if (lowerMessage.includes("frustrat") || lowerMessage.includes("angry")) {
    emotions.push("frustrated");
  }
  if (lowerMessage.includes("happy") || lowerMessage.includes("pleased")) {
    emotions.push("happy");
  }
  if (lowerMessage.includes("confus")) {
    emotions.push("confused");
  }
  if (lowerMessage.includes("urgent") || lowerMessage.includes("immediately")) {
    emotions.push("urgent");
  }

  const totalScore = positiveScore - negativeScore;

  if (totalScore > 0) {
    return {
      sentiment: "positive",
      score: Math.min(positiveScore * 0.2, 1),
      emotions,
    };
  } else if (totalScore < 0) {
    return {
      sentiment: "negative",
      score: Math.min(negativeScore * 0.2, 1),
      emotions,
    };
  }

  return {
    sentiment: "neutral",
    score: 0.5,
    emotions,
  };
}

// AI Language Detection - Multi-language support
export async function detectLanguage(message: string): Promise<{ language: string; confidence: number }> {
  const systemPrompt = `You are a language detection system. Analyze the user message and return a JSON object with:
- language: the ISO 639-1 language code (e.g., "en", "es", "fr", "de", "zh", "ja")
- confidence: a number between 0 and 1

Respond ONLY with valid JSON, no explanation.`;

  const response = await callOpenRouter(
    [{ role: "user", content: message }],
    systemPrompt,
    50,
    0.3
  );

  if (response) {
    try {
      const parsed = JSON.parse(response);
      return {
        language: parsed.language || "en",
        confidence: parsed.confidence || 0.8,
      };
    } catch {
      // Fall through to rule-based detection
    }
  }

  // Fallback to simple language detection
  const languagePatterns: { language: string; patterns: RegExp[] }[] = [
    { language: "es", patterns: [/\b(hola|gracias|por favor|bueno|si|no)\b/i] },
    { language: "fr", patterns: [/\b(bonjour|merci|oui|non|s'il vous plaît)\b/i] },
    { language: "de", patterns: [/\b(hallo|danke|bitte|ja|nein|gut)\b/i] },
    { language: "pt", patterns: [/\b(olá|obrigado|por favor|sim|não)\b/i] },
    { language: "it", patterns: [/\b(ciao|grazie|prego|sì|no)\b/i] },
    { language: "zh", patterns: [/[\u4e00-\u9fff]/] },
    { language: "ja", patterns: [/[\u3040-\u30ff]/] },
    { language: "ko", patterns: [/[\uac00-\ud7af]/] },
    { language: "ar", patterns: [/[\u0600-\u06ff]/] },
  ];

  for (const { language, patterns } of languagePatterns) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return { language, confidence: 0.8 };
      }
    }
  }

  return { language: "en", confidence: 0.9 };
}

// AI Escalation Detection - Knows when to transfer to human
export function shouldEscalate(
  context: ConversationContext,
  sentiment: SentimentResult,
  intent: IntentResult
): { shouldTransfer: boolean; reason: string } {
  // Transfer if explicitly requested
  if (intent.intent === "transfer.human") {
    return { shouldTransfer: true, reason: "Customer requested human agent" };
  }

  // Transfer if very negative sentiment
  if (sentiment.sentiment === "negative" && sentiment.score > 0.7) {
    return { shouldTransfer: true, reason: "High negative sentiment detected" };
  }

  // Transfer if frustrated emotion detected
  if (sentiment.emotions.includes("frustrated") && sentiment.emotions.includes("urgent")) {
    return { shouldTransfer: true, reason: "Frustrated and urgent customer" };
  }

  // Transfer if multiple unknown intents in conversation
  const unknownCount = context.history.filter(
    (h) => h.role === "assistant" && h.content.includes("didn't understand")
  ).length;

  if (unknownCount >= 2) {
    return { shouldTransfer: true, reason: "Multiple failed understanding attempts" };
  }

  // Transfer for billing/refund issues
  if (intent.intent === "billing.refund") {
    return { shouldTransfer: true, reason: "Billing issue requires human review" };
  }

  return { shouldTransfer: false, reason: "" };
}

// Helper function to build system prompt
function buildSystemPrompt(config: ConversationContext["agentConfig"]): string {
  const personalityPrompts: Record<string, string> = {
    professional: `You are a professional and helpful AI voice assistant. Be clear, concise, and businesslike in your responses.
Your greeting is: "${config.greeting}"
If you don't understand something, say: "${config.fallbackMessage}"
Keep responses brief and suitable for voice calls (under 100 words).`,
    friendly: `You are a friendly and warm AI voice assistant. Be personable and approachable while remaining helpful.
Your greeting is: "${config.greeting}"
If you don't understand something, say: "${config.fallbackMessage}"
Keep responses brief and suitable for voice calls (under 100 words).`,
    casual: `You are a casual and relaxed AI voice assistant. Be conversational and easy-going in your responses.
Your greeting is: "${config.greeting}"
If you don't understand something, say: "${config.fallbackMessage}"
Keep responses brief and suitable for voice calls (under 100 words).`,
    formal: `You are a formal and polite AI voice assistant. Use proper language and maintain a respectful tone.
Your greeting is: "${config.greeting}"
If you don't understand something, say: "${config.fallbackMessage}"
Keep responses brief and suitable for voice calls (under 100 words).`,
  };

  return personalityPrompts[config.personality] || personalityPrompts.professional;
}

// AI Call Summary Generator using OpenRouter
export async function generateCallSummary(
  messages: { role: string; content: string }[]
): Promise<string> {
  if (messages.length === 0) {
    return "No conversation recorded.";
  }

  const systemPrompt = `You are a call summarization system. Analyze the conversation and provide a brief summary including:
- Main topics discussed
- Customer intent/needs
- Outcome/resolution
- Any follow-up actions needed

Keep the summary under 150 words.`;

  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");

  const response = await callOpenRouter(
    [{ role: "user", content: `Summarize this call:\n\n${conversationText}` }],
    systemPrompt,
    200,
    0.5
  );

  if (response) {
    return response;
  }

  // Fallback to simple summary
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  const topics: string[] = [];

  for (const msg of userMessages) {
    const lower = msg.toLowerCase();
    if (lower.includes("price") || lower.includes("cost")) topics.push("pricing inquiry");
    if (lower.includes("support") || lower.includes("help")) topics.push("support request");
    if (lower.includes("appointment") || lower.includes("book")) topics.push("booking request");
    if (lower.includes("hours") || lower.includes("open")) topics.push("business hours inquiry");
    if (lower.includes("refund") || lower.includes("cancel")) topics.push("refund/cancellation request");
  }

  const uniqueTopics = [...new Set(topics)];

  if (uniqueTopics.length > 0) {
    return `Customer inquired about: ${uniqueTopics.join(", ")}. Total exchanges: ${messages.length}.`;
  }

  return `General inquiry call with ${messages.length} exchanges.`;
}

// AI Response Suggestion - Suggests responses based on context
export async function suggestResponses(
  context: ConversationContext,
  userMessage: string
): Promise<string[]> {
  const systemPrompt = `You are a response suggestion system for voice agents. Given the conversation context and customer message, suggest 3 brief, appropriate responses the agent could give.

Return a JSON array of 3 strings, each under 50 words.
Example: ["Response 1", "Response 2", "Response 3"]

Respond ONLY with valid JSON array, no explanation.`;

  const conversationText = context.history
    .map((h) => `${h.role === "user" ? "Customer" : "Agent"}: ${h.content}`)
    .join("\n");

  const response = await callOpenRouter(
    [
      {
        role: "user",
        content: `Conversation so far:\n${conversationText}\n\nCustomer just said: "${userMessage}"\n\nSuggest 3 responses:`,
      },
    ],
    systemPrompt,
    300,
    0.7
  );

  if (response) {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
      }
    } catch {
      // Fall through to default suggestions
    }
  }

  // Default suggestions
  return [
    "I understand. Let me help you with that.",
    "Could you please provide more details?",
    "Let me transfer you to a specialist who can assist you better.",
  ];
}

// AI Training Data Collection - For learning and improvement
export interface TrainingFeedback {
  callId: string;
  messageId: string;
  callTranscript?: string;
  originalResponse: string;
  correctedResponse?: string;
  rating: number; // 1-5
  feedbackType: "positive" | "negative" | "correction";
}

export async function processTrainingFeedback(
  feedback: TrainingFeedback
): Promise<{ success: boolean; message: string; id?: string }> {
  // Persist to AiTrainingData so corrections can be exported later for fine-tuning.
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const row = await prisma.aiTrainingData.create({
      data: {
        input:
          typeof feedback.callTranscript === "string"
            ? feedback.callTranscript
            : JSON.stringify(feedback.callTranscript),
        output: feedback.correctedResponse || feedback.originalResponse,
        context: JSON.stringify({
          originalResponse: feedback.originalResponse,
          rating: feedback.rating,
          feedbackType: feedback.feedbackType,
          callId: feedback.callId,
        }),
        category: feedback.feedbackType,
        isApproved: feedback.feedbackType === "positive",
      },
    });
    return {
      success: true,
      id: row.id,
      message: "Feedback recorded for AI improvement",
    };
  } catch (error) {
    console.error("processTrainingFeedback failed", error);
    return {
      success: false,
      message: "Failed to record feedback",
    };
  }
}
