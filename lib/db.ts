import { createClient, type Client } from '@libsql/client/web';
import type { Jugador, Pago } from '@/types';

let dbClient: Client | null = null;

function getDb(): Client {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
      throw new Error('TURSO_DATABASE_URL y TURSO_AUTH_TOKEN son requeridos');
    }

    dbClient = createClient({ url, authToken: token });
  }
  return dbClient;
}

// ---- JUGADORES ----

export async function getJugadores(): Promise<Jugador[]> {
  try {
    const db = getDb();
    const { rows } = await db.execute('SELECT * FROM jugadores ORDER BY nombre ASC');
    return rows.map(toJugador);
  } catch (err) {
    console.error('Error getJugadores:', err);
    throw err;
  }
}

export async function getJugador(id: string): Promise<Jugador | null> {
  try {
    const db = getDb();
    const { rows } = await db.execute({ sql: 'SELECT * FROM jugadores WHERE id = ?', args: [id] });
    return rows[0] ? toJugador(rows[0]) : null;
  } catch (err) {
    console.error('Error getJugador:', err);
    throw err;
  }
}

export async function getDashboard(): Promise<{ jugadores: Jugador[]; pagos: Pago[] }> {
  try {
    const db = getDb();
    const [jRes, pRes] = await Promise.all([
      db.execute('SELECT * FROM jugadores ORDER BY nombre ASC'),
      db.execute('SELECT * FROM pagos ORDER BY año DESC, mes DESC'),
    ]);
    return {
      jugadores: jRes.rows.map(toJugador),
      pagos: pRes.rows.map(toPago),
    };
  } catch (err) {
    console.error('Error getDashboard:', err);
    throw err;
  }
}

export async function addJugador(payload: Omit<Jugador, 'id' | 'activo'>): Promise<Jugador> {
  try {
    const db = getDb();

    const { rows: existing } = await db.execute({
      sql: 'SELECT id FROM jugadores WHERE lower(nombre) = lower(?) AND telefono = ? AND activo = 1',
      args: [payload.nombre, payload.telefono],
    });
    if (existing.length > 0) {
      throw new Error('ya existe un jugador activo con ese nombre y teléfono');
    }

    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO jugadores (id, nombre, telefono, acudiente, telefono_acudiente, cuota_mensual, fecha_ingreso, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [id, payload.nombre, payload.telefono, payload.acudiente, payload.telefono_acudiente ?? null, payload.cuota_mensual, payload.fecha_ingreso],
    });
    return { id, ...payload, activo: true };
  } catch (err) {
    console.error('Error addJugador:', err);
    throw err;
  }
}

export async function updateJugador(id: string, payload: Partial<Jugador>): Promise<{ updated: boolean }> {
  try {
    const db = getDb();
    const fields: string[] = [];
    const args: (string | number | null)[] = [];

    if (payload.nombre !== undefined)        { fields.push('nombre = ?');        args.push(payload.nombre); }
    if (payload.telefono !== undefined)      { fields.push('telefono = ?');      args.push(payload.telefono); }
    if (payload.acudiente !== undefined)     { fields.push('acudiente = ?');     args.push(payload.acudiente); }
    if (payload.cuota_mensual !== undefined) { fields.push('cuota_mensual = ?'); args.push(payload.cuota_mensual); }
    if (payload.fecha_ingreso !== undefined) { fields.push('fecha_ingreso = ?'); args.push(payload.fecha_ingreso); }
    if (payload.telefono_acudiente !== undefined) { fields.push('telefono_acudiente = ?'); args.push(payload.telefono_acudiente ?? null); }
    if (payload.activo !== undefined)             { fields.push('activo = ?');             args.push(payload.activo ? 1 : 0); }

    if (fields.length === 0) return { updated: false };

    args.push(id);
    await db.execute({ sql: `UPDATE jugadores SET ${fields.join(', ')} WHERE id = ?`, args });
    return { updated: true };
  } catch (err) {
    console.error('Error updateJugador:', err);
    throw err;
  }
}

// ---- PAGOS ----

export async function getPagos(jugadorId?: string): Promise<Pago[]> {
  try {
    const db = getDb();
    const sql = jugadorId
      ? 'SELECT * FROM pagos WHERE jugador_id = ? ORDER BY año DESC, mes DESC'
      : 'SELECT * FROM pagos ORDER BY año DESC, mes DESC';
    const { rows } = await db.execute({ sql, args: jugadorId ? [jugadorId] : [] });
    return rows.map(toPago);
  } catch (err) {
    console.error('Error getPagos:', err);
    throw err;
  }
}

export async function addPago(payload: Omit<Pago, 'id' | 'jugador_nombre'>): Promise<Pago> {
  try {
    const db = getDb();
    const { rows } = await db.execute({ sql: 'SELECT nombre FROM jugadores WHERE id = ?', args: [payload.jugador_id] });
    const jugadorNombre = rows[0] ? String(rows[0].nombre ?? '') : '';

    const id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO pagos (id, jugador_id, jugador_nombre, monto, fecha, mes, año, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, payload.jugador_id, jugadorNombre, payload.monto, payload.fecha, payload.mes, payload.año, payload.notas ?? ''],
    });
    return { id, ...payload, jugador_nombre: jugadorNombre };
  } catch (err) {
    console.error('Error addPago:', err);
    throw err;
  }
}

export async function deletePago(id: string): Promise<{ deleted: boolean }> {
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM pagos WHERE id = ?', args: [id] });
    return { deleted: true };
  } catch (err) {
    console.error('Error deletePago:', err);
    throw err;
  }
}

// ---- Mappers ----

function toJugador(row: Record<string, unknown>): Jugador {
  return {
    id: String(row.id ?? ''),
    nombre: String(row.nombre ?? ''),
    telefono: String(row.telefono ?? ''),
    acudiente: String(row.acudiente ?? ''),
    telefono_acudiente: row.telefono_acudiente ? String(row.telefono_acudiente) : undefined,
    cuota_mensual: Number(row.cuota_mensual ?? 0),
    fecha_ingreso: String(row.fecha_ingreso ?? ''),
    activo: row.activo === 1 || row.activo === true,
  };
}

function toPago(row: Record<string, unknown>): Pago {
  return {
    id: String(row.id ?? ''),
    jugador_id: String(row.jugador_id ?? ''),
    jugador_nombre: String(row.jugador_nombre ?? ''),
    monto: Number(row.monto ?? 0),
    fecha: String(row.fecha ?? ''),
    mes: Number(row.mes ?? 0),
    año: Number(row.año ?? 0),
    notas: String(row.notas ?? ''),
  };
}
