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
