import type { Jugador, Pago } from '@/types';

export const formatCOP = (amount: number) =>
  `$${Number(amount).toLocaleString('es-CO')}`;

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatMes = (mes: number, año: number) =>
  `${MESES[mes - 1]} ${año}`;

export const formatFecha = (fecha: string) => {
  if (!fecha) return '—';
  const parts = fecha.split('-');
  if (parts.length !== 3) return fecha;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

function fechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
}

// Construye la fecha de pago para un mes/año dado, usando el día de ingreso.
// Si el mes no tiene ese día (ej. ingreso día 31 en Junio), usa el último día del mes.
function fechaPagoDelMes(diaIngreso: number, mes: number, año: number): Date {
  const ultimoDia = new Date(año, mes, 0).getDate(); // day 0 del mes+1 = último del mes
  const dia = Math.min(diaIngreso, ultimoDia);
  return new Date(año, mes - 1, dia);
}

export interface ProximoPago {
  diasHasta: number;
  fecha: Date;
  mesesDeuda: number;
  pendienteParcial?: number;
}

export function calcProximoPago(jugador: Jugador, todosPagos: Pago[]): ProximoPago {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cuota = Number(jugador.cuota_mensual);

  const ingreso = jugador.fecha_ingreso
    ? new Date(jugador.fecha_ingreso + 'T00:00:00')
    : hoy;
  const diaIngreso = ingreso.getDate();

  const pagosJugador = todosPagos.filter(p => p.jugador_id === jugador.id);

  if (pagosJugador.length === 0) {
    // Primer pago vence el mismo día del mes siguiente al ingreso
    let nextMes = ingreso.getMonth() + 2; // 1-indexed mes siguiente
    let nextYear = ingreso.getFullYear();
    if (nextMes > 12) { nextMes = 1; nextYear++; }
    const nextDue = fechaPagoDelMes(diaIngreso, nextMes, nextYear);
    const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return { diasHasta, fecha: nextDue, mesesDeuda: diasHasta < 0 ? 1 : 0 };
  }

  // Agrupar pagos por mes/año
  const porMes = new Map<string, number>();
  for (const p of pagosJugador) {
    const key = `${p.año}-${String(p.mes).padStart(2, '0')}`;
    porMes.set(key, (porMes.get(key) ?? 0) + Number(p.monto));
  }

  // Último mes con algún pago
  const ultimoKey = [...porMes.keys()].sort().at(-1)!;
  const totalUltimo = porMes.get(ultimoKey)!;
  const pendienteParcial = totalUltimo < cuota ? cuota - totalUltimo : undefined;

  // Último mes completamente pagado
  const ultimoCompleto = [...porMes.entries()]
    .filter(([, total]) => total >= cuota)
    .map(([key]) => key)
    .sort()
    .at(-1);

  if (!ultimoCompleto) {
    // Ningún mes pagado completo — vence el diaIngreso del mes con abono parcial
    const [año, mes] = ultimoKey.split('-').map(Number);
    const nextDue = fechaPagoDelMes(diaIngreso, mes, año);
    const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return { diasHasta, fecha: nextDue, mesesDeuda: 0, pendienteParcial };
  }

  // Siguiente fecha de pago: diaIngreso del mes siguiente al último completo
  const [lastYear, lastMes] = ultimoCompleto.split('-').map(Number);
  let nextMes = lastMes + 1;
  let nextYear = lastYear;
  if (nextMes > 12) { nextMes = 1; nextYear++; }
  const nextDue = fechaPagoDelMes(diaIngreso, nextMes, nextYear);
  const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  const mesHoy = hoy.getFullYear() * 12 + hoy.getMonth();
  const mesUltimo = lastYear * 12 + (lastMes - 1);
  const mesesDeuda = Math.max(0, mesHoy - mesUltimo - 1);

  return { diasHasta, fecha: nextDue, mesesDeuda, pendienteParcial };
}

export function labelDias(prox: ProximoPago): string {
  const { diasHasta, fecha, mesesDeuda, pendienteParcial } = prox;

  if (pendienteParcial !== undefined && pendienteParcial > 0) {
    return `Abono parcial — faltan ${formatCOP(pendienteParcial)}`;
  }
  if (mesesDeuda >= 2) return `Debe ~${mesesDeuda} meses`;
  if (diasHasta < 0)  return `Venció el ${fechaCorta(fecha)}`;
  if (diasHasta === 0) return 'Vence hoy';
  return fechaCorta(fecha); // "20 Jun 2026"
}

export function colorDias(dias: number): string {
  if (dias < 0)   return '#ef4444';
  if (dias <= 5)  return '#f59e0b';
  if (dias <= 15) return '#facc15';
  return '#22c55e';
}
