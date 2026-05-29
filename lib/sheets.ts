import type { Jugador, Pago } from '@/types';

const SCRIPT_URL = process.env.SCRIPT_URL!;
const SCRIPT_SECRET = process.env.SCRIPT_SECRET!;

// Lectura con caché de Vercel (revalidate 60s)
async function scriptRead<T>(action: string, params: Record<string, string> = {}, tags: string[] = []): Promise<T> {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('secret', SCRIPT_SECRET);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60, tags } });
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return json;
}

// Escritura sin caché
async function scriptWrite<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('secret', SCRIPT_SECRET);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  return json;
}

export const getJugadores = () =>
  scriptRead<Jugador[]>('getJugadores', {}, ['jugadores']);

export const getJugador = (id: string) =>
  scriptRead<Jugador>('getJugador', { id }, ['jugadores']);

export const getDashboard = () =>
  scriptRead<{ jugadores: Jugador[]; pagos: Pago[] }>('getDashboard', {}, ['jugadores', 'pagos']);

export const getPagos = (jugadorId?: string) =>
  scriptRead<Pago[]>('getPagos', jugadorId ? { jugadorId } : {}, ['pagos']);

export const addJugador = (payload: Omit<Jugador, 'id' | 'activo'>) =>
  scriptWrite<Jugador>('addJugador', {
    nombre: payload.nombre,
    telefono: payload.telefono,
    acudiente: payload.acudiente,
    cuota_mensual: String(payload.cuota_mensual),
    fecha_ingreso: payload.fecha_ingreso,
  });

export const updateJugador = (id: string, payload: Partial<Jugador>) => {
  const params: Record<string, string> = { id };
  if (payload.nombre !== undefined)        params.nombre = payload.nombre;
  if (payload.telefono !== undefined)      params.telefono = payload.telefono;
  if (payload.acudiente !== undefined)     params.acudiente = payload.acudiente;
  if (payload.cuota_mensual !== undefined) params.cuota_mensual = String(payload.cuota_mensual);
  if (payload.fecha_ingreso !== undefined) params.fecha_ingreso = payload.fecha_ingreso;
  if (payload.activo !== undefined)        params.activo = String(payload.activo);
  return scriptWrite<Jugador>('updateJugador', params);
};

export const addPago = (payload: Omit<Pago, 'id' | 'jugador_nombre'>) =>
  scriptWrite<Pago>('addPago', {
    jugador_id: payload.jugador_id,
    monto: String(payload.monto),
    fecha: payload.fecha,
    mes: String(payload.mes),
    año: String(payload.año),
    notas: payload.notas || '',
  });

export const deletePago = (id: string) =>
  scriptWrite<{ deleted: boolean }>('deletePago', { id });
