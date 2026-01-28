export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  businessId: string;
  isActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  timezone: string;
  isActive: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  voiceId?: string;
  voiceName: string;
  voiceProvider: string;
  voiceSpeed: number;
  voicePitch: number;
  personalityType: string;
  greeting: string;
  fallbackMessage: string;
  transferMessage: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  primaryLanguage: string;
  supportedLanguages: string[];
  businessId: string;
}

export interface Voice {
  id: string;
  name: string;
  provider: string;
  voiceId: string;
  language: string;
  gender: string;
  description?: string;
  sampleUrl?: string;
  isActive: boolean;
}

export interface Script {
  id: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  tags: string[];
  isActive: boolean;
  agentId: string;
}

export interface ResponseLibrary {
  id: string;
  trigger: string;
  response: string;
  category?: string;
  priority: number;
  isActive: boolean;
  agentId: string;
}

export interface CallFlow {
  id: string;
  name: string;
  description?: string;
  flowData: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  agentId: string;
}

export interface PhoneNumber {
  id: string;
  number: string;
  displayName?: string;
  country: string;
  type: string;
  provider: string;
  status: string;
  callHandling: string;
  forwardTo?: string;
  voicemailEnabled: boolean;
  recordingEnabled: boolean;
  businessId: string;
  agentId?: string;
}

export interface Call {
  id: string;
  callSid?: string;
  direction: string;
  status: string;
  from: string;
  to: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  sentiment?: string;
  sentimentScore?: number;
  intent?: string;
  summary?: string;
  outcome?: string;
  wasTransferred: boolean;
  hasVoicemail: boolean;
  businessId: string;
  phoneNumberId?: string;
  agentId?: string;
}

export interface Integration {
  id: string;
  type: string;
  provider: string;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt?: Date;
  businessId: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  businessId: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  businessId: string;
}

export interface DailyAnalytics {
  id: string;
  date: Date;
  businessId: string;
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  totalDuration: number;
  resolvedCalls: number;
  transferredCalls: number;
  voicemailCalls: number;
  abandonedCalls: number;
  positiveSentiment: number;
  negativeSentiment: number;
  neutralSentiment: number;
  avgSentimentScore: number;
  conversions: number;
  conversionRate: number;
}

export interface CallFlowNode {
  id: string;
  type: 'greeting' | 'menu' | 'input' | 'transfer' | 'voicemail' | 'hangup' | 'condition' | 'ai-response';
  name: string;
  content?: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface CallFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export type IntegrationType = 'calendar' | 'crm' | 'booking' | 'payment' | 'sms';

export type IntegrationProvider =
  | 'google-calendar'
  | 'outlook'
  | 'salesforce'
  | 'hubspot'
  | 'calendly'
  | 'stripe'
  | 'twilio-sms';

export interface WebhookEvent {
  type: string;
  label: string;
  description: string;
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  { type: 'call.started', label: 'Call Started', description: 'Triggered when a new call begins' },
  { type: 'call.ended', label: 'Call Ended', description: 'Triggered when a call ends' },
  { type: 'call.transferred', label: 'Call Transferred', description: 'Triggered when a call is transferred' },
  { type: 'call.voicemail', label: 'Voicemail Received', description: 'Triggered when a voicemail is left' },
  { type: 'call.transcribed', label: 'Call Transcribed', description: 'Triggered when transcription is complete' },
  { type: 'agent.created', label: 'Agent Created', description: 'Triggered when a new agent is created' },
  { type: 'agent.updated', label: 'Agent Updated', description: 'Triggered when an agent is updated' },
];
