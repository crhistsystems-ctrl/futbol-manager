import type { Jugador, Pago } from '@/types';

const SCRIPT_URL = process.env.SCRIPT_URL!;
const SCRIPT_SECRET = process.env.SCRIPT_SECRET!;

async function scriptGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
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

export const getJugadores = () => scriptGet<Jugador[]>('getJugadores');

export const getJugador = (id: string) => scriptGet<Jugador>('getJugador', { id });

export const addJugador = (payload: Omit<Jugador, 'id' | 'activo'>) =>
  scriptGet<Jugador>('addJugador', {
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
  return scriptGet<Jugador>('updateJugador', params);
};

export const getPagos = (jugadorId?: string, mes?: number, año?: number) =>
  scriptGet<Pago[]>('getPagos', {
    ...(jugadorId ? { jugadorId } : {}),
    ...(mes ? { mes: String(mes) } : {}),
    ...(año ? { año: String(año) } : {}),
  });

export const addPago = (payload: Omit<Pago, 'id' | 'jugador_nombre'>) =>
  scriptGet<Pago>('addPago', {
    jugador_id: payload.jugador_id,
    monto: String(payload.monto),
    fecha: payload.fecha,
    mes: String(payload.mes),
    año: String(payload.año),
    notas: payload.notas || '',
  });

export const deletePago = (id: string) =>
  scriptGet<{ deleted: boolean }>('deletePago', { id });
