import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getDashboard } from '@/lib/sheets';

export const runtime = 'edge';

export async function GET(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const data = await getDashboard();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
