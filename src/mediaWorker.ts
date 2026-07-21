import { PrismaClient } from '@prisma/client';
import { processMediaJobs } from './services/media-worker';

const prisma = new PrismaClient();
async function tick() { const result = await processMediaJobs(prisma); if (result.processed || result.cancelled) console.log('[media-worker]', result); }
const timer = setInterval(() => void tick().catch((error) => console.error('[media-worker]', error)), 5_000);
void tick().catch((error) => console.error('[media-worker]', error));
async function shutdown() { clearInterval(timer); await prisma.$disconnect(); process.exit(0); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

