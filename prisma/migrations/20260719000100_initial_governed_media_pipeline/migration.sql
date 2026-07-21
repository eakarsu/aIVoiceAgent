-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'MANAGER', 'USER');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageBilling" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "callMinutes" INTEGER NOT NULL DEFAULT 0,
    "aiTokens" INTEGER NOT NULL DEFAULT 0,
    "smsCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "UsageBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "voiceId" TEXT,
    "voiceName" TEXT NOT NULL DEFAULT 'Default',
    "voiceProvider" TEXT NOT NULL DEFAULT 'system',
    "voiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "voicePitch" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "personalityType" TEXT NOT NULL DEFAULT 'professional',
    "greeting" TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'I''m sorry, I didn''t understand that. Could you please repeat?',
    "transferMessage" TEXT NOT NULL DEFAULT 'Let me transfer you to a human agent.',
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 150,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "gender" TEXT NOT NULL,
    "description" TEXT,
    "sampleUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseLibrary" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "ResponseLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallFlow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "flowData" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "CallFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallFlowNode" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "position" JSONB NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "callFlowId" TEXT NOT NULL,

    CONSTRAINT "CallFlowNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "displayName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "type" TEXT NOT NULL DEFAULT 'local',
    "provider" TEXT NOT NULL DEFAULT 'twilio',
    "providerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "callHandling" TEXT NOT NULL DEFAULT 'agent',
    "forwardTo" TEXT,
    "voicemailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "agentId" TEXT,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRoutingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL,
    "conditionValue" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "actionValue" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumberId" TEXT NOT NULL,

    CONSTRAINT "CallRoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "callSid" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "recordingSid" TEXT,
    "transcription" TEXT,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "intent" TEXT,
    "entities" JSONB,
    "summary" TEXT,
    "outcome" TEXT,
    "resolution" TEXT,
    "wasTransferred" BOOLEAN NOT NULL DEFAULT false,
    "transferredTo" TEXT,
    "hasVoicemail" BOOLEAN NOT NULL DEFAULT false,
    "voicemailUrl" TEXT,
    "voicemailTranscription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "phoneNumberId" TEXT,
    "agentId" TEXT,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT NOT NULL,

    CONSTRAINT "CallMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT NOT NULL,

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response" JSONB,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookId" TEXT NOT NULL,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "inboundCalls" INTEGER NOT NULL DEFAULT 0,
    "outboundCalls" INTEGER NOT NULL DEFAULT 0,
    "answeredCalls" INTEGER NOT NULL DEFAULT 0,
    "missedCalls" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "resolvedCalls" INTEGER NOT NULL DEFAULT 0,
    "transferredCalls" INTEGER NOT NULL DEFAULT 0,
    "voicemailCalls" INTEGER NOT NULL DEFAULT 0,
    "abandonedCalls" INTEGER NOT NULL DEFAULT 0,
    "positiveSentiment" INTEGER NOT NULL DEFAULT 0,
    "negativeSentiment" INTEGER NOT NULL DEFAULT 0,
    "neutralSentiment" INTEGER NOT NULL DEFAULT 0,
    "avgSentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationFeedback" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTrainingData" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "context" TEXT,
    "category" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeechEnhancement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalText" TEXT NOT NULL,
    "enhancedText" TEXT,
    "enhancementType" TEXT NOT NULL DEFAULT 'clarity',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "SpeechEnhancement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccentAdaptation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalText" TEXT NOT NULL,
    "adaptedText" TEXT,
    "sourceAccent" TEXT NOT NULL DEFAULT 'neutral',
    "targetAccent" TEXT NOT NULL DEFAULT 'american',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "AccentAdaptation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentClassification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "inputText" TEXT NOT NULL,
    "detectedIntent" TEXT,
    "confidence" DOUBLE PRECISION,
    "entities" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "IntentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionDetection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "inputText" TEXT NOT NULL,
    "primaryEmotion" TEXT,
    "emotions" JSONB,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "EmotionDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiLanguageSupport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "inputText" TEXT NOT NULL,
    "detectedLanguage" TEXT,
    "languageName" TEXT,
    "confidence" DOUBLE PRECISION,
    "supportedLanguages" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "MultiLanguageSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageTranslation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'auto',
    "targetLanguage" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "LanguageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HearingTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "patientName" TEXT,
    "patientAge" INTEGER,
    "testType" TEXT NOT NULL DEFAULT 'pure-tone',
    "frequencies" JSONB,
    "results" JSONB,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "HearingTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "fromNumber" TEXT NOT NULL,
    "callbackUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "agentId" TEXT,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignContact" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "metadata" JSONB,
    "callSid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "callId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "CampaignContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKnowledge" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'text',
    "sourceUrl" TEXT,
    "content" TEXT NOT NULL,
    "tokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResult" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "businessId" TEXT,
    "userId" TEXT,
    "callId" TEXT,
    "model" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "tokens" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsEnrollment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentGrantedAt" TIMESTAMP(3),
    "consentVersion" TEXT,
    "idDocumentRef" TEXT,
    "enrollmentNotes" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "fidelityScore" DOUBLE PRECISION,
    "misusRiskScore" DOUBLE PRECISION,
    "watermarkStrength" TEXT DEFAULT 'medium',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsEnrollmentSample" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sampleUrl" TEXT NOT NULL,
    "durationSecs" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "language" TEXT NOT NULL DEFAULT 'en',
    "noiseLevel" TEXT,
    "sampleType" TEXT NOT NULL DEFAULT 'read-aloud',
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsEnrollmentSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsConsentEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "subjectId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "witnessId" TEXT,
    "witnessName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "documentHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),
    "notes" TEXT,
    "isTampered" BOOLEAN NOT NULL DEFAULT false,
    "ledgerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VsConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsTtsStyle" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseVoiceId" TEXT,
    "enrollmentId" TEXT,
    "emotion" TEXT NOT NULL DEFAULT 'neutral',
    "pace" TEXT NOT NULL DEFAULT 'medium',
    "pitch" TEXT NOT NULL DEFAULT 'medium',
    "volume" TEXT NOT NULL DEFAULT 'medium',
    "emphasis" TEXT,
    "pauseStrategy" TEXT,
    "ssmlTemplate" TEXT,
    "brand" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "consistencyScore" DOUBLE PRECISION,
    "naturalnessPred" DOUBLE PRECISION,
    "engagementPred" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsTtsStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsAvatarRenderJob" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enrollmentId" TEXT,
    "assetType" TEXT NOT NULL DEFAULT '3d',
    "renderTier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "inputAssetUrl" TEXT,
    "outputAssetUrl" TEXT,
    "previewUrl" TEXT,
    "renderConfig" JSONB,
    "complexityClass" TEXT,
    "predictedTimeSec" DOUBLE PRECISION,
    "predictedCostUsd" DOUBLE PRECISION,
    "actualTimeSec" DOUBLE PRECISION,
    "actualCostUsd" DOUBLE PRECISION,
    "fidelityScore" DOUBLE PRECISION,
    "pipelineHealth" DOUBLE PRECISION,
    "failureCause" TEXT,
    "licensingOk" BOOLEAN NOT NULL DEFAULT false,
    "cacheKey" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsAvatarRenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsLipsyncJob" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "renderJobId" TEXT,
    "audioUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "outputUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "frameRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "driftMs" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "naturalLookScore" DOUBLE PRECISION,
    "mismatchClass" TEXT,
    "occludedMouth" BOOLEAN NOT NULL DEFAULT false,
    "mouthShapeDifficulty" TEXT,
    "renderCorrectionSec" DOUBLE PRECISION,
    "visemeTrackUrl" TEXT,
    "visemeLanguagePack" TEXT,
    "manualTouchUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "qaReport" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsLipsyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsDubbingJob" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enrollmentId" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "targetLanguages" TEXT[],
    "sourceAudioUrl" TEXT NOT NULL,
    "sourceScriptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "difficultyClass" TEXT,
    "voicePreservationScore" DOUBLE PRECISION,
    "culturalFitScore" DOUBLE PRECISION,
    "acceptanceScore" DOUBLE PRECISION,
    "dubQualityScore" DOUBLE PRECISION,
    "timingFitOk" BOOLEAN NOT NULL DEFAULT false,
    "emotionMismatch" BOOLEAN NOT NULL DEFAULT false,
    "targetMarket" TEXT,
    "glossaryUrl" TEXT,
    "dubScriptUrl" TEXT,
    "outputManifestUrl" TEXT,
    "voiceActorFallback" TEXT,
    "backTranslationCheck" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsDubbingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VsProvenanceRecord" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assetUrl" TEXT NOT NULL,
    "assetType" TEXT NOT NULL DEFAULT 'audio',
    "originClaim" TEXT,
    "c2paManifestUrl" TEXT,
    "manifestValid" BOOLEAN NOT NULL DEFAULT false,
    "signerTrust" TEXT,
    "isTampered" BOOLEAN NOT NULL DEFAULT false,
    "watermarkStrength" TEXT NOT NULL DEFAULT 'medium',
    "watermarkType" TEXT NOT NULL DEFAULT 'audible',
    "watermarkPayload" TEXT,
    "robustnessScore" DOUBLE PRECISION,
    "detectionSurvival" DOUBLE PRECISION,
    "attributionConfidence" DOUBLE PRECISION,
    "trustScore" DOUBLE PRECISION,
    "chainOfCustody" JSONB,
    "redactionEvents" JSONB,
    "revokedAt" TIMESTAMP(3),
    "publicCardUrl" TEXT,
    "additionalMetadata" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VsProvenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING_UPLOAD',
    "kind" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "objectUri" TEXT,
    "durationMs" INTEGER,
    "codec" TEXT,
    "probeMetadata" JSONB,
    "provenance" JSONB NOT NULL,
    "quarantinedAt" TIMESTAMP(3),
    "quarantineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaUploadSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "gatewayTicketId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "uploadUrlHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTimeline" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTimelineVersion" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editDecisionList" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaTimelineVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaPreviewApproval" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "timelineVersionId" TEXT NOT NULL,
    "previewAssetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "MediaPreviewApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCaptionTrack" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'WEBVTT',
    "objectUri" TEXT NOT NULL,
    "cuesDigest" TEXT NOT NULL,
    "cueCount" INTEGER NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCaptionTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaExportPreset" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "accessible" BOOLEAN NOT NULL DEFAULT true,
    "captionsBurned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaExportPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaPipelineJob" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "inputAssetId" TEXT,
    "timelineVersionId" TEXT,
    "outputAssetId" TEXT,
    "previewApprovalId" TEXT,
    "jobType" TEXT NOT NULL,
    "preset" JSONB,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "cancelRequestedAt" TIMESTAMP(3),
    "providersTried" TEXT[],
    "providerId" TEXT,
    "providerJobId" TEXT,
    "providerReceipt" JSONB,
    "error" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaPipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaJobAttempt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "requestDigest" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerJobId" TEXT,
    "errorCode" TEXT,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MediaJobAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaProvider" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerKind" TEXT NOT NULL,
    "capabilities" TEXT[],
    "configEncrypted" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "costWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxInputBytes" BIGINT NOT NULL,
    "dailyQuota" INTEGER NOT NULL,
    "usageDate" TEXT,
    "usedToday" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaProviderEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "providerJobId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadDigest" TEXT NOT NULL,
    "signatureDigest" TEXT NOT NULL,
    "mediaJobId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MediaProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_email_key" ON "Business"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_number_key" ON "PhoneNumber"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Call_callSid_key" ON "Call"("callSid");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_date_businessId_key" ON "DailyAnalytics"("date", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AgentKnowledge_agentId_idx" ON "AgentKnowledge"("agentId");

