import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { APPLICATION_SESSION_COOKIE, verifyApplicationSession } from '@/lib/application-session';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const applicationSession = verifyApplicationSession(request.cookies.get(APPLICATION_SESSION_COOKIE)?.value);
  const email = session?.user?.email || applicationSession?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, isActive: true, businessId: true },
  });
  if (!user?.isActive) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}
