import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings/config - Get system configuration for dropdowns
export async function GET() {
  try {
    // Fetch system settings from database
    const settings = await prisma.systemSetting.findMany();

    // Convert to a more usable format
    const config: Record<string, any> = {};
    for (const setting of settings) {
      config[setting.key] = setting.value;
    }

    // Get personality types from settings or use defaults
    const personalityTypes = config.personality_types || [
      { value: "professional", label: "Professional", description: "Formal and business-like tone" },
      { value: "friendly", label: "Friendly", description: "Warm and approachable tone" },
      { value: "casual", label: "Casual", description: "Relaxed and conversational tone" },
      { value: "formal", label: "Formal", description: "Very formal and polite tone" },
    ];

    // Get AI models from settings
    const aiModels = config.ai_models || [
      "anthropic/claude-3-haiku",
      "anthropic/claude-3-sonnet",
      "openai/gpt-4",
      "openai/gpt-3.5-turbo",
    ];

    // Format AI models for dropdown
    const aiModelsFormatted = aiModels.map((model: string) => {
      const [provider, name] = model.split("/");
      return {
        value: model,
        label: name?.toUpperCase() || model,
        description: `${provider} model`,
      };
    });

    // Get supported languages
    const supportedLanguages = config.supported_languages || ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"];

    // Language labels
    const languageLabels: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",
      ru: "Russian",
    };

    const languages = supportedLanguages.map((code: string) => ({
      value: code,
      label: languageLabels[code] || code.toUpperCase(),
    }));

    // Get voice providers
    const voiceProviders = config.voice_providers || ["system", "elevenlabs", "azure", "google", "amazon"];

    // Get phone number types
    const phoneTypes = [
      { value: "local", label: "Local" },
      { value: "tollfree", label: "Toll-Free" },
      { value: "mobile", label: "Mobile" },
    ];

    // Get call handling types
    const callHandlingTypes = [
      { value: "agent", label: "AI Agent" },
      { value: "forward", label: "Forward" },
      { value: "voicemail", label: "Voicemail" },
    ];

    // Get integration types
    const integrationTypes = [
      { type: "calendar", label: "Calendar", providers: ["google-calendar", "outlook", "calendly"] },
      { type: "crm", label: "CRM", providers: ["salesforce", "hubspot", "pipedrive", "zoho"] },
      { type: "payment", label: "Payment", providers: ["stripe", "paypal", "square"] },
      { type: "sms", label: "SMS", providers: ["twilio-sms", "vonage", "messagebird"] },
      { type: "support", label: "Support", providers: ["zendesk", "freshdesk", "intercom"] },
      { type: "email", label: "Email", providers: ["sendgrid", "mailchimp", "mailgun"] },
      { type: "automation", label: "Automation", providers: ["zapier", "make", "n8n"] },
      { type: "notification", label: "Notification", providers: ["slack", "teams", "discord"] },
    ];

    // Get webhook events
    const webhookEvents = [
      { value: "call.started", label: "Call Started" },
      { value: "call.ended", label: "Call Ended" },
      { value: "call.transferred", label: "Call Transferred" },
      { value: "call.missed", label: "Call Missed" },
      { value: "call.escalated", label: "Call Escalated" },
      { value: "voicemail.received", label: "Voicemail Received" },
      { value: "sentiment.negative", label: "Negative Sentiment" },
      { value: "appointment.created", label: "Appointment Created" },
      { value: "appointment.updated", label: "Appointment Updated" },
      { value: "contact.created", label: "Contact Created" },
      { value: "analytics.daily", label: "Daily Analytics" },
      { value: "billing.threshold", label: "Billing Threshold" },
    ];

    // Get timezones
    const timezones = [
      { value: "America/New_York", label: "Eastern Time (US)" },
      { value: "America/Chicago", label: "Central Time (US)" },
      { value: "America/Denver", label: "Mountain Time (US)" },
      { value: "America/Los_Angeles", label: "Pacific Time (US)" },
      { value: "America/Phoenix", label: "Arizona Time" },
      { value: "America/Detroit", label: "Detroit" },
      { value: "Europe/London", label: "London" },
      { value: "Europe/Paris", label: "Paris" },
      { value: "Europe/Berlin", label: "Berlin" },
      { value: "Asia/Tokyo", label: "Tokyo" },
      { value: "Asia/Shanghai", label: "Shanghai" },
      { value: "Asia/Singapore", label: "Singapore" },
      { value: "Australia/Sydney", label: "Sydney" },
    ];

    // Get API key scopes
    const apiKeyScopes = [
      { value: "read", label: "Read", description: "Read-only access to data" },
      { value: "write", label: "Write", description: "Create and update data" },
      { value: "delete", label: "Delete", description: "Delete data" },
      { value: "admin", label: "Admin", description: "Full administrative access" },
      { value: "webhooks", label: "Webhooks", description: "Manage webhooks" },
      { value: "analytics", label: "Analytics", description: "Access analytics data" },
      { value: "integrations", label: "Integrations", description: "Manage integrations" },
    ];

    return NextResponse.json({
      personalityTypes,
      aiModels: aiModelsFormatted,
      languages,
      voiceProviders,
      phoneTypes,
      callHandlingTypes,
      integrationTypes,
      webhookEvents,
      timezones,
      apiKeyScopes,
      maxCallDuration: config.max_call_duration?.minutes || 30,
      recordingRetentionDays: config.recording_retention_days?.days || 90,
    });
  } catch (error) {
    console.error("Failed to fetch config:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}
