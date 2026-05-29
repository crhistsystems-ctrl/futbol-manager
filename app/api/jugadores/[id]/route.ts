import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getJugador, updateJugador } from '@/lib/sheets';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    const jugador = await getJugador(id);
    return NextResponse.json(jugador);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const jugador = await updateJugador(id, body);
    return NextResponse.json(jugador);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