-- CreateIndex
CREATE INDEX "AiResult_businessId_feature_idx" ON "AiResult"("businessId", "feature");

-- CreateIndex
CREATE INDEX "AiResult_feature_createdAt_idx" ON "AiResult"("feature", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");

-- CreateIndex
CREATE INDEX "VsEnrollment_businessId_idx" ON "VsEnrollment"("businessId");

-- CreateIndex
CREATE INDEX "VsEnrollment_businessId_subjectId_idx" ON "VsEnrollment"("businessId", "subjectId");

-- CreateIndex
CREATE INDEX "VsEnrollment_status_idx" ON "VsEnrollment"("status");

-- CreateIndex
CREATE INDEX "VsEnrollmentSample_enrollmentId_idx" ON "VsEnrollmentSample"("enrollmentId");

-- CreateIndex
CREATE INDEX "VsConsentEvent_businessId_subjectId_idx" ON "VsConsentEvent"("businessId", "subjectId");

-- CreateIndex
CREATE INDEX "VsConsentEvent_enrollmentId_idx" ON "VsConsentEvent"("enrollmentId");

-- CreateIndex
CREATE INDEX "VsConsentEvent_eventType_idx" ON "VsConsentEvent"("eventType");

-- CreateIndex
CREATE INDEX "VsTtsStyle_businessId_idx" ON "VsTtsStyle"("businessId");

-- CreateIndex
CREATE INDEX "VsTtsStyle_businessId_name_idx" ON "VsTtsStyle"("businessId", "name");

-- CreateIndex
CREATE INDEX "VsAvatarRenderJob_businessId_idx" ON "VsAvatarRenderJob"("businessId");

-- CreateIndex
CREATE INDEX "VsAvatarRenderJob_businessId_status_idx" ON "VsAvatarRenderJob"("businessId", "status");

-- CreateIndex
CREATE INDEX "VsLipsyncJob_businessId_idx" ON "VsLipsyncJob"("businessId");

-- CreateIndex
CREATE INDEX "VsLipsyncJob_renderJobId_idx" ON "VsLipsyncJob"("renderJobId");

-- CreateIndex
CREATE INDEX "VsDubbingJob_businessId_idx" ON "VsDubbingJob"("businessId");

-- CreateIndex
CREATE INDEX "VsDubbingJob_status_idx" ON "VsDubbingJob"("status");

-- CreateIndex
CREATE INDEX "VsProvenanceRecord_businessId_idx" ON "VsProvenanceRecord"("businessId");

-- CreateIndex
CREATE INDEX "VsProvenanceRecord_businessId_assetType_idx" ON "VsProvenanceRecord"("businessId", "assetType");

-- CreateIndex
CREATE INDEX "MediaAsset_businessId_state_createdAt_idx" ON "MediaAsset"("businessId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_businessId_sha256_idx" ON "MediaAsset"("businessId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_businessId_objectKey_key" ON "MediaAsset"("businessId", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaUploadSession_gatewayTicketId_key" ON "MediaUploadSession"("gatewayTicketId");

-- CreateIndex
CREATE INDEX "MediaUploadSession_assetId_status_idx" ON "MediaUploadSession"("assetId", "status");

-- CreateIndex
CREATE INDEX "MediaUploadSession_status_expiresAt_idx" ON "MediaUploadSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaUploadSession_businessId_idempotencyKey_key" ON "MediaUploadSession"("businessId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "MediaTimeline_businessId_state_updatedAt_idx" ON "MediaTimeline"("businessId", "state", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTimeline_businessId_slug_key" ON "MediaTimeline"("businessId", "slug");

-- CreateIndex
CREATE INDEX "MediaTimelineVersion_businessId_timelineId_createdAt_idx" ON "MediaTimelineVersion"("businessId", "timelineId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTimelineVersion_timelineId_version_key" ON "MediaTimelineVersion"("timelineId", "version");

-- CreateIndex
CREATE INDEX "MediaPreviewApproval_businessId_timelineVersionId_status_idx" ON "MediaPreviewApproval"("businessId", "timelineVersionId", "status");

-- CreateIndex
CREATE INDEX "MediaPreviewApproval_previewAssetId_idx" ON "MediaPreviewApproval"("previewAssetId");

-- CreateIndex
CREATE INDEX "MediaCaptionTrack_businessId_assetId_idx" ON "MediaCaptionTrack"("businessId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCaptionTrack_assetId_language_format_key" ON "MediaCaptionTrack"("assetId", "language", "format");

-- CreateIndex
CREATE INDEX "MediaExportPreset_businessId_isActive_idx" ON "MediaExportPreset"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MediaExportPreset_businessId_name_key" ON "MediaExportPreset"("businessId", "name");

-- CreateIndex
CREATE INDEX "MediaPipelineJob_status_availableAt_idx" ON "MediaPipelineJob"("status", "availableAt");

-- CreateIndex
CREATE INDEX "MediaPipelineJob_businessId_createdAt_idx" ON "MediaPipelineJob"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaPipelineJob_inputAssetId_status_idx" ON "MediaPipelineJob"("inputAssetId", "status");

-- CreateIndex
CREATE INDEX "MediaPipelineJob_timelineVersionId_status_idx" ON "MediaPipelineJob"("timelineVersionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MediaPipelineJob_businessId_idempotencyKey_key" ON "MediaPipelineJob"("businessId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaPipelineJob_providerId_providerJobId_key" ON "MediaPipelineJob"("providerId", "providerJobId");

-- CreateIndex
CREATE INDEX "MediaJobAttempt_providerId_startedAt_idx" ON "MediaJobAttempt"("providerId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaJobAttempt_jobId_attempt_key" ON "MediaJobAttempt"("jobId", "attempt");

-- CreateIndex
CREATE INDEX "MediaProvider_businessId_status_priority_idx" ON "MediaProvider"("businessId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "MediaProvider_businessId_name_key" ON "MediaProvider"("businessId", "name");

-- CreateIndex
CREATE INDEX "MediaProviderEvent_mediaJobId_receivedAt_idx" ON "MediaProviderEvent"("mediaJobId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaProviderEvent_providerId_eventId_key" ON "MediaProviderEvent"("providerId", "eventId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageBilling" ADD CONSTRAINT "UsageBilling_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseLibrary" ADD CONSTRAINT "ResponseLibrary_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallFlow" ADD CONSTRAINT "CallFlow_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallFlowNode" ADD CONSTRAINT "CallFlowNode_callFlowId_fkey" FOREIGN KEY ("callFlowId") REFERENCES "CallFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRoutingRule" ADD CONSTRAINT "CallRoutingRule_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallMessage" ADD CONSTRAINT "CallMessage_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignContact" ADD CONSTRAINT "CampaignContact_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VsEnrollmentSample" ADD CONSTRAINT "VsEnrollmentSample_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "VsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VsConsentEvent" ADD CONSTRAINT "VsConsentEvent_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "VsEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VsLipsyncJob" ADD CONSTRAINT "VsLipsyncJob_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "VsAvatarRenderJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
