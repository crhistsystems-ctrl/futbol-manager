import type { Jugador, Pago } from '@/types';

const SCRIPT_URL = process.env.SCRIPT_URL!;
const SCRIPT_SECRET = process.env.SCRIPT_SECRET!;

async function scriptCall<T>(action: string, params: Record<string, string> = {}): Promise<T> {
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
  scriptCall<Jugador[]>('getJugadores');

export const getJugador = (id: string) =>
  scriptCall<Jugador>('getJugador', { id });

export const getDashboard = () =>
  scriptCall<{ jugadores: Jugador[]; pagos: Pago[] }>('getDashboard');

export const getPagos = (jugadorId?: string) =>
  scriptCall<Pago[]>('getPagos', jugadorId ? { jugadorId } : {});

export const addJugador = (payload: Omit<Jugador, 'id' | 'activo'>) =>
  scriptCall<Jugador>('addJugador', {
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
  return scriptCall<Jugador>('updateJugador', params);
};

export const addPago = (payload: Omit<Pago, 'id' | 'jugador_nombre'>) =>
  scriptCall<Pago>('addPago', {
    jugador_id: payload.jugador_id,
    monto: String(payload.monto),
    fecha: payload.fecha,
    mes: String(payload.mes),
    año: String(payload.año),
    notas: payload.notas || '',
  });

export const deletePago = (id: string) =>
  scriptCall<{ deleted: boolean }>('deletePago', { id });
