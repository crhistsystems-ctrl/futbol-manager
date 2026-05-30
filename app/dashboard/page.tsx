'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP, formatMes, calcProximoPago, labelDias, colorDias, type ProximoPago } from '@/lib/format';

export default function DashboardPage() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [año, setAño] = useState(today.getFullYear());
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [todosPagos, setTodosPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores.filter((j: Jugador) => j.activo) : []);
      setTodosPagos(Array.isArray(data.pagos) ? data.pagos : []);
    } catch {
      setJugadores([]);
      setTodosPagos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAño(a => a - 1); }
    else setMes(m => m - 1);
  };

  const nextMes = () => {
    if (mes === 12) { setMes(1); setAño(a => a + 1); }
    else setMes(m => m + 1);
  };

  // Pagos del mes seleccionado
  const pagosMes = todosPagos.filter(p => Number(p.mes) === mes && Number(p.año) === año);

  const totalMesPorJugador = (jugadorId: string) =>
    pagosMes.filter(p => p.jugador_id === jugadorId).reduce((s, p) => s + Number(p.monto), 0);

  const jugadoresPagaron = jugadores.filter(j => totalMesPorJugador(j.id) >= Number(j.cuota_mensual));
  const jugadoresDeben = jugadores.filter(j => totalMesPorJugador(j.id) < Number(j.cuota_mensual));

  const totalRecaudado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
  const totalEsperado = jugadores.reduce((s, j) => s + Number(j.cuota_mensual), 0);

  // Ordenar pendientes: más días de deuda primero
  const pendientesOrdenados = [...jugadoresDeben].sort((a, b) => {
    const da = calcProximoPago(a, todosPagos).diasHasta;
    const db = calcProximoPago(b, todosPagos).diasHasta;
    return da - db;
  });

  const exportarExcel = async () => {
    const XLSX = await import('xlsx');

    // Hoja 1 — Jugadores
    const jugadoresData = jugadores.map(j => ({
      Nombre: j.nombre,
      Teléfono: j.telefono || '',
      Acudiente: j.acudiente || '',
      'Tel. Acudiente': (j as any).telefono_acudiente || '',
      'Cuota Mensual': Number(j.cuota_mensual),
      'Fecha Ingreso': j.fecha_ingreso,
      Estado: j.activo ? 'Activo' : 'Inactivo',
    }));

    // Hoja 2 — Abonos/Pagos
    const pagosData = todosPagos.map(p => {
      const j = jugadores.find(jj => jj.id === p.jugador_id);
      return {
        Jugador: p.jugador_nombre || j?.nombre || '',
        'Teléfono Jugador': j?.telefono || '',
        Mes: Number(p.mes),
        Año: Number(p.año),
        'Monto Abonado': Number(p.monto),
        'Fecha Pago': p.fecha,
        Notas: p.notas || '',
      };
    }).sort((a, b) => a.Año !== b.Año ? b.Año - a.Año : b.Mes - a.Mes);

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(jugadoresData);
    const ws2 = XLSX.utils.json_to_sheet(pagosData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Jugadores');
    XLSX.utils.book_append_sheet(wb, ws2, 'Abonos');

    XLSX.writeFile(wb, `pumas-fc-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Ordenar al día: próximo vencimiento más cercano primero
  const aldiaOrdenados = [...jugadoresPagaron].sort((a, b) => {
    const da = calcProximoPago(a, todosPagos).diasHasta;
    const db = calcProximoPago(b, todosPagos).diasHasta;
    return da - db;
  });

  // Datos para el gráfico: últimos 6 meses
  const MESES_CORTOS = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const esperadoTotal = jugadores.reduce((s, j) => s + Number(j.cuota_mensual), 0);
  const datosGrafico = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const recaudado = todosPagos
      .filter(p => Number(p.mes) === m && Number(p.año) === y)
      .reduce((s, p) => s + Number(p.monto), 0);
    return { label: MESES_CORTOS[m], recaudado, esperado: esperadoTotal };
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-8">
        {/* Header con botones */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bebas text-4xl text-white tracking-wider leading-none">PANEL</h1>
          <div className="flex gap-2">
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#141414', border: '1px solid #1f1f1f', color: '#9ca3af' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Excel
            </button>
            <button
              onClick={() => router.push('/jugadores/nuevo')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#1d4ed8' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar jugador
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMes} className="p-2 rounded-lg transition-colors" style={{ color: '#6b7280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-bebas text-3xl tracking-wider text-white">
            {formatMes(mes, año).toUpperCase()}
          </h2>
          <button onClick={nextMes} className="p-2 rounded-lg transition-colors" style={{ color: '#6b7280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Recaudado" value={formatCOP(totalRecaudado)} color="#22c55e" />
          <StatCard label="Esperado" value={formatCOP(totalEsperado)} color="#d1d5db" />
          <StatCard label="Al día" value={`${jugadoresPagaron.length} jugadores`} color="#22c55e" />
          <StatCard label="Pendientes" value={`${jugadoresDeben.length} jugadores`} color="#ef4444" />
        </div>

        {/* Gráfico de barras — últimos 6 meses */}
        {!loading && jugadores.length > 0 && (
          <div className="rounded-xl p-4 mb-6" style={{ background: '#141414', border: '1px solid #1f1f1f' }}>
            <p className="text-xs uppercase tracking-wide mb-4" style={{ color: '#6b7280' }}>
              Recaudado vs Esperado — últimos 6 meses
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={datosGrafico} barCategoryGap="30%" barGap={3}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(val: number, name: string) => [
                    formatCOP(val),
                    name === 'recaudado' ? 'Recaudado' : 'Esperado',
                  ]}
                />
                <Bar dataKey="esperado" radius={[4, 4, 0, 0]} fill="#ffffff10" />
                <Bar dataKey="recaudado" radius={[4, 4, 0, 0]}>
                  {datosGrafico.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.recaudado >= entry.esperado ? '#22c55e' : entry.recaudado > 0 ? '#f59e0b' : '#374151'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ffffff10' }} /> Esperado
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> Completo
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#f59e0b' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#f59e0b' }} /> Parcial
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16" style={{ color: '#6b7280' }}>Cargando...</div>
        ) : (
          <>
            {pendientesOrdenados.length > 0 && (
              <section className="mb-6">
                <SectionHeader color="#ef4444" label={`Pendientes (${pendientesOrdenados.length})`} />
                <div className="space-y-2">
                  {pendientesOrdenados.map(j => (
                    <PlayerRow
                      key={j.id}
                      jugador={j}
                      status="debe"
                      proximoPago={calcProximoPago(j, todosPagos)}
                      onClick={() => router.push(`/jugadores/${j.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {aldiaOrdenados.length > 0 && (
              <section className="mb-6">
                <SectionHeader color="#22c55e" label={`Al día (${aldiaOrdenados.length})`} />
                <div className="space-y-2">
                  {aldiaOrdenados.map(j => {
                    const totalMes = totalMesPorJugador(j.id);
                    return (
                      <PlayerRow
                        key={j.id}
                        jugador={j}
                        status="pago"
                        monto={totalMes}
                        proximoPago={calcProximoPago(j, todosPagos)}
                        onClick={() => router.push(`/jugadores/${j.id}`)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {jugadores.length === 0 && (
              <div className="text-center py-16" style={{ color: '#6b7280' }}>
                <p>No hay jugadores activos.</p>
                <button
                  onClick={() => router.push('/jugadores/nuevo')}
                  className="mt-3 text-sm underline"
                  style={{ color: '#1d4ed8' }}
                >
                  Agregar el primero
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #1f1f1f' }}>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>{label}</p>
      <p className="font-bebas text-2xl" style={{ color }}>{value}</p>
    </div>
  );
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color }}>{label}</h3>
    </div>
  );
}

function PlayerRow({
  jugador, status, monto, proximoPago, onClick,
}: {
  jugador: Jugador;
  status: 'pago' | 'debe';
  monto?: number;
  proximoPago: ProximoPago;
  onClick: () => void;
}) {
  const dias = proximoPago.diasHasta;
  const isParcial = status === 'debe' && (proximoPago.pendienteParcial ?? 0) > 0;
  const accentColor = isParcial ? '#f59e0b' : status === 'pago' ? '#22c55e' : '#ef4444';
  const etiqueta = labelDias(proximoPago);
  const subtextColor = isParcial ? '#f59e0b' : colorDias(dias);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left"
      style={{ background: '#141414', border: '1px solid #1f1f1f' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          {jugador.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{jugador.nombre}</p>
          <p className="text-xs" style={{ color: subtextColor }}>{etiqueta}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {status === 'pago' ? (
          <>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: '#22c55e15', color: '#22c55e' }}
            >
              Pagó
            </span>
            {monto !== undefined && (
              <p className="text-xs mt-0.5" style={{ color: '#22c55e' }}>{formatCOP(Number(monto))}</p>
            )}
          </>
        ) : (
          <div className="text-right">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              {proximoPago.mesesDeuda > 1 ? `${proximoPago.mesesDeuda} meses` : isParcial ? 'Parcial' : 'Pendiente'}
            </span>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              {isParcial
                ? formatCOP(proximoPago.pendienteParcial!)
                : formatCOP(Number(jugador.cuota_mensual))}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
