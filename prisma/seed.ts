import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with comprehensive data...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  // ============================================
  // 1. VOICES (15+ items)
  // ============================================
  console.log('Creating voices...');
  const voicesData = [
    { name: 'Sarah', provider: 'system', voiceId: 'sarah-default', language: 'en', gender: 'female', description: 'Professional female voice with American accent', sampleUrl: '/audio/sarah-preview.mp3' },
    { name: 'James', provider: 'system', voiceId: 'james-default', language: 'en', gender: 'male', description: 'Professional male voice with American accent', sampleUrl: '/audio/james-preview.mp3' },
    { name: 'Emma', provider: 'system', voiceId: 'emma-default', language: 'en', gender: 'female', description: 'Friendly female voice with British accent', sampleUrl: '/audio/emma-preview.mp3' },
    { name: 'Michael', provider: 'system', voiceId: 'michael-default', language: 'en', gender: 'male', description: 'Friendly male voice with British accent', sampleUrl: '/audio/michael-preview.mp3' },
    { name: 'Sofia', provider: 'system', voiceId: 'sofia-default', language: 'es', gender: 'female', description: 'Professional female voice for Spanish', sampleUrl: '/audio/sofia-preview.mp3' },
    { name: 'Carlos', provider: 'system', voiceId: 'carlos-default', language: 'es', gender: 'male', description: 'Professional male voice for Spanish', sampleUrl: '/audio/carlos-preview.mp3' },
    { name: 'Marie', provider: 'system', voiceId: 'marie-default', language: 'fr', gender: 'female', description: 'Elegant female voice for French', sampleUrl: '/audio/marie-preview.mp3' },
    { name: 'Hans', provider: 'system', voiceId: 'hans-default', language: 'de', gender: 'male', description: 'Professional male voice for German', sampleUrl: '/audio/hans-preview.mp3' },
    { name: 'Yuki', provider: 'system', voiceId: 'yuki-default', language: 'ja', gender: 'female', description: 'Professional female voice for Japanese', sampleUrl: '/audio/yuki-preview.mp3' },
    { name: 'Wei', provider: 'system', voiceId: 'wei-default', language: 'zh', gender: 'male', description: 'Professional male voice for Chinese', sampleUrl: '/audio/wei-preview.mp3' },
    { name: 'Maria', provider: 'elevenlabs', voiceId: 'EXAVITQu4vr4xnSDxMaL', language: 'en', gender: 'female', description: 'Premium AI voice by ElevenLabs - warm and engaging', sampleUrl: null },
    { name: 'Adam', provider: 'elevenlabs', voiceId: 'pNInz6obpgDQGcFmaJgB', language: 'en', gender: 'male', description: 'Premium AI voice by ElevenLabs - deep and professional', sampleUrl: null },
    { name: 'Rachel', provider: 'elevenlabs', voiceId: '21m00Tcm4TlvDq8ikWAM', language: 'en', gender: 'female', description: 'Premium AI voice by ElevenLabs - calm and soothing', sampleUrl: null },
    { name: 'Bella', provider: 'azure', voiceId: 'en-US-JennyNeural', language: 'en', gender: 'female', description: 'Azure Neural voice - natural and expressive', sampleUrl: null },
    { name: 'Ryan', provider: 'azure', voiceId: 'en-US-GuyNeural', language: 'en', gender: 'male', description: 'Azure Neural voice - confident and clear', sampleUrl: null },
    { name: 'Aria', provider: 'azure', voiceId: 'en-US-AriaNeural', language: 'en', gender: 'female', description: 'Azure Neural voice - versatile and friendly', sampleUrl: null },
    { name: 'Wavenet-A', provider: 'google', voiceId: 'en-US-Wavenet-A', language: 'en', gender: 'male', description: 'Google WaveNet voice - high quality synthesis', sampleUrl: null },
    { name: 'Wavenet-C', provider: 'google', voiceId: 'en-US-Wavenet-C', language: 'en', gender: 'female', description: 'Google WaveNet voice - natural intonation', sampleUrl: null },
  ];

  for (const voice of voicesData) {
    await prisma.voice.upsert({
      where: { id: voice.voiceId },
      update: voice,
      create: voice,
    });
  }
  console.log(`Created ${voicesData.length} voices`);

  // ============================================
  // 2. BUSINESSES (15+ items)
  // ============================================
  console.log('Creating businesses...');
  const businessesData = [
    { name: 'TechCorp Solutions', email: 'admin@techcorp.com', phone: '+14155551001', industry: 'Technology', timezone: 'America/Los_Angeles', website: 'https://techcorp.com', address: '100 Tech Blvd, San Francisco, CA 94105' },
    { name: 'HealthFirst Medical', email: 'admin@healthfirst.com', phone: '+12125551002', industry: 'Healthcare', timezone: 'America/New_York', website: 'https://healthfirst.com', address: '200 Medical Center Dr, New York, NY 10001' },
    { name: 'AutoMax Dealership', email: 'admin@automax.com', phone: '+13135551003', industry: 'Automotive', timezone: 'America/Detroit', website: 'https://automax.com', address: '300 Auto Row, Detroit, MI 48201' },
    { name: 'LegalEase Law Firm', email: 'admin@legalease.com', phone: '+13125551004', industry: 'Legal', timezone: 'America/Chicago', website: 'https://legalease.com', address: '400 Legal Plaza, Chicago, IL 60601' },
    { name: 'EduBright Academy', email: 'admin@edubright.com', phone: '+16175551005', industry: 'Education', timezone: 'America/New_York', website: 'https://edubright.com', address: '500 Campus Way, Boston, MA 02101' },
    { name: 'FinanceWise Bank', email: 'admin@financewise.com', phone: '+17045551006', industry: 'Finance', timezone: 'America/New_York', website: 'https://financewise.com', address: '600 Banking Center, Charlotte, NC 28201' },
    { name: 'TravelJoy Agency', email: 'admin@traveljoy.com', phone: '+17865551007', industry: 'Travel', timezone: 'America/New_York', website: 'https://traveljoy.com', address: '700 Travel Way, Miami, FL 33101' },
    { name: 'FoodDeluxe Restaurant', email: 'admin@fooddeluxe.com', phone: '+17025551008', industry: 'Restaurant', timezone: 'America/Los_Angeles', website: 'https://fooddeluxe.com', address: '800 Gourmet St, Las Vegas, NV 89101' },
    { name: 'RealtyPro Properties', email: 'admin@realtypro.com', phone: '+14805551009', industry: 'Real Estate', timezone: 'America/Phoenix', website: 'https://realtypro.com', address: '900 Property Lane, Phoenix, AZ 85001' },
    { name: 'InsureAll Agency', email: 'admin@insureall.com', phone: '+12145551010', industry: 'Insurance', timezone: 'America/Chicago', website: 'https://insureall.com', address: '1000 Insurance Blvd, Dallas, TX 75201' },
    { name: 'RetailHub Stores', email: 'admin@retailhub.com', phone: '+12065551011', industry: 'Retail', timezone: 'America/Los_Angeles', website: 'https://retailhub.com', address: '1100 Shopping Center, Seattle, WA 98101' },
    { name: 'ConsultPro Advisors', email: 'admin@consultpro.com', phone: '+14045551012', industry: 'Consulting', timezone: 'America/New_York', website: 'https://consultpro.com', address: '1200 Business Park, Atlanta, GA 30301' },
    { name: 'MediaMax Productions', email: 'admin@mediamax.com', phone: '+13235551013', industry: 'Media', timezone: 'America/Los_Angeles', website: 'https://mediamax.com', address: '1300 Studio Way, Los Angeles, CA 90001' },
    { name: 'GymFit Wellness', email: 'admin@gymfit.com', phone: '+13035551014', industry: 'Fitness', timezone: 'America/Denver', website: 'https://gymfit.com', address: '1400 Fitness Ave, Denver, CO 80201' },
    { name: 'Demo Company', email: 'demo@aivoiceagent.com', phone: '+1234567890', industry: 'Technology', timezone: 'America/New_York', website: 'https://demo.aivoiceagent.com', address: '123 Demo Street, New York, NY 10001' },
    { name: 'CloudTech Services', email: 'admin@cloudtech.com', phone: '+15035551015', industry: 'Technology', timezone: 'America/Los_Angeles', website: 'https://cloudtech.com', address: '1500 Cloud Way, Portland, OR 97201' },
  ];

  const businesses: any[] = [];
  for (const biz of businessesData) {
    const business = await prisma.business.upsert({
      where: { email: biz.email },
      update: biz,
      create: biz,
    });
    businesses.push(business);
  }
  const demoBusiness = businesses.find(b => b.email === 'demo@aivoiceagent.com')!;
  console.log(`Created ${businesses.length} businesses`);

  // ============================================
  // 3. USERS (15+ items)
  // ============================================
  console.log('Creating users...');
  const usersData: { email: string; name: string; role: UserRole; businessId: string }[] = [
    { email: 'admin@aivoiceagent.com', name: 'Admin User', role: UserRole.ADMIN, businessId: demoBusiness.id },
    { email: 'john.smith@techcorp.com', name: 'John Smith', role: UserRole.OWNER, businessId: businesses[0].id },
    { email: 'sarah.jones@healthfirst.com', name: 'Sarah Jones', role: UserRole.OWNER, businessId: businesses[1].id },
    { email: 'mike.wilson@automax.com', name: 'Mike Wilson', role: UserRole.OWNER, businessId: businesses[2].id },
    { email: 'lisa.brown@legalease.com', name: 'Lisa Brown', role: UserRole.OWNER, businessId: businesses[3].id },
    { email: 'david.lee@edubright.com', name: 'David Lee', role: UserRole.OWNER, businessId: businesses[4].id },
    { email: 'emily.davis@financewise.com', name: 'Emily Davis', role: UserRole.OWNER, businessId: businesses[5].id },
    { email: 'robert.taylor@traveljoy.com', name: 'Robert Taylor', role: UserRole.OWNER, businessId: businesses[6].id },
    { email: 'jennifer.martinez@fooddeluxe.com', name: 'Jennifer Martinez', role: UserRole.OWNER, businessId: businesses[7].id },
    { email: 'james.anderson@realtypro.com', name: 'James Anderson', role: UserRole.OWNER, businessId: businesses[8].id },
    { email: 'manager@aivoiceagent.com', name: 'Demo Manager', role: UserRole.MANAGER, businessId: demoBusiness.id },
    { email: 'agent1@aivoiceagent.com', name: 'Agent One', role: UserRole.USER, businessId: demoBusiness.id },
    { email: 'agent2@aivoiceagent.com', name: 'Agent Two', role: UserRole.USER, businessId: demoBusiness.id },
    { email: 'supervisor@techcorp.com', name: 'Tech Supervisor', role: UserRole.MANAGER, businessId: businesses[0].id },
    { email: 'support@techcorp.com', name: 'Tech Support', role: UserRole.USER, businessId: businesses[0].id },
    { email: 'operator@healthfirst.com', name: 'Health Operator', role: UserRole.USER, businessId: businesses[1].id },
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, role: userData.role, businessId: userData.businessId, password: hashedPassword },
      create: { email: userData.email, name: userData.name, role: userData.role, businessId: userData.businessId, password: hashedPassword },
    });
  }
  console.log(`Created ${usersData.length} users`);

  // ============================================
  // 4. AGENTS (15+ items)
  // ============================================
  console.log('Creating agents...');
  const agentsData = [
    { id: 'agent-cs-main', name: 'Customer Support Agent', description: 'Handles general customer inquiries and support requests', voiceName: 'Sarah', personalityType: 'professional', greeting: 'Hello! Thank you for calling. How may I assist you today?', fallbackMessage: "I apologize, but I didn't quite catch that. Could you please repeat your question?", transferMessage: "I'll connect you with a human representative right away.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-sales-main', name: 'Sales Agent', description: 'Handles sales inquiries and product information', voiceName: 'James', personalityType: 'friendly', greeting: 'Hi there! Thanks for your interest in our products. How can I help you today?', fallbackMessage: "I'm sorry, could you rephrase that?", transferMessage: "Let me connect you with a sales specialist.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-billing', name: 'Billing Support Agent', description: 'Assists with billing and payment inquiries', voiceName: 'Emma', personalityType: 'professional', greeting: 'Hello! This is billing support. How may I help you with your account?', fallbackMessage: "I didn't understand that. Could you please clarify?", transferMessage: "I'll transfer you to our billing department.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-tech-support', name: 'Technical Support Agent', description: 'Provides technical assistance and troubleshooting', voiceName: 'Michael', personalityType: 'professional', greeting: 'Hello! Technical support here. What issue are you experiencing?', fallbackMessage: "Could you please describe the problem again?", transferMessage: "I'll connect you with a technical specialist.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-appointment', name: 'Appointment Scheduler', description: 'Books and manages appointments', voiceName: 'Sofia', personalityType: 'friendly', greeting: 'Hi! I can help you schedule an appointment. When would you like to come in?', fallbackMessage: "I'm sorry, could you repeat the date and time?", transferMessage: "Let me transfer you to our scheduling team.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-after-hours', name: 'After Hours Agent', description: 'Handles calls outside business hours', voiceName: 'Rachel', personalityType: 'professional', greeting: 'Thank you for calling. Our office is currently closed. I can take a message or help with basic inquiries.', fallbackMessage: "I apologize, I didn't catch that.", transferMessage: "Please leave a message and we'll return your call.", businessId: demoBusiness.id, isActive: true },
    { id: 'agent-spanish', name: 'Spanish Support Agent', description: 'Provides customer support in Spanish', voiceName: 'Carlos', personalityType: 'friendly', greeting: 'Hola! Gracias por llamar. Como puedo ayudarle hoy?', fallbackMessage: "Disculpe, no entendi. Puede repetir?", transferMessage: "Le voy a transferir a un representante.", businessId: demoBusiness.id, isActive: true, primaryLanguage: 'es' },
    { id: 'agent-healthcare', name: 'Healthcare Receptionist', description: 'Handles medical office calls', voiceName: 'Bella', personalityType: 'professional', greeting: 'Thank you for calling our medical office. How may I assist you?', fallbackMessage: "Could you please repeat that?", transferMessage: "I'll connect you with the appropriate department.", businessId: businesses[1].id, isActive: true },
    { id: 'agent-auto-service', name: 'Auto Service Advisor', description: 'Handles service appointments and inquiries', voiceName: 'Ryan', personalityType: 'friendly', greeting: 'Hi! Welcome to our service department. How can I help you today?', fallbackMessage: "Sorry, I didn't catch that.", transferMessage: "Let me transfer you to a service advisor.", businessId: businesses[2].id, isActive: true },
    { id: 'agent-legal-intake', name: 'Legal Intake Specialist', description: 'Handles initial legal consultation calls', voiceName: 'Aria', personalityType: 'formal', greeting: 'Thank you for contacting our law firm. How may I direct your call?', fallbackMessage: "I apologize, could you please repeat that?", transferMessage: "I'll connect you with an attorney.", businessId: businesses[3].id, isActive: true },
    { id: 'agent-edu-admissions', name: 'Admissions Counselor', description: 'Handles enrollment and admission inquiries', voiceName: 'Maria', personalityType: 'friendly', greeting: 'Hi! Thanks for your interest in our academy. How can I help you?', fallbackMessage: "Could you please clarify your question?", transferMessage: "I'll transfer you to admissions.", businessId: businesses[4].id, isActive: true },
    { id: 'agent-finance-support', name: 'Banking Support Agent', description: 'Assists with banking inquiries', voiceName: 'Adam', personalityType: 'professional', greeting: 'Thank you for calling. How may I help with your banking needs?', fallbackMessage: "I'm sorry, I didn't understand that.", transferMessage: "I'll transfer you to a banking specialist.", businessId: businesses[5].id, isActive: true },
    { id: 'agent-travel-booking', name: 'Travel Booking Agent', description: 'Helps with travel reservations', voiceName: 'Emma', personalityType: 'friendly', greeting: 'Hello! Ready to plan your next adventure? How can I assist?', fallbackMessage: "Could you repeat your travel dates?", transferMessage: "Let me connect you with a travel specialist.", businessId: businesses[6].id, isActive: true },
    { id: 'agent-restaurant', name: 'Restaurant Host', description: 'Handles reservations and inquiries', voiceName: 'Sofia', personalityType: 'friendly', greeting: 'Thank you for calling! Would you like to make a reservation?', fallbackMessage: "I'm sorry, could you repeat the party size and time?", transferMessage: "I'll connect you with our host.", businessId: businesses[7].id, isActive: true },
    { id: 'agent-realestate', name: 'Real Estate Agent', description: 'Handles property inquiries', voiceName: 'James', personalityType: 'professional', greeting: 'Hello! Interested in a property? I can help you find your dream home.', fallbackMessage: "Could you repeat the property details?", transferMessage: "I'll connect you with an agent.", businessId: businesses[8].id, isActive: true },
    { id: 'agent-insurance', name: 'Insurance Advisor', description: 'Handles insurance inquiries and claims', voiceName: 'Sarah', personalityType: 'professional', greeting: 'Thank you for calling. How may I help with your insurance needs?', fallbackMessage: "I apologize, could you please repeat that?", transferMessage: "I'll transfer you to a claims specialist.", businessId: businesses[9].id, isActive: true },
  ];

  const agents: any[] = [];
  for (const agentData of agentsData) {
    const agent = await prisma.agent.upsert({
      where: { id: agentData.id },
      update: agentData,
      create: agentData,
    });
    agents.push(agent);
  }
  const mainAgent = agents[0];
  console.log(`Created ${agents.length} agents`);

  // ============================================
  // 5. SCRIPTS (15+ items)
  // ============================================
  console.log('Creating scripts...');
  const scriptsData = [
    { id: 'script-greeting-main', name: 'Main Greeting', description: 'Standard greeting for incoming calls', content: 'Thank you for calling [Company Name]. My name is [Agent Name]. How may I help you today?', category: 'Greeting', agentId: mainAgent.id },
    { id: 'script-greeting-sales', name: 'Sales Greeting', description: 'Greeting for sales inquiries', content: 'Hi! Thanks for your interest in our products. I am here to help you find the perfect solution.', category: 'Greeting', agentId: agents[1].id },
    { id: 'script-after-hours', name: 'After Hours Message', description: 'Message for calls outside business hours', content: 'Thank you for calling. Our office is currently closed. Business hours are Monday through Friday, 9 AM to 5 PM Eastern Time. Please leave a message.', category: 'Voicemail', agentId: mainAgent.id },
    { id: 'script-holiday', name: 'Holiday Message', description: 'Message for holiday closures', content: 'Happy holidays from [Company Name]! Our office is closed for the holiday. We will return on [Date]. Please leave a message.', category: 'Voicemail', agentId: mainAgent.id },
    { id: 'script-hold-music', name: 'Hold Message', description: 'Message while caller is on hold', content: 'Thank you for your patience. Your call is important to us. A representative will be with you shortly.', category: 'Hold', agentId: mainAgent.id },
    { id: 'script-transfer-warm', name: 'Warm Transfer', description: 'Message before transferring call', content: 'I am going to transfer you to [Department] who can better assist you. Please hold while I connect you.', category: 'Transfer', agentId: mainAgent.id },
    { id: 'script-voicemail-prompt', name: 'Voicemail Prompt', description: 'Prompt for leaving voicemail', content: 'Please leave your name, phone number, and a brief message after the tone. We will return your call within 24 hours.', category: 'Voicemail', agentId: mainAgent.id },
    { id: 'script-callback-offer', name: 'Callback Offer', description: 'Offering callback option', content: 'All of our representatives are currently busy. Would you like us to call you back when one becomes available?', category: 'General', agentId: mainAgent.id },
    { id: 'script-survey-intro', name: 'Survey Introduction', description: 'Post-call survey introduction', content: 'Before you go, would you mind taking a brief survey about your experience today? It will only take a moment.', category: 'Survey', agentId: mainAgent.id },
    { id: 'script-closing', name: 'Call Closing', description: 'Standard call closing message', content: 'Thank you for calling [Company Name]. Is there anything else I can help you with today? Have a great day!', category: 'Closing', agentId: mainAgent.id },
    { id: 'script-escalation', name: 'Escalation Message', description: 'When transferring to supervisor', content: 'I understand your concern. Let me connect you with a supervisor who can better assist you.', category: 'Transfer', agentId: mainAgent.id },
    { id: 'script-appointment-confirm', name: 'Appointment Confirmation', description: 'Confirming appointment details', content: 'Great! I have you scheduled for [Date] at [Time]. You will receive a confirmation email shortly.', category: 'Appointment', agentId: agents[4].id },
    { id: 'script-payment-reminder', name: 'Payment Reminder', description: 'Reminder about payment due', content: 'This is a reminder that your payment of [Amount] is due on [Date]. Would you like to make a payment now?', category: 'Billing', agentId: agents[2].id },
    { id: 'script-tech-troubleshoot', name: 'Troubleshooting Start', description: 'Beginning technical troubleshooting', content: 'I will help you troubleshoot the issue. First, can you tell me what device you are using?', category: 'Support', agentId: agents[3].id },
    { id: 'script-verify-identity', name: 'Identity Verification', description: 'Verifying caller identity', content: 'For security purposes, I need to verify your identity. Can you please provide your account number or the last four digits of your phone number?', category: 'Security', agentId: mainAgent.id },
    { id: 'script-spanish-greeting', name: 'Spanish Greeting', description: 'Greeting in Spanish', content: 'Gracias por llamar a [Company Name]. Mi nombre es [Agent Name]. Como puedo ayudarle hoy?', category: 'Greeting', agentId: agents[6].id },
  ];

  for (const scriptData of scriptsData) {
    await prisma.script.upsert({
      where: { id: scriptData.id },
      update: scriptData,
      create: scriptData,
    });
  }
  console.log(`Created ${scriptsData.length} scripts`);

  // ============================================
  // 6. RESPONSE LIBRARY (15+ items)
  // ============================================
  console.log('Creating response library...');
  const responsesData = [
    { id: 'resp-hours', trigger: 'hours', response: 'Our business hours are Monday through Friday, 9 AM to 5 PM Eastern Time.', category: 'General', agentId: mainAgent.id },
    { id: 'resp-location', trigger: 'location', response: 'We are located at 123 Main Street, New York, NY 10001.', category: 'General', agentId: mainAgent.id },
    { id: 'resp-pricing', trigger: 'pricing', response: 'I can help you with pricing information. Our plans start at $29 per month. Would you like details on specific plans?', category: 'Sales', agentId: mainAgent.id },
    { id: 'resp-support', trigger: 'support', response: 'I am here to help with any issues. Could you describe the problem you are experiencing?', category: 'Support', agentId: mainAgent.id },
    { id: 'resp-refund', trigger: 'refund', response: 'I understand you would like to request a refund. Let me transfer you to billing who can assist with that.', category: 'Billing', agentId: mainAgent.id },
    { id: 'resp-cancel', trigger: 'cancel', response: 'I am sorry to hear you want to cancel. May I ask what prompted this decision?', category: 'Retention', agentId: mainAgent.id },
    { id: 'resp-appointment', trigger: 'appointment', response: 'I can help you schedule an appointment. What date and time works best for you?', category: 'Scheduling', agentId: mainAgent.id },
    { id: 'resp-status', trigger: 'order status', response: 'I can check your order status. May I have your order number or email address?', category: 'Orders', agentId: mainAgent.id },
    { id: 'resp-shipping', trigger: 'shipping', response: 'Standard shipping takes 3-5 business days. Express shipping is available for an additional fee.', category: 'Orders', agentId: mainAgent.id },
    { id: 'resp-return', trigger: 'return', response: 'Our return policy allows returns within 30 days of purchase with receipt. Would you like to initiate a return?', category: 'Orders', agentId: mainAgent.id },
    { id: 'resp-password', trigger: 'password', response: 'I can help you reset your password. I will send a reset link to your registered email address.', category: 'Support', agentId: mainAgent.id },
    { id: 'resp-discount', trigger: 'discount', response: 'We currently have a 20% discount for new customers. Would you like me to apply that to your order?', category: 'Sales', agentId: mainAgent.id },
    { id: 'resp-payment-methods', trigger: 'payment methods', response: 'We accept Visa, MasterCard, American Express, and PayPal. Which would you prefer?', category: 'Billing', agentId: mainAgent.id },
    { id: 'resp-warranty', trigger: 'warranty', response: 'All our products come with a 1-year manufacturer warranty. Extended warranties are also available.', category: 'Support', agentId: mainAgent.id },
    { id: 'resp-callback', trigger: 'callback', response: 'I can schedule a callback for you. What phone number and time work best?', category: 'General', agentId: mainAgent.id },
    { id: 'resp-complaint', trigger: 'complaint', response: 'I am sorry to hear about your experience. Let me connect you with a supervisor who can help resolve this.', category: 'Escalation', agentId: mainAgent.id },
    { id: 'resp-feedback', trigger: 'feedback', response: 'We appreciate your feedback! Your comments help us improve our service.', category: 'General', agentId: mainAgent.id },
  ];

  for (const respData of responsesData) {
    await prisma.responseLibrary.upsert({
      where: { id: respData.id },
      update: respData,
      create: respData,
    });
  }
  console.log(`Created ${responsesData.length} responses`);

  // ============================================
  // 7. CALL FLOWS (15+ items)
  // ============================================
  console.log('Creating call flows...');
  const callFlowsData = [
    { id: 'flow-main-ivr', name: 'Main IVR Flow', description: 'Primary call flow for incoming calls', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Welcome' }, { id: '2', type: 'menu', name: 'Main Menu', options: ['Sales', 'Support', 'Billing'] }, { id: '3', type: 'transfer', name: 'Transfer' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: mainAgent.id },
    { id: 'flow-sales', name: 'Sales Flow', description: 'Flow for sales inquiries', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Sales Welcome' }, { id: '2', type: 'question', name: 'Product Interest' }, { id: '3', type: 'response', name: 'Product Info' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[1].id },
    { id: 'flow-support', name: 'Support Flow', description: 'Flow for technical support', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Support Welcome' }, { id: '2', type: 'question', name: 'Issue Type' }, { id: '3', type: 'troubleshoot', name: 'Troubleshooting' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[3].id },
    { id: 'flow-billing', name: 'Billing Flow', description: 'Flow for billing inquiries', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Billing Welcome' }, { id: '2', type: 'verify', name: 'Account Verify' }, { id: '3', type: 'menu', name: 'Billing Options' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[2].id },
    { id: 'flow-appointment', name: 'Appointment Flow', description: 'Flow for scheduling appointments', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Schedule Welcome' }, { id: '2', type: 'datetime', name: 'Select DateTime' }, { id: '3', type: 'confirm', name: 'Confirm Appointment' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[4].id },
    { id: 'flow-after-hours', name: 'After Hours Flow', description: 'Flow for calls outside business hours', isDefault: false, flowData: { nodes: [{ id: '1', type: 'message', name: 'Closed Message' }, { id: '2', type: 'voicemail', name: 'Leave Message' }], edges: [{ from: '1', to: '2' }] }, agentId: agents[5].id },
    { id: 'flow-emergency', name: 'Emergency Flow', description: 'Flow for urgent situations', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Emergency Welcome' }, { id: '2', type: 'transfer', name: 'Immediate Transfer' }], edges: [{ from: '1', to: '2' }] }, agentId: mainAgent.id },
    { id: 'flow-survey', name: 'Post-Call Survey', description: 'Customer satisfaction survey', isDefault: false, flowData: { nodes: [{ id: '1', type: 'question', name: 'Rating Question' }, { id: '2', type: 'question', name: 'Feedback' }, { id: '3', type: 'thanks', name: 'Thank You' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: mainAgent.id },
    { id: 'flow-spanish', name: 'Spanish IVR Flow', description: 'Spanish language call flow', isDefault: false, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Bienvenido' }, { id: '2', type: 'menu', name: 'Menu Principal' }], edges: [{ from: '1', to: '2' }] }, agentId: agents[6].id },
    { id: 'flow-healthcare', name: 'Healthcare Flow', description: 'Medical office call flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Medical Welcome' }, { id: '2', type: 'menu', name: 'Department Menu' }], edges: [{ from: '1', to: '2' }] }, agentId: agents[7].id },
    { id: 'flow-auto-service', name: 'Auto Service Flow', description: 'Auto dealership service flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Service Welcome' }, { id: '2', type: 'datetime', name: 'Service Appointment' }], edges: [{ from: '1', to: '2' }] }, agentId: agents[8].id },
    { id: 'flow-legal', name: 'Legal Intake Flow', description: 'Law firm intake flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Legal Welcome' }, { id: '2', type: 'question', name: 'Case Type' }, { id: '3', type: 'transfer', name: 'Attorney Transfer' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[9].id },
    { id: 'flow-education', name: 'Education Inquiry Flow', description: 'School admissions flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Admissions Welcome' }, { id: '2', type: 'question', name: 'Program Interest' }], edges: [{ from: '1', to: '2' }] }, agentId: agents[10].id },
    { id: 'flow-banking', name: 'Banking Flow', description: 'Bank customer service flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Banking Welcome' }, { id: '2', type: 'verify', name: 'Account Verify' }, { id: '3', type: 'menu', name: 'Banking Services' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[11].id },
    { id: 'flow-travel', name: 'Travel Booking Flow', description: 'Travel agency booking flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Travel Welcome' }, { id: '2', type: 'question', name: 'Destination' }, { id: '3', type: 'datetime', name: 'Travel Dates' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[12].id },
    { id: 'flow-restaurant', name: 'Restaurant Reservation Flow', description: 'Restaurant booking flow', isDefault: true, flowData: { nodes: [{ id: '1', type: 'greeting', name: 'Restaurant Welcome' }, { id: '2', type: 'datetime', name: 'Reservation DateTime' }, { id: '3', type: 'number', name: 'Party Size' }], edges: [{ from: '1', to: '2' }, { from: '2', to: '3' }] }, agentId: agents[13].id },
  ];

  for (const flowData of callFlowsData) {
    await prisma.callFlow.upsert({
      where: { id: flowData.id },
      update: flowData,
      create: flowData,
    });
  }
  console.log(`Created ${callFlowsData.length} call flows`);

  // ============================================
  // 8. PHONE NUMBERS (15+ items)
  // ============================================
  console.log('Creating phone numbers...');
  const phoneNumbersData = [
    { id: 'phone-main', number: '+18005551000', displayName: 'Main Support Line', country: 'US', type: 'tollfree', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: mainAgent.id },
    { id: 'phone-sales', number: '+18005551001', displayName: 'Sales Hotline', country: 'US', type: 'tollfree', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: agents[1].id },
    { id: 'phone-local-ny', number: '+12125551002', displayName: 'New York Office', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: mainAgent.id },
    { id: 'phone-local-la', number: '+13105551003', displayName: 'Los Angeles Office', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: mainAgent.id },
    { id: 'phone-billing', number: '+18005551004', displayName: 'Billing Support', country: 'US', type: 'tollfree', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: agents[2].id },
    { id: 'phone-tech', number: '+18005551005', displayName: 'Tech Support', country: 'US', type: 'tollfree', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: agents[3].id },
    { id: 'phone-spanish', number: '+18005551006', displayName: 'Spanish Support', country: 'US', type: 'tollfree', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: demoBusiness.id, agentId: agents[6].id },
    { id: 'phone-healthcare', number: '+12125551007', displayName: 'Medical Office', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[1].id, agentId: agents[7].id },
    { id: 'phone-auto', number: '+13135551008', displayName: 'Auto Service', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[2].id, agentId: agents[8].id },
    { id: 'phone-legal', number: '+13125551009', displayName: 'Law Firm', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[3].id, agentId: agents[9].id },
    { id: 'phone-edu', number: '+16175551010', displayName: 'Admissions', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[4].id, agentId: agents[10].id },
    { id: 'phone-bank', number: '+17045551011', displayName: 'Banking Support', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[5].id, agentId: agents[11].id },
    { id: 'phone-travel', number: '+17865551012', displayName: 'Travel Bookings', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[6].id, agentId: agents[12].id },
    { id: 'phone-restaurant', number: '+17025551013', displayName: 'Reservations', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[7].id, agentId: agents[13].id },
    { id: 'phone-realestate', number: '+14805551014', displayName: 'Property Inquiries', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[8].id, agentId: agents[14].id },
    { id: 'phone-insurance', number: '+12145551015', displayName: 'Insurance Claims', country: 'US', type: 'local', provider: 'twilio', status: 'active', callHandling: 'agent', voicemailEnabled: true, recordingEnabled: true, businessId: businesses[9].id, agentId: agents[15].id },
  ];

  const phoneNumbers: any[] = [];
  for (const phoneData of phoneNumbersData) {
    const phone = await prisma.phoneNumber.upsert({
      where: { id: phoneData.id },
      update: phoneData,
      create: phoneData,
    });
    phoneNumbers.push(phone);
  }
  console.log(`Created ${phoneNumbers.length} phone numbers`);

  // ============================================
  // 9. CALLS (20+ items for realistic data)
  // ============================================
  console.log('Creating calls...');
  const callStatuses = ['completed', 'missed', 'voicemail', 'transferred', 'in-progress'];
  const sentiments = ['positive', 'neutral', 'negative'];
  const now = new Date();

  const callsData = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 600) + 30;
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const status = callStatuses[Math.floor(Math.random() * callStatuses.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const phoneIndex = Math.floor(Math.random() * phoneNumbers.length);
    const outcomes = ['resolved', 'transferred', 'voicemail', 'abandoned'];

    callsData.push({
      id: `call-${i + 1}`,
      callSid: `CA${Date.now()}${i}`,
      direction: Math.random() > 0.3 ? 'inbound' : 'outbound',
      status,
      from: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      to: phoneNumbers[phoneIndex].number,
      startTime,
      endTime: status === 'in-progress' ? null : endTime,
      duration: status === 'in-progress' ? null : duration,
      sentiment,
      intent: ['support.general', 'inquiry.pricing', 'booking.appointment', 'billing.refund', 'greeting'][Math.floor(Math.random() * 5)],
      outcome: status === 'completed' ? outcomes[Math.floor(Math.random() * outcomes.length)] : null,
      phoneNumberId: phoneNumbers[phoneIndex].id,
      agentId: phoneNumbers[phoneIndex].agentId,
      businessId: phoneNumbers[phoneIndex].businessId,
    });
  }

  for (const callData of callsData) {
    await prisma.call.upsert({
      where: { id: callData.id },
      update: callData,
      create: callData,
    });
  }
  console.log(`Created ${callsData.length} calls`);

  // ============================================
  // 10. INTEGRATIONS (15+ items)
  // ============================================
  console.log('Creating integrations...');
  const integrationsData = [
    { id: 'int-salesforce', type: 'crm', name: 'Salesforce', provider: 'salesforce', isActive: true, config: { instanceUrl: 'https://demo.salesforce.com', apiVersion: '55.0' }, businessId: demoBusiness.id },
    { id: 'int-hubspot', type: 'crm', name: 'HubSpot', provider: 'hubspot', isActive: true, config: { portalId: '12345' }, businessId: demoBusiness.id },
    { id: 'int-zendesk', type: 'support', name: 'Zendesk', provider: 'zendesk', isActive: true, config: { subdomain: 'demo' }, businessId: demoBusiness.id },
    { id: 'int-google-cal', type: 'calendar', name: 'Google Calendar', provider: 'google', isActive: true, config: { calendarId: 'primary' }, businessId: demoBusiness.id },
    { id: 'int-outlook-cal', type: 'calendar', name: 'Outlook Calendar', provider: 'microsoft', isActive: false, config: {}, businessId: demoBusiness.id },
    { id: 'int-slack', type: 'notification', name: 'Slack', provider: 'slack', isActive: true, config: { channel: '#support-calls' }, businessId: demoBusiness.id },
    { id: 'int-teams', type: 'notification', name: 'Microsoft Teams', provider: 'microsoft', isActive: false, config: {}, businessId: demoBusiness.id },
    { id: 'int-zapier', type: 'automation', name: 'Zapier', provider: 'zapier', isActive: true, config: { webhookUrl: 'https://hooks.zapier.com/demo' }, businessId: demoBusiness.id },
    { id: 'int-stripe', type: 'payment', name: 'Stripe', provider: 'stripe', isActive: true, config: { publishableKey: 'pk_test_demo' }, businessId: demoBusiness.id },
    { id: 'int-calendly', type: 'booking', name: 'Calendly', provider: 'calendly', isActive: true, config: { eventType: 'default' }, businessId: demoBusiness.id },
    { id: 'int-pipedrive', type: 'crm', name: 'Pipedrive', provider: 'pipedrive', isActive: false, config: {}, businessId: businesses[0].id },
    { id: 'int-freshdesk', type: 'support', name: 'Freshdesk', provider: 'freshworks', isActive: true, config: { domain: 'techcorp' }, businessId: businesses[0].id },
    { id: 'int-intercom', type: 'support', name: 'Intercom', provider: 'intercom', isActive: true, config: { appId: 'demo123' }, businessId: demoBusiness.id },
    { id: 'int-mailchimp', type: 'marketing', name: 'Mailchimp', provider: 'mailchimp', isActive: true, config: { audienceId: 'list123' }, businessId: demoBusiness.id },
    { id: 'int-twilio', type: 'telephony', name: 'Twilio', provider: 'twilio', isActive: true, config: { accountSid: 'AC_demo' }, businessId: demoBusiness.id },
    { id: 'int-sendgrid', type: 'email', name: 'SendGrid', provider: 'sendgrid', isActive: true, config: { templateId: 'demo-template' }, businessId: demoBusiness.id },
  ];

  for (const intData of integrationsData) {
    await prisma.integration.upsert({
      where: { id: intData.id },
      update: intData,
      create: intData,
    });
  }
  console.log(`Created ${integrationsData.length} integrations`);

  // ============================================
  // 11. WEBHOOKS (15+ items)
  // ============================================
  console.log('Creating webhooks...');
  const webhooksData = [
    { id: 'wh-call-started', name: 'Call Started', url: 'https://api.example.com/webhooks/call-started', events: ['call.started'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-call-ended', name: 'Call Ended', url: 'https://api.example.com/webhooks/call-ended', events: ['call.ended'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-voicemail', name: 'Voicemail Received', url: 'https://api.example.com/webhooks/voicemail', events: ['voicemail.received'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-transfer', name: 'Call Transferred', url: 'https://api.example.com/webhooks/transfer', events: ['call.transferred'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-sentiment', name: 'Negative Sentiment Alert', url: 'https://api.example.com/webhooks/sentiment', events: ['sentiment.negative'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-escalation', name: 'Escalation Alert', url: 'https://api.example.com/webhooks/escalation', events: ['call.escalated'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-crm-sync', name: 'CRM Sync', url: 'https://crm.example.com/webhooks/sync', events: ['call.ended', 'contact.created'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-analytics', name: 'Analytics Update', url: 'https://analytics.example.com/webhooks/update', events: ['analytics.daily'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-slack-notify', name: 'Slack Notifications', url: 'https://hooks.slack.com/services/demo', events: ['call.started', 'call.ended', 'call.missed'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-zapier', name: 'Zapier Integration', url: 'https://hooks.zapier.com/hooks/catch/demo', events: ['call.ended'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-appointment', name: 'Appointment Created', url: 'https://api.example.com/webhooks/appointment', events: ['appointment.created', 'appointment.updated'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-billing-alert', name: 'Billing Alert', url: 'https://api.example.com/webhooks/billing', events: ['billing.threshold'], isActive: true, businessId: demoBusiness.id },
    { id: 'wh-techcorp', name: 'TechCorp Webhook', url: 'https://techcorp.com/api/webhooks', events: ['call.ended'], isActive: true, businessId: businesses[0].id },
    { id: 'wh-healthcare', name: 'Healthcare Alerts', url: 'https://healthfirst.com/api/webhooks', events: ['call.missed', 'voicemail.received'], isActive: true, businessId: businesses[1].id },
    { id: 'wh-auto-crm', name: 'Auto CRM Sync', url: 'https://automax.com/api/webhooks', events: ['call.ended', 'appointment.created'], isActive: true, businessId: businesses[2].id },
    { id: 'wh-legal-intake', name: 'Legal Intake Webhook', url: 'https://legalease.com/api/webhooks', events: ['call.ended'], isActive: true, businessId: businesses[3].id },
  ];

  for (const whData of webhooksData) {
    await prisma.webhook.upsert({
      where: { id: whData.id },
      update: whData,
      create: whData,
    });
  }
  console.log(`Created ${webhooksData.length} webhooks`);

  // ============================================
  // 12. API KEYS (15+ items)
  // ============================================
  console.log('Creating API keys...');
  const apiKeysData = [
    { id: 'key-prod-1', name: 'Production API Key', key: 'ak_live_demo1234567890abcdef', prefix: 'ak_live_', scopes: ['read', 'write', 'delete'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-dev-1', name: 'Development API Key', key: 'ak_test_demo1234567890abcdef', prefix: 'ak_test_', scopes: ['read', 'write'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-readonly', name: 'Read-Only Key', key: 'ak_live_readonly1234567890', prefix: 'ak_live_', scopes: ['read'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-webhook', name: 'Webhook Key', key: 'ak_live_webhook1234567890', prefix: 'ak_live_', scopes: ['webhooks'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-analytics', name: 'Analytics Key', key: 'ak_live_analytics123456789', prefix: 'ak_live_', scopes: ['read', 'analytics'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-mobile', name: 'Mobile App Key', key: 'ak_live_mobile1234567890ab', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-integration', name: 'Integration Key', key: 'ak_live_integration12345', prefix: 'ak_live_', scopes: ['read', 'write', 'integrations'], isActive: true, businessId: demoBusiness.id },
    { id: 'key-deprecated', name: 'Deprecated Key', key: 'ak_live_deprecated123456', prefix: 'ak_live_', scopes: ['read'], isActive: false, businessId: demoBusiness.id },
    { id: 'key-techcorp', name: 'TechCorp API Key', key: 'ak_live_techcorp12345678', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[0].id },
    { id: 'key-healthcare', name: 'HealthFirst API Key', key: 'ak_live_health123456789', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[1].id },
    { id: 'key-auto', name: 'AutoMax API Key', key: 'ak_live_automax12345678', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[2].id },
    { id: 'key-legal', name: 'LegalEase API Key', key: 'ak_live_legal1234567890', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[3].id },
    { id: 'key-edu', name: 'EduBright API Key', key: 'ak_live_edu12345678901', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[4].id },
    { id: 'key-finance', name: 'FinanceWise API Key', key: 'ak_live_finance1234567', prefix: 'ak_live_', scopes: ['read'], isActive: true, businessId: businesses[5].id },
    { id: 'key-travel', name: 'TravelJoy API Key', key: 'ak_live_travel12345678', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[6].id },
    { id: 'key-restaurant', name: 'FoodDeluxe API Key', key: 'ak_live_food123456789', prefix: 'ak_live_', scopes: ['read', 'write'], isActive: true, businessId: businesses[7].id },
  ];

  for (const keyData of apiKeysData) {
    await prisma.apiKey.upsert({
      where: { id: keyData.id },
      update: keyData,
      create: keyData,
    });
  }
  console.log(`Created ${apiKeysData.length} API keys`);

  // ============================================
  // 13. SUBSCRIPTIONS (15+ items)
  // ============================================
  console.log('Creating subscriptions...');
  const plans = ['starter', 'professional', 'enterprise'];
  const subscriptionsData = businesses.map((biz, index) => ({
    id: `sub-${biz.id.slice(0, 8)}`,
    plan: plans[index % plans.length],
    status: index < 14 ? 'active' : 'cancelled',
    businessId: biz.id,
    startDate: new Date(now.getTime() - (index * 7) * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + ((365 - index * 7) * 24 * 60 * 60 * 1000)),
  }));

  for (const subData of subscriptionsData) {
    await prisma.subscription.upsert({
      where: { id: subData.id },
      update: subData,
      create: subData,
    });
  }
  console.log(`Created ${subscriptionsData.length} subscriptions`);

  // ============================================
  // 14. USAGE BILLING (15+ items)
  // ============================================
  console.log('Creating usage billing records...');
  const usageBillingData = [];
  for (let i = 0; i < 16; i++) {
    const bizIndex = i % businesses.length;
    const monthOffset = Math.floor(i / businesses.length);
    const billingDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

    usageBillingData.push({
      id: `billing-${businesses[bizIndex].id.slice(0, 8)}-${monthOffset}`,
      businessId: businesses[bizIndex].id,
      month: billingDate,
      callMinutes: Math.floor(Math.random() * 2000) + 100,
      aiTokens: Math.floor(Math.random() * 100000) + 5000,
      smsCount: Math.floor(Math.random() * 200) + 10,
      totalAmount: Math.random() * 500 + 50,
      isPaid: monthOffset !== 0,
    });
  }

  for (const billingData of usageBillingData) {
    await prisma.usageBilling.upsert({
      where: { id: billingData.id },
      update: billingData,
      create: billingData,
    });
  }
  console.log(`Created ${usageBillingData.length} billing records`);

  // ============================================
  // 15. DAILY ANALYTICS (30+ days of data)
  // ============================================
  console.log('Creating daily analytics...');
  const analyticsData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    analyticsData.push({
      id: `analytics-demo-${i}`,
      date,
      totalCalls: Math.floor(Math.random() * 100) + 10,
      inboundCalls: Math.floor(Math.random() * 60) + 5,
      outboundCalls: Math.floor(Math.random() * 40) + 5,
      totalDuration: Math.floor(Math.random() * 10000) + 1000,
      resolvedCalls: Math.floor(Math.random() * 50) + 10,
      transferredCalls: Math.floor(Math.random() * 10),
      voicemailCalls: Math.floor(Math.random() * 10),
      abandonedCalls: Math.floor(Math.random() * 5),
      positiveSentiment: Math.floor(Math.random() * 50) + 20,
      neutralSentiment: Math.floor(Math.random() * 30) + 10,
      negativeSentiment: Math.floor(Math.random() * 15),
      avgSentimentScore: Math.random() * 0.6 + 0.2,
      conversions: Math.floor(Math.random() * 20) + 5,
      businessId: demoBusiness.id,
    });
  }

  for (const analytics of analyticsData) {
    await prisma.dailyAnalytics.upsert({
      where: { id: analytics.id },
      update: analytics,
      create: analytics,
    });
  }
  console.log(`Created ${analyticsData.length} daily analytics records`);

  // ============================================
  // 16. CALL ROUTING RULES (15+ items)
  // ============================================
  console.log('Creating call routing rules...');
  const routingRulesData = [
    { id: 'rule-business-hours', name: 'Business Hours', condition: 'time', conditionValue: { startTime: '09:00', endTime: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }, action: 'agent', actionValue: mainAgent.id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-after-hours', name: 'After Hours', condition: 'time', conditionValue: { startTime: '17:00', endTime: '09:00' }, action: 'voicemail', actionValue: null, priority: 2, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-weekend', name: 'Weekend Routing', condition: 'time', conditionValue: { days: ['Sat', 'Sun'] }, action: 'voicemail', actionValue: null, priority: 3, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-vip', name: 'VIP Customers', condition: 'caller-id', conditionValue: { tags: ['vip'] }, action: 'agent', actionValue: mainAgent.id, priority: 0, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-spanish', name: 'Spanish Callers', condition: 'language', conditionValue: { language: 'es' }, action: 'agent', actionValue: agents[6].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[6].id },
    { id: 'rule-sales-hours', name: 'Sales Hours', condition: 'time', conditionValue: { startTime: '10:00', endTime: '16:00' }, action: 'agent', actionValue: agents[1].id, priority: 2, isActive: true, phoneNumberId: phoneNumbers[1].id },
    { id: 'rule-billing-redirect', name: 'Billing Redirect', condition: 'intent', conditionValue: { intents: ['billing', 'payment'] }, action: 'agent', actionValue: agents[2].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[4].id },
    { id: 'rule-tech-issues', name: 'Tech Issues', condition: 'intent', conditionValue: { intents: ['support', 'help'] }, action: 'agent', actionValue: agents[3].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[5].id },
    { id: 'rule-appointment', name: 'Appointment Requests', condition: 'intent', conditionValue: { intents: ['appointment', 'schedule'] }, action: 'agent', actionValue: agents[4].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-overflow', name: 'Overflow Routing', condition: 'capacity', conditionValue: { maxConcurrent: 5 }, action: 'forward', actionValue: '+18005551099', priority: 10, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-holiday', name: 'Holiday Routing', condition: 'date', conditionValue: { dates: ['2024-12-25', '2024-01-01'] }, action: 'voicemail', actionValue: null, priority: 0, isActive: true, phoneNumberId: phoneNumbers[0].id },
    { id: 'rule-healthcare-hours', name: 'Medical Office Hours', condition: 'time', conditionValue: { startTime: '08:00', endTime: '18:00' }, action: 'agent', actionValue: agents[7].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[7].id },
    { id: 'rule-auto-service', name: 'Auto Service Hours', condition: 'time', conditionValue: { startTime: '07:00', endTime: '19:00' }, action: 'agent', actionValue: agents[8].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[8].id },
    { id: 'rule-legal-hours', name: 'Legal Office Hours', condition: 'time', conditionValue: { startTime: '09:00', endTime: '18:00' }, action: 'agent', actionValue: agents[9].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[9].id },
    { id: 'rule-emergency-legal', name: 'Emergency Legal', condition: 'keyword', conditionValue: { keywords: ['emergency', 'urgent'] }, action: 'forward', actionValue: '+13125559999', priority: 0, isActive: true, phoneNumberId: phoneNumbers[9].id },
    { id: 'rule-restaurant-reservation', name: 'Restaurant Hours', condition: 'time', conditionValue: { startTime: '11:00', endTime: '23:00' }, action: 'agent', actionValue: agents[13].id, priority: 1, isActive: true, phoneNumberId: phoneNumbers[13].id },
  ];

  for (const ruleData of routingRulesData) {
    await prisma.callRoutingRule.upsert({
      where: { id: ruleData.id },
      update: ruleData,
      create: ruleData,
    });
  }
  console.log(`Created ${routingRulesData.length} routing rules`);

  // ============================================
  // 17. SYSTEM SETTINGS
  // ============================================
  console.log('Creating system settings...');
  const settingsData = [
    { key: 'default_language', value: { code: 'en', name: 'English' }, description: 'Default system language' },
    { key: 'supported_languages', value: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru'], description: 'Supported languages for voice agents' },
    { key: 'max_call_duration', value: { minutes: 30 }, description: 'Maximum call duration in minutes' },
    { key: 'recording_retention_days', value: { days: 90 }, description: 'Number of days to retain call recordings' },
    { key: 'ai_models', value: ['anthropic/claude-3-haiku', 'anthropic/claude-3-sonnet', 'openai/gpt-4', 'openai/gpt-3.5-turbo'], description: 'Available AI models' },
    { key: 'voice_providers', value: ['system', 'elevenlabs', 'azure', 'google', 'amazon'], description: 'Available voice providers' },
    { key: 'default_timezone', value: 'America/New_York', description: 'Default timezone for new businesses' },
    { key: 'pricing_plans', value: { starter: 29, professional: 99, enterprise: 299 }, description: 'Monthly pricing for each plan' },
    { key: 'trial_duration_days', value: 14, description: 'Duration of free trial in days' },
    { key: 'max_agents_per_plan', value: { starter: 2, professional: 10, enterprise: 50 }, description: 'Maximum agents per plan' },
    { key: 'webhook_timeout_seconds', value: 30, description: 'Webhook request timeout' },
    { key: 'sentiment_threshold', value: { positive: 0.6, negative: -0.4 }, description: 'Sentiment analysis thresholds' },
    { key: 'escalation_rules', value: { maxUnknownIntents: 2, sentimentThreshold: -0.7, keywords: ['supervisor', 'manager', 'complaint'] }, description: 'Rules for automatic escalation' },
    { key: 'analytics_retention_days', value: 365, description: 'Days to retain analytics data' },
    { key: 'feature_flags', value: { voiceCloning: false, aiLearning: true, multiLanguage: true, customFlows: true }, description: 'Feature flags for platform features' },
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log(`Created ${settingsData.length} system settings`);

  // ============================================
  // 18. AI SPEECH ENHANCEMENTS (15+ items)
  // ============================================
  console.log('Creating speech enhancements...');
  const speechEnhancementsData = [
    { id: 'speech-1', title: 'Customer Greeting Script', description: 'Standard greeting for incoming calls', originalText: 'Hello, thank you for calling. My name is Sarah. How can I help you today?', enhancedText: 'Good morning! Thank you for choosing our service. My name is Sarah, and I am delighted to assist you today. How may I help you?', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added greeting warmth', 'Improved formality'], improvements: { clarity: 92, grammar: 95, fluency: 90, tone: 88 }, suggestions: ['Consider adding company name'] }, businessId: demoBusiness.id },
    { id: 'speech-2', title: 'Support Response Template', description: 'Technical support response', originalText: 'I understand your problem. Let me check this for you.', enhancedText: 'I completely understand your concern, and I appreciate your patience. Allow me to investigate this matter thoroughly to ensure we find the best solution for you.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added empathy', 'Improved professionalism'], improvements: { clarity: 88, grammar: 94, fluency: 91, tone: 95 }, suggestions: ['Add timeline expectation'] }, businessId: demoBusiness.id },
    { id: 'speech-3', title: 'Sales Pitch Introduction', description: 'Product introduction script', originalText: 'We have a great product that will help you save money.', enhancedText: 'Allow me to introduce our innovative solution that has helped countless businesses like yours achieve significant cost savings while improving operational efficiency.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added specificity', 'Improved persuasiveness'], improvements: { clarity: 85, grammar: 92, fluency: 89, tone: 90 }, suggestions: ['Include specific statistics'] }, businessId: demoBusiness.id },
    { id: 'speech-4', title: 'Appointment Confirmation', description: 'Confirming scheduled appointments', originalText: 'Your appointment is confirmed for Tuesday at 2pm.', enhancedText: 'Excellent! I have successfully scheduled your appointment for Tuesday at 2:00 PM. You will receive a confirmation email shortly with all the details.', enhancementType: 'friendly', status: 'completed', aiResponse: { enhancements: ['Added confirmation detail', 'Improved friendliness'], improvements: { clarity: 95, grammar: 93, fluency: 92, tone: 94 }, suggestions: ['Add reminder option'] }, businessId: demoBusiness.id },
    { id: 'speech-5', title: 'Billing Inquiry Response', description: 'Addressing billing questions', originalText: 'Let me look at your account to see what charges you have.', enhancedText: 'Of course, I would be happy to review your account details with you. Please allow me a moment to access your billing information and provide you with a comprehensive overview.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added politeness', 'Improved clarity'], improvements: { clarity: 90, grammar: 96, fluency: 88, tone: 92 }, suggestions: ['Mention security verification'] }, businessId: demoBusiness.id },
    { id: 'speech-6', title: 'Transfer Announcement', description: 'Before transferring a call', originalText: 'I need to transfer you to another department.', enhancedText: 'To ensure you receive the most specialized assistance, I will connect you with our dedicated team who can best address your needs. Please hold for just a moment.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added explanation', 'Improved transition'], improvements: { clarity: 87, grammar: 94, fluency: 90, tone: 91 }, suggestions: ['Mention expected wait time'] }, businessId: demoBusiness.id },
    { id: 'speech-7', title: 'Complaint Acknowledgment', description: 'Responding to customer complaints', originalText: 'I am sorry you are having this problem.', enhancedText: 'I sincerely apologize for the inconvenience you have experienced. I want you to know that I take your concern very seriously, and I am committed to resolving this matter to your satisfaction.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Enhanced empathy', 'Added commitment'], improvements: { clarity: 89, grammar: 95, fluency: 91, tone: 96 }, suggestions: ['Offer compensation option'] }, businessId: demoBusiness.id },
    { id: 'speech-8', title: 'Product Explanation', description: 'Describing product features', originalText: 'This product has many good features that you will like.', enhancedText: 'Our product offers an impressive array of features specifically designed to meet your needs, including advanced capabilities that set it apart from alternatives in the market.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added specificity', 'Improved persuasiveness'], improvements: { clarity: 86, grammar: 93, fluency: 88, tone: 90 }, suggestions: ['List top 3 features'] }, businessId: demoBusiness.id },
    { id: 'speech-9', title: 'Callback Promise', description: 'Promising to return call', originalText: 'Someone will call you back later.', enhancedText: 'I will personally ensure that a member of our team contacts you within the next two business hours to follow up on your request. May I confirm the best number to reach you?', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added timeline', 'Improved accountability'], improvements: { clarity: 93, grammar: 94, fluency: 90, tone: 92 }, suggestions: ['Confirm contact preference'] }, businessId: demoBusiness.id },
    { id: 'speech-10', title: 'Survey Request', description: 'Asking for feedback', originalText: 'Would you like to take a survey?', enhancedText: 'We value your feedback tremendously. Would you have a moment to share your experience with us through a brief survey? Your insights help us serve you better.', enhancementType: 'friendly', status: 'completed', aiResponse: { enhancements: ['Added value proposition', 'Improved engagement'], improvements: { clarity: 91, grammar: 92, fluency: 89, tone: 94 }, suggestions: ['Mention survey duration'] }, businessId: demoBusiness.id },
    { id: 'speech-11', title: 'Hold Message', description: 'While customer is on hold', originalText: 'Please hold while I check.', enhancedText: 'Thank you for your patience. I am currently researching this for you and will be back with you shortly. Your call is important to us.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added gratitude', 'Improved reassurance'], improvements: { clarity: 88, grammar: 93, fluency: 91, tone: 90 }, suggestions: ['Add estimated wait time'] }, businessId: demoBusiness.id },
    { id: 'speech-12', title: 'Closing Statement', description: 'Ending the call', originalText: 'Is there anything else? Goodbye.', enhancedText: 'Is there anything else I can assist you with today? Thank you for choosing us. Have a wonderful day, and please do not hesitate to reach out if you need any further assistance.', enhancementType: 'friendly', status: 'completed', aiResponse: { enhancements: ['Extended gratitude', 'Added warmth'], improvements: { clarity: 94, grammar: 95, fluency: 93, tone: 96 }, suggestions: ['Mention callback option'] }, businessId: demoBusiness.id },
    { id: 'speech-13', title: 'Pricing Discussion', description: 'Discussing prices', originalText: 'The price for this service is $99.', enhancedText: 'This comprehensive service is available at $99, which includes all the features I mentioned along with our dedicated customer support. Many of our clients find this represents excellent value.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added value context', 'Improved persuasiveness'], improvements: { clarity: 87, grammar: 94, fluency: 90, tone: 88 }, suggestions: ['Mention payment options'] }, businessId: demoBusiness.id },
    { id: 'speech-14', title: 'Technical Instructions', description: 'Guiding through process', originalText: 'First, click the button. Then enter your info.', enhancedText: 'Let me guide you through this step by step. First, please locate and click the blue button at the top right of your screen. Once that opens, you will see fields where you can enter your information.', enhancementType: 'clarity', status: 'completed', aiResponse: { enhancements: ['Added visual cues', 'Improved step clarity'], improvements: { clarity: 96, grammar: 92, fluency: 94, tone: 85 }, suggestions: ['Confirm each step completion'] }, businessId: demoBusiness.id },
    { id: 'speech-15', title: 'Voicemail Greeting', description: 'Professional voicemail', originalText: 'Leave a message after the beep.', enhancedText: 'You have reached the voicemail of the Customer Service team. We apologize for missing your call. Please leave your name, phone number, and a brief message, and we will return your call within one business day.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added context', 'Improved professionalism'], improvements: { clarity: 93, grammar: 95, fluency: 92, tone: 94 }, suggestions: ['Add alternative contact'] }, businessId: demoBusiness.id },
    { id: 'speech-16', title: 'Welcome Message', description: 'IVR welcome', originalText: 'Welcome to our company. Press 1 for sales.', enhancedText: 'Welcome to ABC Company, where your satisfaction is our priority. For sales inquiries, please press 1. For customer support, press 2. To speak with an operator, please press 0.', enhancementType: 'professional', status: 'completed', aiResponse: { enhancements: ['Added branding', 'Improved navigation'], improvements: { clarity: 95, grammar: 94, fluency: 91, tone: 93 }, suggestions: ['Add hours of operation'] }, businessId: demoBusiness.id },
  ];

  for (const data of speechEnhancementsData) {
    await prisma.speechEnhancement.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${speechEnhancementsData.length} speech enhancements`);

  // ============================================
  // 19. AI ACCENT ADAPTATIONS (15+ items)
  // ============================================
  console.log('Creating accent adaptations...');
  const accentAdaptationsData = [
    { id: 'accent-1', title: 'British to American Greeting', description: 'Adapting British greeting', originalText: 'Brilliant! How may I be of service to you today?', adaptedText: 'Awesome! How can I help you today?', sourceAccent: 'british', targetAccent: 'american', status: 'completed', aiResponse: { adaptations: [{ original: 'Brilliant', adapted: 'Awesome', note: 'Common exclamation' }, { original: 'be of service', adapted: 'help', note: 'More casual American phrasing' }], confidence: 0.92, tips: ['Use more casual vocabulary', 'Avoid formal British expressions'] }, businessId: demoBusiness.id },
    { id: 'accent-2', title: 'American to British Farewell', description: 'Formal British goodbye', originalText: 'Have a great day! Take care!', adaptedText: 'Have a lovely day! Cheers!', sourceAccent: 'american', targetAccent: 'british', status: 'completed', aiResponse: { adaptations: [{ original: 'great', adapted: 'lovely', note: 'British preference' }, { original: 'Take care', adapted: 'Cheers', note: 'Common British farewell' }], confidence: 0.88, tips: ['Use British vocabulary', 'Add appropriate colloquialisms'] }, businessId: demoBusiness.id },
    { id: 'accent-3', title: 'Neutral to Australian', description: 'Australian friendly style', originalText: 'Hello, welcome to our customer service line.', adaptedText: 'G day mate, welcome to our customer service line!', sourceAccent: 'neutral', targetAccent: 'australian', status: 'completed', aiResponse: { adaptations: [{ original: 'Hello', adapted: 'G day mate', note: 'Australian greeting' }], confidence: 0.85, tips: ['Add casual Australian slang', 'Keep tone friendly'] }, businessId: demoBusiness.id },
    { id: 'accent-4', title: 'Formal to Southern US', description: 'Southern hospitality style', originalText: 'Thank you for your patience. We appreciate your business.', adaptedText: 'Well, thank you kindly for your patience. We sure do appreciate y all choosing us.', sourceAccent: 'neutral', targetAccent: 'southern-us', status: 'completed', aiResponse: { adaptations: [{ original: 'Thank you', adapted: 'Thank you kindly', note: 'Southern warmth' }, { original: 'your business', adapted: 'y all choosing us', note: 'Southern plural you' }], confidence: 0.87, tips: ['Add warmth phrases', 'Use y all appropriately'] }, businessId: demoBusiness.id },
    { id: 'accent-5', title: 'British to Indian English', description: 'Indian English adaptation', originalText: 'I shall endeavour to resolve your query promptly.', adaptedText: 'I will definitely resolve your query very soon itself.', sourceAccent: 'british', targetAccent: 'indian', status: 'completed', aiResponse: { adaptations: [{ original: 'shall endeavour', adapted: 'will definitely', note: 'Indian English phrasing' }, { original: 'promptly', adapted: 'very soon itself', note: 'Common intensifier' }], confidence: 0.83, tips: ['Use common Indian English patterns', 'Add emphasis words'] }, businessId: demoBusiness.id },
    { id: 'accent-6', title: 'American to Canadian', description: 'Canadian politeness', originalText: 'Sorry about that. Let me fix it right away.', adaptedText: 'Oh, sorry about that, eh. Let me fix that right away for you.', sourceAccent: 'american', targetAccent: 'canadian', status: 'completed', aiResponse: { adaptations: [{ original: 'Sorry about that', adapted: 'Oh, sorry about that, eh', note: 'Canadian politeness marker' }], confidence: 0.90, tips: ['Add polite qualifiers', 'Use eh appropriately'] }, businessId: demoBusiness.id },
    { id: 'accent-7', title: 'Neutral to New York', description: 'New York directness', originalText: 'Excuse me, could you please tell me the status of my order?', adaptedText: 'Hey, what is the status of my order?', sourceAccent: 'neutral', targetAccent: 'new-york', status: 'completed', aiResponse: { adaptations: [{ original: 'Excuse me, could you please', adapted: 'Hey', note: 'Direct NY style' }], confidence: 0.86, tips: ['Be more direct', 'Reduce formal pleasantries'] }, businessId: demoBusiness.id },
    { id: 'accent-8', title: 'Irish English Warmth', description: 'Irish friendly tone', originalText: 'Hello, thank you for calling our support line.', adaptedText: 'Ah hello there, thanks a million for giving us a ring!', sourceAccent: 'neutral', targetAccent: 'irish', status: 'completed', aiResponse: { adaptations: [{ original: 'Hello', adapted: 'Ah hello there', note: 'Irish warmth' }, { original: 'thank you', adapted: 'thanks a million', note: 'Irish expression' }, { original: 'calling', adapted: 'giving us a ring', note: 'Irish phrasing' }], confidence: 0.84, tips: ['Add warmth and friendliness', 'Use Irish expressions'] }, businessId: demoBusiness.id },
    { id: 'accent-9', title: 'Scottish Professional', description: 'Scottish formal style', originalText: 'I will look into this matter immediately for you.', adaptedText: 'Aye, I will look into this matter right away for you.', sourceAccent: 'neutral', targetAccent: 'scottish', status: 'completed', aiResponse: { adaptations: [{ original: 'I will', adapted: 'Aye, I will', note: 'Scottish affirmation' }], confidence: 0.82, tips: ['Add Scottish affirmations', 'Maintain professionalism'] }, businessId: demoBusiness.id },
    { id: 'accent-10', title: 'Technical American to British', description: 'Tech support adaptation', originalText: 'Click on the gray button and check the color options.', adaptedText: 'Click on the grey button and check the colour options.', sourceAccent: 'american', targetAccent: 'british', status: 'completed', aiResponse: { adaptations: [{ original: 'gray', adapted: 'grey', note: 'British spelling' }, { original: 'color', adapted: 'colour', note: 'British spelling' }], confidence: 0.95, tips: ['Use British spellings', 'Maintain technical accuracy'] }, businessId: demoBusiness.id },
    { id: 'accent-11', title: 'Casual American', description: 'Casual American style', originalText: 'I understand your concern and will assist you.', adaptedText: 'I totally get it and I am gonna help you out.', sourceAccent: 'neutral', targetAccent: 'american', status: 'completed', aiResponse: { adaptations: [{ original: 'understand', adapted: 'totally get', note: 'Casual American' }, { original: 'will assist', adapted: 'gonna help you out', note: 'Casual phrasing' }], confidence: 0.89, tips: ['Use contractions', 'Add casual expressions'] }, businessId: demoBusiness.id },
    { id: 'accent-12', title: 'British Formal', description: 'Formal British style', originalText: 'I will schedule your meeting now.', adaptedText: 'I shall arrange your meeting forthwith.', sourceAccent: 'american', targetAccent: 'british', status: 'completed', aiResponse: { adaptations: [{ original: 'will', adapted: 'shall', note: 'British formal' }, { original: 'schedule', adapted: 'arrange', note: 'British word choice' }, { original: 'now', adapted: 'forthwith', note: 'Formal British' }], confidence: 0.86, tips: ['Use shall for first person', 'Add formal vocabulary'] }, businessId: demoBusiness.id },
    { id: 'accent-13', title: 'Australian Service', description: 'Aussie customer service', originalText: 'No problem, I will get that sorted for you.', adaptedText: 'No worries mate, I will get that sorted for you straight away!', sourceAccent: 'neutral', targetAccent: 'australian', status: 'completed', aiResponse: { adaptations: [{ original: 'No problem', adapted: 'No worries mate', note: 'Classic Australian' }], confidence: 0.91, tips: ['Use no worries', 'Add mate for friendliness'] }, businessId: demoBusiness.id },
    { id: 'accent-14', title: 'Southern Hospitality', description: 'Southern US welcome', originalText: 'Welcome to our store. Let me know if you need help.', adaptedText: 'Well hey there, welcome! Y all just holler if you need anything at all.', sourceAccent: 'neutral', targetAccent: 'southern-us', status: 'completed', aiResponse: { adaptations: [{ original: 'Welcome', adapted: 'Well hey there, welcome', note: 'Southern warmth' }, { original: 'Let me know', adapted: 'Y all just holler', note: 'Southern expression' }], confidence: 0.88, tips: ['Add warmth', 'Use Southern expressions'] }, businessId: demoBusiness.id },
    { id: 'accent-15', title: 'Canadian Apology', description: 'Canadian polite style', originalText: 'I apologize for the inconvenience this has caused.', adaptedText: 'I am so sorry about the inconvenience, eh. Really appreciate your patience.', sourceAccent: 'american', targetAccent: 'canadian', status: 'completed', aiResponse: { adaptations: [{ original: 'I apologize', adapted: 'I am so sorry', note: 'Canadian preference' }], confidence: 0.87, tips: ['Emphasize politeness', 'Add appreciation'] }, businessId: demoBusiness.id },
  ];

  for (const data of accentAdaptationsData) {
    await prisma.accentAdaptation.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${accentAdaptationsData.length} accent adaptations`);

  // ============================================
  // 20. AI INTENT CLASSIFICATIONS (15+ items)
  // ============================================
  console.log('Creating intent classifications...');
  const intentClassificationsData = [
    { id: 'intent-1', title: 'Pricing Inquiry', description: 'Customer asking about prices', inputText: 'How much does your premium plan cost?', detectedIntent: 'inquiry.pricing', confidence: 0.95, entities: { product: 'premium plan' }, status: 'completed', aiResponse: { intent: 'inquiry.pricing', confidence: 0.95, entities: [{ type: 'product', value: 'premium plan' }], suggestedActions: ['Provide pricing details', 'Offer discount'] }, businessId: demoBusiness.id },
    { id: 'intent-2', title: 'Technical Support Request', description: 'Help with technical issue', inputText: 'My internet is not working and I have tried restarting the router.', detectedIntent: 'support.technical', confidence: 0.92, entities: { issue: 'internet not working', action_taken: 'restarted router' }, status: 'completed', aiResponse: { intent: 'support.technical', confidence: 0.92, entities: [{ type: 'issue', value: 'internet not working' }], suggestedActions: ['Run diagnostics', 'Escalate if needed'] }, businessId: demoBusiness.id },
    { id: 'intent-3', title: 'Appointment Booking', description: 'Schedule a meeting', inputText: 'I would like to schedule an appointment for next Tuesday at 3pm.', detectedIntent: 'booking.appointment', confidence: 0.97, entities: { date: 'next Tuesday', time: '3pm' }, status: 'completed', aiResponse: { intent: 'booking.appointment', confidence: 0.97, entities: [{ type: 'date', value: 'next Tuesday' }, { type: 'time', value: '3pm' }], suggestedActions: ['Check availability', 'Confirm booking'] }, businessId: demoBusiness.id },
    { id: 'intent-4', title: 'Refund Request', description: 'Asking for money back', inputText: 'I want a refund for my order. The product arrived damaged.', detectedIntent: 'billing.refund', confidence: 0.94, entities: { reason: 'product damaged' }, status: 'completed', aiResponse: { intent: 'billing.refund', confidence: 0.94, entities: [{ type: 'reason', value: 'product damaged' }], suggestedActions: ['Verify order', 'Process refund', 'Arrange return'] }, businessId: demoBusiness.id },
    { id: 'intent-5', title: 'Human Transfer', description: 'Wants to speak to person', inputText: 'Can I please talk to a real person?', detectedIntent: 'transfer.human', confidence: 0.98, entities: {}, status: 'completed', aiResponse: { intent: 'transfer.human', confidence: 0.98, entities: [], suggestedActions: ['Transfer to agent', 'Provide wait time'] }, businessId: demoBusiness.id },
    { id: 'intent-6', title: 'Store Hours', description: 'Business hours inquiry', inputText: 'What time do you close on weekends?', detectedIntent: 'inquiry.hours', confidence: 0.93, entities: { day_type: 'weekends' }, status: 'completed', aiResponse: { intent: 'inquiry.hours', confidence: 0.93, entities: [{ type: 'day_type', value: 'weekends' }], suggestedActions: ['Provide weekend hours'] }, businessId: demoBusiness.id },
    { id: 'intent-7', title: 'Order Status', description: 'Checking delivery', inputText: 'Where is my package? Order number 12345.', detectedIntent: 'inquiry.order_status', confidence: 0.96, entities: { order_number: '12345' }, status: 'completed', aiResponse: { intent: 'inquiry.order_status', confidence: 0.96, entities: [{ type: 'order_number', value: '12345' }], suggestedActions: ['Look up order', 'Provide tracking'] }, businessId: demoBusiness.id },
    { id: 'intent-8', title: 'Complaint', description: 'Unhappy customer', inputText: 'This is the third time I am calling about the same issue!', detectedIntent: 'feedback.complaint', confidence: 0.91, entities: { frequency: 'third time' }, status: 'completed', aiResponse: { intent: 'feedback.complaint', confidence: 0.91, entities: [{ type: 'frequency', value: 'third time' }], suggestedActions: ['Apologize', 'Escalate', 'Review history'] }, businessId: demoBusiness.id },
    { id: 'intent-9', title: 'Account Update', description: 'Change account info', inputText: 'I need to update my email address and phone number.', detectedIntent: 'account.update', confidence: 0.94, entities: { fields: ['email', 'phone number'] }, status: 'completed', aiResponse: { intent: 'account.update', confidence: 0.94, entities: [{ type: 'field', value: 'email' }, { type: 'field', value: 'phone number' }], suggestedActions: ['Verify identity', 'Update information'] }, businessId: demoBusiness.id },
    { id: 'intent-10', title: 'Cancellation', description: 'Cancel subscription', inputText: 'I want to cancel my subscription effective immediately.', detectedIntent: 'account.cancel', confidence: 0.96, entities: { timing: 'immediately' }, status: 'completed', aiResponse: { intent: 'account.cancel', confidence: 0.96, entities: [{ type: 'timing', value: 'immediately' }], suggestedActions: ['Retention attempt', 'Process cancellation'] }, businessId: demoBusiness.id },
    { id: 'intent-11', title: 'Greeting', description: 'Simple hello', inputText: 'Hi there, good morning!', detectedIntent: 'greeting', confidence: 0.99, entities: {}, status: 'completed', aiResponse: { intent: 'greeting', confidence: 0.99, entities: [], suggestedActions: ['Return greeting', 'Ask how to help'] }, businessId: demoBusiness.id },
    { id: 'intent-12', title: 'Product Information', description: 'Product details', inputText: 'Can you tell me more about the features of Model X?', detectedIntent: 'inquiry.product', confidence: 0.93, entities: { product: 'Model X' }, status: 'completed', aiResponse: { intent: 'inquiry.product', confidence: 0.93, entities: [{ type: 'product', value: 'Model X' }], suggestedActions: ['Provide product details', 'Offer demo'] }, businessId: demoBusiness.id },
    { id: 'intent-13', title: 'Location Query', description: 'Find store', inputText: 'Where is your nearest location to downtown Chicago?', detectedIntent: 'inquiry.location', confidence: 0.95, entities: { area: 'downtown Chicago' }, status: 'completed', aiResponse: { intent: 'inquiry.location', confidence: 0.95, entities: [{ type: 'area', value: 'downtown Chicago' }], suggestedActions: ['Find nearest store', 'Provide directions'] }, businessId: demoBusiness.id },
    { id: 'intent-14', title: 'Password Reset', description: 'Account access issue', inputText: 'I forgot my password and cannot log in.', detectedIntent: 'support.account_access', confidence: 0.97, entities: { issue: 'forgot password' }, status: 'completed', aiResponse: { intent: 'support.account_access', confidence: 0.97, entities: [{ type: 'issue', value: 'forgot password' }], suggestedActions: ['Send reset link', 'Verify identity'] }, businessId: demoBusiness.id },
    { id: 'intent-15', title: 'Farewell', description: 'Ending conversation', inputText: 'Thank you for your help. Goodbye!', detectedIntent: 'farewell', confidence: 0.98, entities: {}, status: 'completed', aiResponse: { intent: 'farewell', confidence: 0.98, entities: [], suggestedActions: ['Thank customer', 'End call'] }, businessId: demoBusiness.id },
  ];

  for (const data of intentClassificationsData) {
    await prisma.intentClassification.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${intentClassificationsData.length} intent classifications`);

  // ============================================
  // 21. AI EMOTION DETECTIONS (15+ items)
  // ============================================
  console.log('Creating emotion detections...');
  const emotionDetectionsData = [
    { id: 'emotion-1', title: 'Happy Customer', description: 'Positive feedback', inputText: 'I am so happy with your service! Everything was perfect!', primaryEmotion: 'joy', emotions: [{ emotion: 'joy', score: 0.92 }, { emotion: 'satisfaction', score: 0.85 }], sentiment: 'positive', sentimentScore: 0.95, status: 'completed', aiResponse: { primaryEmotion: 'joy', emotions: [{ emotion: 'joy', score: 0.92 }], sentiment: 'positive', sentimentScore: 0.95, insights: ['Customer is highly satisfied'] }, businessId: demoBusiness.id },
    { id: 'emotion-2', title: 'Frustrated Caller', description: 'Angry about service', inputText: 'This is absolutely ridiculous! I have been waiting for an hour!', primaryEmotion: 'anger', emotions: [{ emotion: 'anger', score: 0.88 }, { emotion: 'frustration', score: 0.92 }], sentiment: 'negative', sentimentScore: -0.85, status: 'completed', aiResponse: { primaryEmotion: 'anger', emotions: [{ emotion: 'anger', score: 0.88 }], sentiment: 'negative', sentimentScore: -0.85, insights: ['Immediate attention needed', 'Consider escalation'] }, businessId: demoBusiness.id },
    { id: 'emotion-3', title: 'Confused User', description: 'Needs clarification', inputText: 'I do not understand how this works. It is very confusing.', primaryEmotion: 'confusion', emotions: [{ emotion: 'confusion', score: 0.78 }, { emotion: 'frustration', score: 0.45 }], sentiment: 'negative', sentimentScore: -0.35, status: 'completed', aiResponse: { primaryEmotion: 'confusion', emotions: [{ emotion: 'confusion', score: 0.78 }], sentiment: 'negative', sentimentScore: -0.35, insights: ['Needs clear explanation', 'Provide step-by-step guidance'] }, businessId: demoBusiness.id },
    { id: 'emotion-4', title: 'Anxious Customer', description: 'Worried about order', inputText: 'I am really worried my package will not arrive in time for the birthday.', primaryEmotion: 'fear', emotions: [{ emotion: 'fear', score: 0.72 }, { emotion: 'anticipation', score: 0.65 }], sentiment: 'negative', sentimentScore: -0.45, status: 'completed', aiResponse: { primaryEmotion: 'fear', emotions: [{ emotion: 'fear', score: 0.72 }], sentiment: 'negative', sentimentScore: -0.45, insights: ['Reassurance needed', 'Provide tracking information'] }, businessId: demoBusiness.id },
    { id: 'emotion-5', title: 'Grateful Response', description: 'Thankful customer', inputText: 'Thank you so much for helping me with this! You have been amazing!', primaryEmotion: 'joy', emotions: [{ emotion: 'joy', score: 0.88 }, { emotion: 'gratitude', score: 0.95 }], sentiment: 'positive', sentimentScore: 0.92, status: 'completed', aiResponse: { primaryEmotion: 'joy', emotions: [{ emotion: 'joy', score: 0.88 }, { emotion: 'gratitude', score: 0.95 }], sentiment: 'positive', sentimentScore: 0.92, insights: ['Positive experience', 'Good candidate for review request'] }, businessId: demoBusiness.id },
    { id: 'emotion-6', title: 'Disappointed Review', description: 'Let down by product', inputText: 'I expected so much more from this product. Very disappointed.', primaryEmotion: 'sadness', emotions: [{ emotion: 'sadness', score: 0.68 }, { emotion: 'disappointment', score: 0.82 }], sentiment: 'negative', sentimentScore: -0.65, status: 'completed', aiResponse: { primaryEmotion: 'sadness', emotions: [{ emotion: 'disappointment', score: 0.82 }], sentiment: 'negative', sentimentScore: -0.65, insights: ['Expectations not met', 'Investigate product issues'] }, businessId: demoBusiness.id },
    { id: 'emotion-7', title: 'Excited Prospect', description: 'Eager to purchase', inputText: 'I cannot wait to try this! When can I get it?', primaryEmotion: 'anticipation', emotions: [{ emotion: 'anticipation', score: 0.85 }, { emotion: 'excitement', score: 0.88 }], sentiment: 'positive', sentimentScore: 0.82, status: 'completed', aiResponse: { primaryEmotion: 'anticipation', emotions: [{ emotion: 'excitement', score: 0.88 }], sentiment: 'positive', sentimentScore: 0.82, insights: ['High purchase intent', 'Fast-track the order'] }, businessId: demoBusiness.id },
    { id: 'emotion-8', title: 'Neutral Inquiry', description: 'Standard question', inputText: 'I would like information about your business hours please.', primaryEmotion: 'neutral', emotions: [{ emotion: 'neutral', score: 0.92 }], sentiment: 'neutral', sentimentScore: 0.0, status: 'completed', aiResponse: { primaryEmotion: 'neutral', emotions: [{ emotion: 'neutral', score: 0.92 }], sentiment: 'neutral', sentimentScore: 0.0, insights: ['Straightforward inquiry', 'Provide requested information'] }, businessId: demoBusiness.id },
    { id: 'emotion-9', title: 'Surprised Customer', description: 'Unexpected outcome', inputText: 'Wow, I did not expect the discount to be this good!', primaryEmotion: 'surprise', emotions: [{ emotion: 'surprise', score: 0.82 }, { emotion: 'joy', score: 0.75 }], sentiment: 'positive', sentimentScore: 0.78, status: 'completed', aiResponse: { primaryEmotion: 'surprise', emotions: [{ emotion: 'surprise', score: 0.82 }], sentiment: 'positive', sentimentScore: 0.78, insights: ['Positive surprise', 'Good upsell opportunity'] }, businessId: demoBusiness.id },
    { id: 'emotion-10', title: 'Skeptical Prospect', description: 'Doubting claims', inputText: 'That sounds too good to be true. What is the catch?', primaryEmotion: 'trust', emotions: [{ emotion: 'distrust', score: 0.72 }, { emotion: 'skepticism', score: 0.78 }], sentiment: 'negative', sentimentScore: -0.25, status: 'completed', aiResponse: { primaryEmotion: 'trust', emotions: [{ emotion: 'skepticism', score: 0.78 }], sentiment: 'negative', sentimentScore: -0.25, insights: ['Build trust', 'Provide testimonials or proof'] }, businessId: demoBusiness.id },
    { id: 'emotion-11', title: 'Impatient Caller', description: 'Running out of patience', inputText: 'How much longer is this going to take? I have things to do.', primaryEmotion: 'frustration', emotions: [{ emotion: 'frustration', score: 0.75 }, { emotion: 'impatience', score: 0.85 }], sentiment: 'negative', sentimentScore: -0.55, status: 'completed', aiResponse: { primaryEmotion: 'frustration', emotions: [{ emotion: 'impatience', score: 0.85 }], sentiment: 'negative', sentimentScore: -0.55, insights: ['Expedite service', 'Provide time estimate'] }, businessId: demoBusiness.id },
    { id: 'emotion-12', title: 'Relieved Customer', description: 'Issue resolved', inputText: 'Oh thank goodness, that is such a relief! I was so worried.', primaryEmotion: 'joy', emotions: [{ emotion: 'relief', score: 0.88 }, { emotion: 'joy', score: 0.72 }], sentiment: 'positive', sentimentScore: 0.75, status: 'completed', aiResponse: { primaryEmotion: 'joy', emotions: [{ emotion: 'relief', score: 0.88 }], sentiment: 'positive', sentimentScore: 0.75, insights: ['Successfully resolved concern', 'Follow up recommended'] }, businessId: demoBusiness.id },
    { id: 'emotion-13', title: 'Sad Cancellation', description: 'Regretful goodbye', inputText: 'I hate to cancel, but I just cannot afford it anymore.', primaryEmotion: 'sadness', emotions: [{ emotion: 'sadness', score: 0.68 }, { emotion: 'regret', score: 0.72 }], sentiment: 'negative', sentimentScore: -0.45, status: 'completed', aiResponse: { primaryEmotion: 'sadness', emotions: [{ emotion: 'regret', score: 0.72 }], sentiment: 'negative', sentimentScore: -0.45, insights: ['Offer retention discount', 'Pause option'] }, businessId: demoBusiness.id },
    { id: 'emotion-14', title: 'Loving Review', description: 'Product love', inputText: 'I absolutely love this product! Best purchase I have ever made!', primaryEmotion: 'love', emotions: [{ emotion: 'love', score: 0.92 }, { emotion: 'joy', score: 0.88 }], sentiment: 'positive', sentimentScore: 0.95, status: 'completed', aiResponse: { primaryEmotion: 'love', emotions: [{ emotion: 'love', score: 0.92 }], sentiment: 'positive', sentimentScore: 0.95, insights: ['Brand advocate potential', 'Request testimonial'] }, businessId: demoBusiness.id },
    { id: 'emotion-15', title: 'Concerned Parent', description: 'Safety concerns', inputText: 'Is this product safe for children? I need to be sure before buying.', primaryEmotion: 'fear', emotions: [{ emotion: 'concern', score: 0.78 }, { emotion: 'fear', score: 0.55 }], sentiment: 'negative', sentimentScore: -0.28, status: 'completed', aiResponse: { primaryEmotion: 'fear', emotions: [{ emotion: 'concern', score: 0.78 }], sentiment: 'negative', sentimentScore: -0.28, insights: ['Provide safety information', 'Build confidence'] }, businessId: demoBusiness.id },
  ];

  for (const data of emotionDetectionsData) {
    await prisma.emotionDetection.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${emotionDetectionsData.length} emotion detections`);

  // ============================================
  // 22. AI MULTI-LANGUAGE SUPPORT (15+ items)
  // ============================================
  console.log('Creating multi-language detections...');
  const multiLanguageData = [
    { id: 'lang-1', title: 'Spanish Message', description: 'Spanish customer inquiry', inputText: 'Hola, me gustaria saber el precio de este producto.', detectedLanguage: 'es', languageName: 'Spanish', confidence: 0.98, supportedLanguages: { script: 'Latin', dialect: 'Castilian', formality: 'informal', region: 'General' }, status: 'completed', aiResponse: { detectedLanguage: 'es', languageName: 'Spanish', confidence: 0.98, characteristics: { script: 'Latin', dialect: 'Castilian' } }, businessId: demoBusiness.id },
    { id: 'lang-2', title: 'French Greeting', description: 'French hello', inputText: 'Bonjour, comment puis-je vous aider aujourd hui?', detectedLanguage: 'fr', languageName: 'French', confidence: 0.97, supportedLanguages: { script: 'Latin', dialect: 'Standard French', formality: 'formal', region: 'France' }, status: 'completed', aiResponse: { detectedLanguage: 'fr', languageName: 'French', confidence: 0.97, characteristics: { script: 'Latin', dialect: 'Standard French' } }, businessId: demoBusiness.id },
    { id: 'lang-3', title: 'German Support', description: 'German tech query', inputText: 'Ich habe ein Problem mit meinem Computer.', detectedLanguage: 'de', languageName: 'German', confidence: 0.96, supportedLanguages: { script: 'Latin', dialect: 'Standard German', formality: 'neutral', region: 'Germany' }, status: 'completed', aiResponse: { detectedLanguage: 'de', languageName: 'German', confidence: 0.96, characteristics: { script: 'Latin', dialect: 'Standard German' } }, businessId: demoBusiness.id },
    { id: 'lang-4', title: 'Japanese Inquiry', description: 'Japanese question', inputText: 'sumimasen, kono seihin wa nihon ni haisou dekimasuka?', detectedLanguage: 'ja', languageName: 'Japanese', confidence: 0.94, supportedLanguages: { script: 'Romaji', dialect: 'Standard Japanese', formality: 'polite', region: 'Japan' }, status: 'completed', aiResponse: { detectedLanguage: 'ja', languageName: 'Japanese', confidence: 0.94, characteristics: { script: 'Mixed', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-5', title: 'Chinese Message', description: 'Mandarin Chinese', inputText: 'nin hao, wo xiang wen yi xia jia ge.', detectedLanguage: 'zh', languageName: 'Chinese', confidence: 0.92, supportedLanguages: { script: 'Pinyin', dialect: 'Mandarin', formality: 'polite', region: 'China' }, status: 'completed', aiResponse: { detectedLanguage: 'zh', languageName: 'Chinese', confidence: 0.92, characteristics: { script: 'Pinyin', dialect: 'Mandarin' } }, businessId: demoBusiness.id },
    { id: 'lang-6', title: 'Italian Request', description: 'Italian service request', inputText: 'Vorrei prenotare un tavolo per due persone.', detectedLanguage: 'it', languageName: 'Italian', confidence: 0.97, supportedLanguages: { script: 'Latin', dialect: 'Standard Italian', formality: 'formal', region: 'Italy' }, status: 'completed', aiResponse: { detectedLanguage: 'it', languageName: 'Italian', confidence: 0.97, characteristics: { script: 'Latin', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-7', title: 'Portuguese Feedback', description: 'Brazilian Portuguese', inputText: 'Muito obrigado pelo excelente atendimento!', detectedLanguage: 'pt', languageName: 'Portuguese', confidence: 0.96, supportedLanguages: { script: 'Latin', dialect: 'Brazilian', formality: 'informal', region: 'Brazil' }, status: 'completed', aiResponse: { detectedLanguage: 'pt', languageName: 'Portuguese', confidence: 0.96, characteristics: { script: 'Latin', dialect: 'Brazilian' } }, businessId: demoBusiness.id },
    { id: 'lang-8', title: 'Korean Question', description: 'Korean inquiry', inputText: 'annyeonghaseyo, i jepumeun eolmayeyo?', detectedLanguage: 'ko', languageName: 'Korean', confidence: 0.93, supportedLanguages: { script: 'Romanized', dialect: 'Standard Korean', formality: 'polite', region: 'South Korea' }, status: 'completed', aiResponse: { detectedLanguage: 'ko', languageName: 'Korean', confidence: 0.93, characteristics: { script: 'Mixed', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-9', title: 'Arabic Greeting', description: 'Arabic hello', inputText: 'marhaba, kayf yumkinuni musa adatuk?', detectedLanguage: 'ar', languageName: 'Arabic', confidence: 0.91, supportedLanguages: { script: 'Romanized', dialect: 'Modern Standard', formality: 'formal', region: 'Middle East' }, status: 'completed', aiResponse: { detectedLanguage: 'ar', languageName: 'Arabic', confidence: 0.91, characteristics: { script: 'Romanized Arabic', dialect: 'MSA' } }, businessId: demoBusiness.id },
    { id: 'lang-10', title: 'Hindi Support', description: 'Hindi question', inputText: 'namaste, kya aap meri madad kar sakte hain?', detectedLanguage: 'hi', languageName: 'Hindi', confidence: 0.94, supportedLanguages: { script: 'Romanized', dialect: 'Standard Hindi', formality: 'polite', region: 'India' }, status: 'completed', aiResponse: { detectedLanguage: 'hi', languageName: 'Hindi', confidence: 0.94, characteristics: { script: 'Romanized Devanagari', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-11', title: 'Russian Message', description: 'Russian inquiry', inputText: 'zdravstvuyte, ya khotel by uznat o vashikh uslugakh.', detectedLanguage: 'ru', languageName: 'Russian', confidence: 0.92, supportedLanguages: { script: 'Romanized', dialect: 'Standard Russian', formality: 'formal', region: 'Russia' }, status: 'completed', aiResponse: { detectedLanguage: 'ru', languageName: 'Russian', confidence: 0.92, characteristics: { script: 'Romanized Cyrillic', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-12', title: 'Dutch Request', description: 'Dutch message', inputText: 'Goedemorgen, kunt u mij helpen met mijn bestelling?', detectedLanguage: 'nl', languageName: 'Dutch', confidence: 0.95, supportedLanguages: { script: 'Latin', dialect: 'Standard Dutch', formality: 'formal', region: 'Netherlands' }, status: 'completed', aiResponse: { detectedLanguage: 'nl', languageName: 'Dutch', confidence: 0.95, characteristics: { script: 'Latin', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-13', title: 'English Standard', description: 'English message', inputText: 'Hello, I would like to inquire about your services.', detectedLanguage: 'en', languageName: 'English', confidence: 0.99, supportedLanguages: { script: 'Latin', dialect: 'Standard', formality: 'formal', region: 'International' }, status: 'completed', aiResponse: { detectedLanguage: 'en', languageName: 'English', confidence: 0.99, characteristics: { script: 'Latin', dialect: 'American/British' } }, businessId: demoBusiness.id },
    { id: 'lang-14', title: 'Turkish Greeting', description: 'Turkish hello', inputText: 'Merhaba, bu urun hakkinda bilgi alabilir miyim?', detectedLanguage: 'tr', languageName: 'Turkish', confidence: 0.94, supportedLanguages: { script: 'Latin', dialect: 'Standard Turkish', formality: 'polite', region: 'Turkey' }, status: 'completed', aiResponse: { detectedLanguage: 'tr', languageName: 'Turkish', confidence: 0.94, characteristics: { script: 'Latin', dialect: 'Standard' } }, businessId: demoBusiness.id },
    { id: 'lang-15', title: 'Polish Question', description: 'Polish inquiry', inputText: 'Dzien dobry, chcialbym zamowic produkt.', detectedLanguage: 'pl', languageName: 'Polish', confidence: 0.93, supportedLanguages: { script: 'Latin', dialect: 'Standard Polish', formality: 'formal', region: 'Poland' }, status: 'completed', aiResponse: { detectedLanguage: 'pl', languageName: 'Polish', confidence: 0.93, characteristics: { script: 'Latin', dialect: 'Standard' } }, businessId: demoBusiness.id },
  ];

  for (const data of multiLanguageData) {
    await prisma.multiLanguageSupport.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${multiLanguageData.length} multi-language detections`);

  // ============================================
  // 23. AI LANGUAGE TRANSLATIONS (15+ items)
  // ============================================
  console.log('Creating language translations...');
  const translationsData = [
    { id: 'trans-1', title: 'Welcome Message ES', description: 'English to Spanish welcome', originalText: 'Welcome to our customer service. How may I assist you today?', translatedText: 'Bienvenido a nuestro servicio al cliente. Como puedo ayudarle hoy?', sourceLanguage: 'en', targetLanguage: 'es', category: 'general', status: 'completed', aiResponse: { translation: 'Bienvenido a nuestro servicio al cliente. Como puedo ayudarle hoy?', alternatives: [{ text: 'Le damos la bienvenida...', style: 'formal' }], notes: 'Formal Spanish appropriate for business' }, businessId: demoBusiness.id },
    { id: 'trans-2', title: 'Medical Instructions FR', description: 'English to French medical', originalText: 'Take two tablets twice daily with food.', translatedText: 'Prenez deux comprimes deux fois par jour avec de la nourriture.', sourceLanguage: 'en', targetLanguage: 'fr', category: 'medical', status: 'completed', aiResponse: { translation: 'Prenez deux comprimes deux fois par jour avec de la nourriture.', alternatives: [{ text: 'Prendre deux comprimes...', style: 'formal' }], notes: 'Medical French with proper terminology' }, businessId: demoBusiness.id },
    { id: 'trans-3', title: 'Legal Notice DE', description: 'English to German legal', originalText: 'By using this service, you agree to our terms and conditions.', translatedText: 'Durch die Nutzung dieses Dienstes stimmen Sie unseren Allgemeinen Geschaftsbedingungen zu.', sourceLanguage: 'en', targetLanguage: 'de', category: 'legal', status: 'completed', aiResponse: { translation: 'Durch die Nutzung dieses Dienstes stimmen Sie unseren Allgemeinen Geschaftsbedingungen zu.', alternatives: [], notes: 'Formal German legal language' }, businessId: demoBusiness.id },
    { id: 'trans-4', title: 'Course Description JA', description: 'English to Japanese education', originalText: 'This course covers the fundamentals of programming.', translatedText: 'Kono kosu wa puroguramingu no kihon wo oshiemasu.', sourceLanguage: 'en', targetLanguage: 'ja', category: 'education', status: 'completed', aiResponse: { translation: 'Kono kosu wa puroguramingu no kihon wo oshiemasu.', alternatives: [], notes: 'Educational Japanese, polite form' }, businessId: demoBusiness.id },
    { id: 'trans-5', title: 'Technical Manual ZH', description: 'English to Chinese technical', originalText: 'Connect the power cable to the main unit before starting.', translatedText: 'Zai qidong zhi qian, qing jiang dianlan lianjie dao zhu ji.', sourceLanguage: 'en', targetLanguage: 'zh', category: 'technical', status: 'completed', aiResponse: { translation: 'Zai qidong zhi qian, qing jiang dianlan lianjie dao zhu ji.', alternatives: [], notes: 'Technical Chinese with proper terminology' }, businessId: demoBusiness.id },
    { id: 'trans-6', title: 'Business Email IT', description: 'English to Italian business', originalText: 'Thank you for your inquiry. We will respond within 24 hours.', translatedText: 'Grazie per la sua richiesta. Le risponderemo entro 24 ore.', sourceLanguage: 'en', targetLanguage: 'it', category: 'business', status: 'completed', aiResponse: { translation: 'Grazie per la sua richiesta. Le risponderemo entro 24 ore.', alternatives: [{ text: 'La ringraziamo...', style: 'more formal' }], notes: 'Formal Italian business language' }, businessId: demoBusiness.id },
    { id: 'trans-7', title: 'Product Description PT', description: 'English to Portuguese product', originalText: 'This premium product is designed for professional use.', translatedText: 'Este produto premium foi projetado para uso profissional.', sourceLanguage: 'en', targetLanguage: 'pt', category: 'general', status: 'completed', aiResponse: { translation: 'Este produto premium foi projetado para uso profissional.', alternatives: [], notes: 'Brazilian Portuguese, marketing language' }, businessId: demoBusiness.id },
    { id: 'trans-8', title: 'Support Message KO', description: 'English to Korean support', originalText: 'Our support team is available 24/7 to assist you.', translatedText: 'Jeo hui jiwon tim eun 24 sigan yeoljung mueosideun dowadeurilsu itseupnida.', sourceLanguage: 'en', targetLanguage: 'ko', category: 'general', status: 'completed', aiResponse: { translation: 'Jeo hui jiwon tim eun 24 sigan yeoljung mueosideun dowadeurilsu itseupnida.', alternatives: [], notes: 'Formal Korean honorific speech' }, businessId: demoBusiness.id },
    { id: 'trans-9', title: 'Safety Warning AR', description: 'English to Arabic safety', originalText: 'Warning: Keep out of reach of children.', translatedText: 'tahdhir: yahfaz ba eidan an mutanawal al atfal.', sourceLanguage: 'en', targetLanguage: 'ar', category: 'general', status: 'completed', aiResponse: { translation: 'tahdhir: yahfaz ba eidan an mutanawal al atfal.', alternatives: [], notes: 'Modern Standard Arabic, formal warning' }, businessId: demoBusiness.id },
    { id: 'trans-10', title: 'Instructions HI', description: 'English to Hindi instructions', originalText: 'Please follow these simple steps to complete the process.', translatedText: 'Kripaya prakriya ko pura karne ke liye in saral kadamon ka palan karen.', sourceLanguage: 'en', targetLanguage: 'hi', category: 'general', status: 'completed', aiResponse: { translation: 'Kripaya prakriya ko pura karne ke liye in saral kadamon ka palan karen.', alternatives: [], notes: 'Standard Hindi, polite form' }, businessId: demoBusiness.id },
    { id: 'trans-11', title: 'Contract Terms RU', description: 'English to Russian legal', originalText: 'This agreement is binding upon both parties.', translatedText: 'Dannoye soglasheniye yavlyayetsya obyazatelnym dlya obeikh storon.', sourceLanguage: 'en', targetLanguage: 'ru', category: 'legal', status: 'completed', aiResponse: { translation: 'Dannoye soglasheniye yavlyayetsya obyazatelnym dlya obeikh storon.', alternatives: [], notes: 'Russian legal terminology' }, businessId: demoBusiness.id },
    { id: 'trans-12', title: 'Greeting NL', description: 'English to Dutch greeting', originalText: 'Good morning! Welcome to our office.', translatedText: 'Goedemorgen! Welkom in ons kantoor.', sourceLanguage: 'en', targetLanguage: 'nl', category: 'general', status: 'completed', aiResponse: { translation: 'Goedemorgen! Welkom in ons kantoor.', alternatives: [{ text: 'Goedendag!', style: 'afternoon' }], notes: 'Standard Dutch greeting' }, businessId: demoBusiness.id },
    { id: 'trans-13', title: 'Menu Item ES', description: 'English to Spanish food', originalText: 'Grilled chicken with seasonal vegetables and rice.', translatedText: 'Pollo a la parrilla con verduras de temporada y arroz.', sourceLanguage: 'en', targetLanguage: 'es', category: 'general', status: 'completed', aiResponse: { translation: 'Pollo a la parrilla con verduras de temporada y arroz.', alternatives: [], notes: 'Spanish menu description' }, businessId: demoBusiness.id },
    { id: 'trans-14', title: 'Prescription Label FR', description: 'English to French medical', originalText: 'Apply to affected area twice daily.', translatedText: 'Appliquer sur la zone affectee deux fois par jour.', sourceLanguage: 'en', targetLanguage: 'fr', category: 'medical', status: 'completed', aiResponse: { translation: 'Appliquer sur la zone affectee deux fois par jour.', alternatives: [], notes: 'Medical French instructions' }, businessId: demoBusiness.id },
    { id: 'trans-15', title: 'Exam Instructions DE', description: 'English to German education', originalText: 'Read all questions carefully before answering.', translatedText: 'Lesen Sie alle Fragen sorgfaltig, bevor Sie antworten.', sourceLanguage: 'en', targetLanguage: 'de', category: 'education', status: 'completed', aiResponse: { translation: 'Lesen Sie alle Fragen sorgfaltig, bevor Sie antworten.', alternatives: [], notes: 'Formal German for educational setting' }, businessId: demoBusiness.id },
  ];

  for (const data of translationsData) {
    await prisma.languageTranslation.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${translationsData.length} language translations`);

  // ============================================
  // 24. AI HEARING TESTS (15+ items)
  // ============================================
  console.log('Creating hearing tests...');
  const hearingTestsData = [
    { id: 'hear-1', title: 'Annual Checkup - Normal', description: 'Routine hearing examination', patientName: 'John Smith', patientAge: 35, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 15, rightEar: 10 }, { frequency: 500, leftEar: 10, rightEar: 15 }, { frequency: 1000, leftEar: 15, rightEar: 10 }, { frequency: 2000, leftEar: 20, rightEar: 15 }, { frequency: 4000, leftEar: 20, rightEar: 20 }, { frequency: 8000, leftEar: 25, rightEar: 25 }], results: { overallResult: 'Normal', diagnosis: 'Hearing within normal limits' }, recommendations: 'Continue annual hearing screenings. Avoid prolonged exposure to loud noises.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 250, threshold: 12 }], recommendations: ['Annual screening', 'Hearing protection'] }, businessId: demoBusiness.id },
    { id: 'hear-2', title: 'Industrial Worker Screening', description: 'Occupational hearing test', patientName: 'Mike Johnson', patientAge: 45, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 20, rightEar: 15 }, { frequency: 500, leftEar: 20, rightEar: 20 }, { frequency: 1000, leftEar: 25, rightEar: 20 }, { frequency: 2000, leftEar: 35, rightEar: 30 }, { frequency: 4000, leftEar: 45, rightEar: 40 }, { frequency: 8000, leftEar: 50, rightEar: 45 }], results: { overallResult: 'Mild', diagnosis: 'Mild high-frequency hearing loss' }, recommendations: 'Use hearing protection at work. Consider audiologist consultation for hearing aids.', status: 'completed', aiResponse: { overallResult: 'Mild', frequencyResults: [{ frequency: 4000, threshold: 42 }], recommendations: ['Hearing protection mandatory', 'Consider hearing aids'] }, businessId: demoBusiness.id },
    { id: 'hear-3', title: 'Pediatric Assessment', description: 'Child hearing evaluation', patientName: 'Emma Davis', patientAge: 8, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 10, rightEar: 10 }, { frequency: 500, leftEar: 10, rightEar: 10 }, { frequency: 1000, leftEar: 10, rightEar: 15 }, { frequency: 2000, leftEar: 15, rightEar: 10 }, { frequency: 4000, leftEar: 15, rightEar: 15 }, { frequency: 8000, leftEar: 20, rightEar: 15 }], results: { overallResult: 'Normal', diagnosis: 'Normal hearing for age' }, recommendations: 'No concerns. Retest in one year or if parents notice any hearing difficulties.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 1000, threshold: 12 }], recommendations: ['Annual retest', 'Monitor for changes'] }, businessId: demoBusiness.id },
    { id: 'hear-4', title: 'Senior Assessment', description: 'Age-related hearing check', patientName: 'Robert Brown', patientAge: 72, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 25, rightEar: 30 }, { frequency: 500, leftEar: 30, rightEar: 35 }, { frequency: 1000, leftEar: 35, rightEar: 40 }, { frequency: 2000, leftEar: 45, rightEar: 50 }, { frequency: 4000, leftEar: 55, rightEar: 60 }, { frequency: 8000, leftEar: 65, rightEar: 70 }], results: { overallResult: 'Moderate', diagnosis: 'Moderate sensorineural hearing loss consistent with presbycusis' }, recommendations: 'Hearing aids strongly recommended. Consider speech therapy if communication difficulties persist.', status: 'completed', aiResponse: { overallResult: 'Moderate', frequencyResults: [{ frequency: 4000, threshold: 57 }], recommendations: ['Hearing aids recommended', 'ENT follow-up'] }, businessId: demoBusiness.id },
    { id: 'hear-5', title: 'Musician Monitoring', description: 'Professional musician hearing', patientName: 'Sarah Wilson', patientAge: 28, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 10, rightEar: 10 }, { frequency: 500, leftEar: 15, rightEar: 10 }, { frequency: 1000, leftEar: 15, rightEar: 15 }, { frequency: 2000, leftEar: 20, rightEar: 20 }, { frequency: 4000, leftEar: 30, rightEar: 25 }, { frequency: 8000, leftEar: 35, rightEar: 30 }], results: { overallResult: 'Mild', diagnosis: 'Early noise-induced notch at 4000Hz' }, recommendations: 'Use musician earplugs during performances. Limit exposure to amplified sound. Retest in 6 months.', status: 'completed', aiResponse: { overallResult: 'Mild', frequencyResults: [{ frequency: 4000, threshold: 27 }], recommendations: ['Custom musician earplugs', 'Volume monitoring'] }, businessId: demoBusiness.id },
    { id: 'hear-6', title: 'Post-Treatment Follow-up', description: 'After ear infection treatment', patientName: 'James Miller', patientAge: 42, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 20, rightEar: 15 }, { frequency: 500, leftEar: 15, rightEar: 15 }, { frequency: 1000, leftEar: 15, rightEar: 10 }, { frequency: 2000, leftEar: 20, rightEar: 15 }, { frequency: 4000, leftEar: 20, rightEar: 20 }, { frequency: 8000, leftEar: 25, rightEar: 20 }], results: { overallResult: 'Normal', diagnosis: 'Hearing returned to normal following treatment' }, recommendations: 'No further treatment needed. Return if symptoms recur.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 1000, threshold: 12 }], recommendations: ['Recovery complete', 'Follow-up if needed'] }, businessId: demoBusiness.id },
    { id: 'hear-7', title: 'Tinnitus Evaluation', description: 'Ringing in ears assessment', patientName: 'Jennifer Lee', patientAge: 38, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 15, rightEar: 15 }, { frequency: 500, leftEar: 15, rightEar: 20 }, { frequency: 1000, leftEar: 20, rightEar: 20 }, { frequency: 2000, leftEar: 25, rightEar: 30 }, { frequency: 4000, leftEar: 35, rightEar: 40 }, { frequency: 8000, leftEar: 40, rightEar: 45 }], results: { overallResult: 'Mild', diagnosis: 'Mild hearing loss with tinnitus' }, recommendations: 'Avoid caffeine and loud noises. Consider white noise therapy. Audiologist follow-up recommended.', status: 'completed', aiResponse: { overallResult: 'Mild', frequencyResults: [{ frequency: 4000, threshold: 37 }], recommendations: ['Tinnitus management', 'Sound therapy options'] }, businessId: demoBusiness.id },
    { id: 'hear-8', title: 'Newborn Screening', description: 'Infant hearing check', patientName: 'Baby Taylor', patientAge: 0, testType: 'otoacoustic', frequencies: [{ frequency: 1000, leftEar: 0, rightEar: 0 }, { frequency: 2000, leftEar: 0, rightEar: 0 }, { frequency: 4000, leftEar: 0, rightEar: 0 }], results: { overallResult: 'Normal', diagnosis: 'Pass - OAE present bilaterally' }, recommendations: 'Normal newborn screening. Follow up at 6 months for behavioral audiometry if needed.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 2000, threshold: 0 }], recommendations: ['Passed screening', 'Follow-up at 6 months'] }, businessId: demoBusiness.id },
    { id: 'hear-9', title: 'Construction Worker', description: 'High-noise occupation test', patientName: 'Tom Garcia', patientAge: 52, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 25, rightEar: 20 }, { frequency: 500, leftEar: 25, rightEar: 25 }, { frequency: 1000, leftEar: 30, rightEar: 25 }, { frequency: 2000, leftEar: 40, rightEar: 35 }, { frequency: 4000, leftEar: 55, rightEar: 50 }, { frequency: 8000, leftEar: 60, rightEar: 55 }], results: { overallResult: 'Moderate', diagnosis: 'Noise-induced hearing loss, bilateral' }, recommendations: 'Mandatory hearing protection. Hearing aids recommended. Consider job reassignment to lower noise area.', status: 'completed', aiResponse: { overallResult: 'Moderate', frequencyResults: [{ frequency: 4000, threshold: 52 }], recommendations: ['Hearing aids', 'Work accommodation needed'] }, businessId: demoBusiness.id },
    { id: 'hear-10', title: 'Speech Recognition Test', description: 'Word recognition evaluation', patientName: 'Linda Martinez', patientAge: 55, testType: 'speech', frequencies: [{ frequency: 500, leftEar: 20, rightEar: 25 }, { frequency: 1000, leftEar: 25, rightEar: 30 }, { frequency: 2000, leftEar: 35, rightEar: 40 }], results: { overallResult: 'Mild', diagnosis: 'Reduced word recognition scores with mild hearing loss' }, recommendations: 'Consider hearing aids with speech enhancement features. Speech reading classes may be beneficial.', status: 'completed', aiResponse: { overallResult: 'Mild', frequencyResults: [{ frequency: 2000, threshold: 37 }], recommendations: ['Hearing aids with speech enhancement', 'Communication strategies training'] }, businessId: demoBusiness.id },
    { id: 'hear-11', title: 'Student Screening', description: 'School hearing test', patientName: 'Alex Thompson', patientAge: 12, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 10, rightEar: 10 }, { frequency: 500, leftEar: 10, rightEar: 10 }, { frequency: 1000, leftEar: 10, rightEar: 10 }, { frequency: 2000, leftEar: 15, rightEar: 10 }, { frequency: 4000, leftEar: 15, rightEar: 15 }, { frequency: 8000, leftEar: 15, rightEar: 15 }], results: { overallResult: 'Normal', diagnosis: 'Passed school hearing screening' }, recommendations: 'No concerns noted. Rescreen as part of annual school health program.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 1000, threshold: 10 }], recommendations: ['Passed', 'Annual rescreen'] }, businessId: demoBusiness.id },
    { id: 'hear-12', title: 'Sudden Hearing Loss', description: 'Emergency assessment', patientName: 'David Anderson', patientAge: 48, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 15, rightEar: 55 }, { frequency: 500, leftEar: 15, rightEar: 60 }, { frequency: 1000, leftEar: 15, rightEar: 65 }, { frequency: 2000, leftEar: 20, rightEar: 70 }, { frequency: 4000, leftEar: 20, rightEar: 75 }, { frequency: 8000, leftEar: 25, rightEar: 80 }], results: { overallResult: 'Severe', diagnosis: 'Sudden sensorineural hearing loss - right ear' }, recommendations: 'Urgent ENT referral. Consider steroid treatment. MRI recommended to rule out acoustic neuroma.', status: 'completed', aiResponse: { overallResult: 'Severe', frequencyResults: [{ frequency: 2000, threshold: 70 }], recommendations: ['Urgent ENT referral', 'MRI recommended', 'Steroid treatment'] }, businessId: demoBusiness.id },
    { id: 'hear-13', title: 'Hearing Aid Fitting', description: 'Pre-fitting assessment', patientName: 'Carol White', patientAge: 65, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 30, rightEar: 35 }, { frequency: 500, leftEar: 35, rightEar: 40 }, { frequency: 1000, leftEar: 40, rightEar: 45 }, { frequency: 2000, leftEar: 50, rightEar: 55 }, { frequency: 4000, leftEar: 55, rightEar: 60 }, { frequency: 8000, leftEar: 60, rightEar: 65 }], results: { overallResult: 'Moderate', diagnosis: 'Bilateral moderate sensorineural hearing loss' }, recommendations: 'Good candidate for bilateral hearing aids. Behind-the-ear style recommended for best results.', status: 'completed', aiResponse: { overallResult: 'Moderate', frequencyResults: [{ frequency: 2000, threshold: 52 }], recommendations: ['Bilateral hearing aids', 'BTE style recommended'] }, businessId: demoBusiness.id },
    { id: 'hear-14', title: 'Earwax Check', description: 'Post-cleaning retest', patientName: 'Kevin Harris', patientAge: 58, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 15, rightEar: 15 }, { frequency: 500, leftEar: 15, rightEar: 15 }, { frequency: 1000, leftEar: 15, rightEar: 15 }, { frequency: 2000, leftEar: 20, rightEar: 20 }, { frequency: 4000, leftEar: 25, rightEar: 25 }, { frequency: 8000, leftEar: 30, rightEar: 30 }], results: { overallResult: 'Normal', diagnosis: 'Hearing normalized after cerumen removal' }, recommendations: 'Use ear drops weekly to prevent buildup. Avoid cotton swabs. Return if hearing decreases.', status: 'completed', aiResponse: { overallResult: 'Normal', frequencyResults: [{ frequency: 1000, threshold: 15 }], recommendations: ['Ear hygiene education', 'Preventive drops'] }, businessId: demoBusiness.id },
    { id: 'hear-15', title: 'Cochlear Implant Eval', description: 'Candidacy assessment', patientName: 'Nancy Robinson', patientAge: 62, testType: 'pure-tone', frequencies: [{ frequency: 250, leftEar: 70, rightEar: 75 }, { frequency: 500, leftEar: 75, rightEar: 80 }, { frequency: 1000, leftEar: 85, rightEar: 90 }, { frequency: 2000, leftEar: 90, rightEar: 95 }, { frequency: 4000, leftEar: 95, rightEar: 100 }, { frequency: 8000, leftEar: 100, rightEar: 105 }], results: { overallResult: 'Profound', diagnosis: 'Profound bilateral sensorineural hearing loss' }, recommendations: 'Candidate for cochlear implant evaluation. Referral to CI team for comprehensive workup.', status: 'completed', aiResponse: { overallResult: 'Profound', frequencyResults: [{ frequency: 2000, threshold: 92 }], recommendations: ['Cochlear implant candidacy evaluation', 'CI team referral'] }, businessId: demoBusiness.id },
  ];

  for (const data of hearingTestsData) {
    await prisma.hearingTest.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
  console.log(`Created ${hearingTestsData.length} hearing tests`);

  // ============================================
  // COMPLETION
  // ============================================
  console.log('\n========================================');
  console.log('Seeding completed successfully!');
  console.log('========================================');
  console.log('\nDemo credentials:');
  console.log('  Admin: admin@aivoiceagent.com / demo123');
  console.log('  Manager: manager@aivoiceagent.com / demo123');
  console.log('\nData summary:');
  console.log(`  - ${voicesData.length} voices`);
  console.log(`  - ${businesses.length} businesses`);
  console.log(`  - ${usersData.length} users`);
  console.log(`  - ${agents.length} agents`);
  console.log(`  - ${scriptsData.length} scripts`);
  console.log(`  - ${responsesData.length} responses`);
  console.log(`  - ${callFlowsData.length} call flows`);
  console.log(`  - ${phoneNumbers.length} phone numbers`);
  console.log(`  - ${callsData.length} calls`);
  console.log(`  - ${integrationsData.length} integrations`);
  console.log(`  - ${webhooksData.length} webhooks`);
  console.log(`  - ${apiKeysData.length} API keys`);
  console.log(`  - ${subscriptionsData.length} subscriptions`);
  console.log(`  - ${usageBillingData.length} billing records`);
  console.log(`  - ${analyticsData.length} analytics records`);
  console.log(`  - ${routingRulesData.length} routing rules`);
  console.log(`  - ${settingsData.length} system settings`);
  console.log(`  - ${speechEnhancementsData.length} speech enhancements`);
  console.log(`  - ${accentAdaptationsData.length} accent adaptations`);
  console.log(`  - ${intentClassificationsData.length} intent classifications`);
  console.log(`  - ${emotionDetectionsData.length} emotion detections`);
  console.log(`  - ${multiLanguageData.length} multi-language detections`);
  console.log(`  - ${translationsData.length} language translations`);
  console.log(`  - ${hearingTestsData.length} hearing tests`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
