import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getPagos, addPago } from '@/lib/db';

export const runtime = 'edge';

export async function GET(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jugadorId = searchParams.get('jugadorId') ?? undefined;

  try {
    const pagos = await getPagos(jugadorId);
    return NextResponse.json(pagos);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const pago = await addPago(body);
    return NextResponse.json(pago);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
