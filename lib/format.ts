import type { Jugador, Pago } from '@/types';

export const formatCOP = (amount: number) =>
  `$${Number(amount).toLocaleString('es-CO')}`;

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const formatMes = (mes: number, año: number) =>
  `${MESES[mes - 1]} ${año}`;

export const formatFecha = (fecha: string) => {
  if (!fecha) return '—';
  const parts = fecha.split('-');
  if (parts.length !== 3) return fecha;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

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

  const pagosJugador = todosPagos.filter(p => p.jugador_id === jugador.id);

  if (pagosJugador.length === 0) {
    const inicio = jugador.fecha_ingreso ? new Date(jugador.fecha_ingreso + 'T00:00:00') : hoy;
    const nextDue = new Date(inicio);
    nextDue.setMonth(nextDue.getMonth() + 1);
    const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    const mesesDeuda = diasHasta < 0 ? Math.ceil(Math.abs(diasHasta) / 30) : 0;
    return { diasHasta, fecha: nextDue, mesesDeuda };
  }

  // Agrupar pagos por mes/año y sumar montos
  const porMes = new Map<string, number>();
  for (const p of pagosJugador) {
    const key = `${p.año}-${String(p.mes).padStart(2, '0')}`;
    porMes.set(key, (porMes.get(key) ?? 0) + Number(p.monto));
  }

  // Último mes con algún pago
  const ultimoKey = [...porMes.keys()].sort().at(-1)!;
  const totalUltimo = porMes.get(ultimoKey)!;
  const pendienteParcial = totalUltimo < cuota ? cuota - totalUltimo : undefined;

  // Último mes completamente pagado (total >= cuota)
  const ultimoCompleto = [...porMes.entries()]
    .filter(([, total]) => total >= cuota)
    .map(([key]) => key)
    .sort()
    .at(-1);

  if (!ultimoCompleto) {
    // Ningún mes pagado completo — sigue debiendo el mes del primer abono
    const [año, mes] = ultimoKey.split('-').map(Number);
    const nextDue = new Date(año, mes - 1, 1);
    const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return { diasHasta, fecha: nextDue, mesesDeuda: 0, pendienteParcial };
  }

  const [lastYear, lastMes] = ultimoCompleto.split('-').map(Number);
  // new Date(año, mes, 1): lastMes es 1-indexed → apunta al mes siguiente en JS ✓
  const nextDue = new Date(lastYear, lastMes, 1);
  const diasHasta = Math.floor((nextDue.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  const mesHoy = hoy.getFullYear() * 12 + hoy.getMonth();
  const mesUltimo = lastYear * 12 + (lastMes - 1);
  const mesesDeuda = Math.max(0, mesHoy - mesUltimo - 1);

  return { diasHasta, fecha: nextDue, mesesDeuda, pendienteParcial };
}

export function labelDias(dias: number): string {
  if (dias <= -60) return `Debe ~${Math.round(Math.abs(dias) / 30)} meses`;
  if (dias < -1)  return `Vencido hace ${Math.abs(dias)} días`;
  if (dias === -1) return 'Venció ayer';
  if (dias === 0)  return 'Vence hoy';
  if (dias === 1)  return 'Vence mañana';
  if (dias <= 7)   return `Vence en ${dias} días`;
  if (dias <= 30)  return `Próximo pago en ${dias} días`;
  return `Próximo pago en ${dias} días`;
}

export function colorDias(dias: number): string {
  if (dias < 0)   return '#ef4444';
  if (dias <= 5)  return '#f59e0b';
  if (dias <= 15) return '#facc15';
  return '#22c55e';
}
