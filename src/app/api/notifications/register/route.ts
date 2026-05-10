import { NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { updatedAt: new Date() },
      create: { token },
    });

    return NextResponse.json(pushToken);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
