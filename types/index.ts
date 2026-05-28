export interface Jugador {
  id: string;
  nombre: string;
  telefono: string;
  acudiente: string;
  cuota_mensual: number;
  fecha_ingreso: string;
  activo: boolean;
}

export interface Pago {
  id: string;
  jugador_id: string;
  jugador_nombre: string;
  monto: number;
  fecha: string;
  mes: number;
  año: number;
  notas: string;
}
