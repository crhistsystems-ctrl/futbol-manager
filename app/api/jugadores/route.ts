import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getJugadores, addJugador } from '@/lib/sheets';

export const runtime = 'edge';

export async function GET(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const jugadores = await getJugadores();
    return NextResponse.json(jugadores);
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
    const jugador = await addJugador(body);
    return NextResponse.json(jugador);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
