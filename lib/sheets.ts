import type { Jugador, Pago } from '@/types';

const SCRIPT_URL = process.env.SCRIPT_URL!;
const SCRIPT_SECRET = process.env.SCRIPT_SECRET!;

async function scriptGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('secret', SCRIPT_SECRET);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return json;
}

async function scriptPost<T>(
  action: string,
  payload: Record<string, unknown>,
  id?: string,
): Promise<T> {
  const body = JSON.stringify({ action, payload, id, secret: SCRIPT_SECRET });

  // Apps Script Web Apps redirect POST with 302 — follow manually to preserve method
  const firstRes = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    redirect: 'manual',
  });

  let finalRes: Response;
  if (firstRes.status === 301 || firstRes.status === 302) {
    const location = firstRes.headers.get('location');
    if (!location) throw new Error('Redirect sin Location header');
    finalRes = await fetch(location, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } else {
    finalRes = firstRes;
  }

  const json = await finalRes.json();
  if (json?.error) throw new Error(json.error);
  return json;
}

export const getJugadores = () => scriptGet<Jugador[]>('getJugadores');

export const getJugador = (id: string) => scriptGet<Jugador>('getJugador', { id });

export const addJugador = (payload: Omit<Jugador, 'id' | 'activo'>) =>
  scriptPost<Jugador>('addJugador', payload as Record<string, unknown>);

export const updateJugador = (id: string, payload: Partial<Jugador>) =>
  scriptPost<Jugador>('updateJugador', payload as Record<string, unknown>, id);

export const getPagos = (jugadorId?: string, mes?: number, año?: number) =>
  scriptGet<Pago[]>('getPagos', {
    ...(jugadorId ? { jugadorId } : {}),
    ...(mes ? { mes: String(mes) } : {}),
    ...(año ? { año: String(año) } : {}),
  });

export const addPago = (payload: Omit<Pago, 'id' | 'jugador_nombre'>) =>
  scriptPost<Pago>('addPago', payload as Record<string, unknown>);

export const deletePago = (id: string) =>
  scriptPost<{ deleted: boolean }>('deletePago', {}, id);
