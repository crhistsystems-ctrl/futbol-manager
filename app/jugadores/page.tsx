'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP, formatMes, formatFecha, calcProximoPago, labelDias, colorDias } from '@/lib/format';

type Tab = 'jugadores' | 'panel';

export default function MainPage() {
  const [tab, setTab] = useState<Tab>('jugadores');
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [todosPagos, setTodosPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [año, setAño] = useState(today.getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
      setTodosPagos(Array.isArray(data.pagos) ? data.pagos : []);
    } catch {
      setJugadores([]);
      setTodosPagos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activos = jugadores.filter(j => j.activo);

  // Panel calculations
  const pagosMes = todosPagos.filter(p => Number(p.mes) === mes && Number(p.año) === año);
  const totalRecaudado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
  const totalEsperado = activos.reduce((s, j) => s + Number(j.cuota_mensual), 0);

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const añoActual = hoy.getFullYear();

  const totalMesPorJugador = (jId: string) =>
    pagosMes.filter(p => p.jugador_id === jId).reduce((s, p) => s + Number(p.monto), 0);

  const pagaron = activos.filter(j => totalMesPorJugador(j.id) >= Number(j.cuota_mensual));
  const deben = activos.filter(j => totalMesPorJugador(j.id) < Number(j.cuota_mensual));

  const pendientesOrdenados = [...deben].sort((a, b) =>
    calcProximoPago(a, todosPagos).diasHasta - calcProximoPago(b, todosPagos).diasHasta
  );

  // Jugadores list
  const jugadoresFiltrados = activos
    .filter(j =>
      j.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (j.telefono ?? '').includes(search)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  function deudaMes(j: Jugador) {
    const cuota = Number(j.cuota_mensual);
    const abonado = todosPagos
      .filter(p => p.jugador_id === j.id && Number(p.mes) === mesActual && Number(p.año) === añoActual)
      .reduce((s, p) => s + Number(p.monto), 0);
    return Math.max(0, cuota - abonado);
  }

  const prevMes = () => { if (mes === 1) { setMes(12); setAño(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 12) { setMes(1); setAño(a => a + 1); } else setMes(m => m + 1); };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b" style={{ borderColor: '#1f1f1f' }}>
        {(['jugadores', 'panel'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
            style={{
              color: tab === t ? '#1d4ed8' : '#6b7280',
              borderBottom: tab === t ? '2px solid #1d4ed8' : '2px solid transparent',
            }}
          >
            {t === 'jugadores' ? 'Jugadores' : 'Panel'}
          </button>
        ))}
      </div>

      {/* Desktop: two columns / Mobile: single tab */}
      <div className="md:flex md:h-[calc(100vh-73px)]">

        {/* LEFT — Jugadores */}
        <div
          className={`md:w-2/5 md:border-r md:overflow-y-auto ${tab === 'jugadores' ? 'block' : 'hidden'} md:block`}
          style={{ borderColor: '#1f1f1f' }}
        >
          <div className="px-4 pt-5 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bebas text-3xl text-white tracking-wider leading-none">JUGADORES</h1>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{activos.length} activos</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b7280', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-12" style={{ color: '#6b7280' }}>Cargando...</div>
            ) : jugadoresFiltrados.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: '#6b7280' }}>
                {search ? 'Sin resultados.' : 'No hay jugadores activos.'}
              </div>
            ) : (
              <div className="space-y-2">
                {jugadoresFiltrados.map((j, i) => {
                  const deuda = deudaMes(j);
                  const alDia = deuda === 0;
                  return (
                    <button
                      key={j.id}
                      onClick={() => router.push(`/jugadores/${j.id}`)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                      style={{ background: '#141414', border: '1px solid #1f1f1f' }}
                    >
                      {/* Number */}
                      <span className="text-xs font-bold w-5 text-right mt-0.5 flex-shrink-0" style={{ color: '#4b5563' }}>
                        {i + 1}
                      </span>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm leading-snug">{j.nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                          {j.telefono || '—'}
                          {j.acudiente ? ` · ${j.acudiente}` : ''}
                        </p>
                        <p className="text-xs" style={{ color: '#4b5563' }}>
                          Ingresó {formatFecha(j.fecha_ingreso)}
                        </p>
                      </div>
                      {/* Status */}
                      <div className="flex-shrink-0 text-right">
                        {alDia ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#22c55e15', color: '#22c55e' }}>
                            Al día
                          </span>
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                            {formatCOP(deuda)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Panel */}
        <div
          className={`md:flex-1 md:overflow-y-auto ${tab === 'panel' ? 'block' : 'hidden'} md:block`}
        >
          <div className="px-4 pt-5 pb-24 md:pb-8">

            {/* Header con botón agregar */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bebas text-3xl text-white tracking-wider">PANEL</h2>
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

            {/* Navegador de mes */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMes} className="p-2 rounded-lg" style={{ color: '#6b7280' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="font-bebas text-2xl tracking-wider text-white">{formatMes(mes, año).toUpperCase()}</span>
              <button onClick={nextMes} className="p-2 rounded-lg" style={{ color: '#6b7280' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard label="Recaudado" value={formatCOP(totalRecaudado)} color="#22c55e" />
              <StatCard label="Esperado" value={formatCOP(totalEsperado)} color="#d1d5db" />
              <StatCard label="Al día" value={`${pagaron.length} jugadores`} color="#22c55e" />
              <StatCard label="Pendientes" value={`${deben.length} jugadores`} color="#ef4444" />
            </div>

            {loading ? (
              <div className="text-center py-8" style={{ color: '#6b7280' }}>Cargando...</div>
            ) : (
              <>
                {/* Pendientes */}
                {pendientesOrdenados.length > 0 && (
                  <section className="mb-5">
                    <SectionHeader color="#ef4444" label={`Pendientes (${pendientesOrdenados.length})`} />
                    <div className="space-y-2">
                      {pendientesOrdenados.map(j => {
                        const prox = calcProximoPago(j, todosPagos);
                        const isParcial = (prox.pendienteParcial ?? 0) > 0;
                        const color = isParcial ? '#f59e0b' : '#ef4444';
                        return (
                          <button
                            key={j.id}
                            onClick={() => router.push(`/jugadores/${j.id}`)}
                            className="w-full flex items-center justify-between p-3 rounded-xl text-left"
                            style={{ background: '#141414', border: '1px solid #1f1f1f' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: `${color}15`, color }}>
                                {j.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">{j.nombre}</p>
                                <p className="text-xs" style={{ color }}>{labelDias(prox)}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium" style={{ color }}>
                              {isParcial ? formatCOP(prox.pendienteParcial!) : formatCOP(Number(j.cuota_mensual))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Al día */}
                {pagaron.length > 0 && (
                  <section>
                    <SectionHeader color="#22c55e" label={`Al día (${pagaron.length})`} />
                    <div className="space-y-2">
                      {pagaron.map(j => {
                        const prox = calcProximoPago(j, todosPagos);
                        return (
                          <button
                            key={j.id}
                            onClick={() => router.push(`/jugadores/${j.id}`)}
                            className="w-full flex items-center justify-between p-3 rounded-xl text-left"
                            style={{ background: '#141414', border: '1px solid #1f1f1f' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: '#22c55e15', color: '#22c55e' }}>
                                {j.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">{j.nombre}</p>
                                <p className="text-xs" style={{ color: colorDias(prox.diasHasta) }}>{labelDias(prox)}</p>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#22c55e15', color: '#22c55e' }}>
                              Pagó
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {activos.length === 0 && (
                  <div className="text-center py-12" style={{ color: '#6b7280' }}>
                    <p>No hay jugadores activos.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
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
