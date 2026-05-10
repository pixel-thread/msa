import { NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/prisma';
import { getAuthFromCookies } from '@src/shared/api/auth';

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { 
        userId: auth.userId,
        updatedAt: new Date()
      },
      create: { 
        token,
        userId: auth.userId
      },
    });

    return NextResponse.json(pushToken);
  } catch (error) {
    console.error('Linking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
