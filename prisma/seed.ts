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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
