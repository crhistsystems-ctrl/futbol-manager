'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP, formatMes, calcProximoPago, labelDias, colorDias } from '@/lib/format';

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
      const [jugRes, pagRes] = await Promise.all([
        fetch('/api/jugadores'),
        fetch('/api/pagos'),
      ]);
      const [jugData, pagData] = await Promise.all([jugRes.json(), pagRes.json()]);
      setJugadores(Array.isArray(jugData) ? jugData.filter((j: Jugador) => j.activo) : []);
      setTodosPagos(Array.isArray(pagData) ? pagData : []);
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

  const jugadoresPagaron = jugadores.filter(j => pagosMes.some(p => p.jugador_id === j.id));
  const jugadoresDeben = jugadores.filter(j => !pagosMes.some(p => p.jugador_id === j.id));

  const totalRecaudado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
  const totalEsperado = jugadores.reduce((s, j) => s + Number(j.cuota_mensual), 0);

  // Ordenar pendientes: más días de deuda primero
  const pendientesOrdenados = [...jugadoresDeben].sort((a, b) => {
    const da = calcProximoPago(a, todosPagos).diasHasta;
    const db = calcProximoPago(b, todosPagos).diasHasta;
    return da - db;
  });

  // Ordenar al día: próximo vencimiento más cercano primero
  const aldiaOrdenados = [...jugadoresPagaron].sort((a, b) => {
    const da = calcProximoPago(a, todosPagos).diasHasta;
    const db = calcProximoPago(b, todosPagos).diasHasta;
    return da - db;
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-8">
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
          <StatCard label="Pagaron" value={`${jugadoresPagaron.length} jugadores`} color="#22c55e" />
          <StatCard label="Pendientes" value={`${jugadoresDeben.length} jugadores`} color="#ef4444" />
        </div>

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
                    const pago = pagosMes.find(p => p.jugador_id === j.id);
                    return (
                      <PlayerRow
                        key={j.id}
                        jugador={j}
                        status="pago"
                        monto={pago?.monto}
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
  proximoPago: { diasHasta: number; mesesDeuda: number };
  onClick: () => void;
}) {
  const dias = proximoPago.diasHasta;
  const etiqueta = labelDias(dias);
  const color = colorDias(dias);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left"
      style={{ background: '#141414', border: '1px solid #1f1f1f' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            background: status === 'pago' ? '#22c55e15' : '#ef444415',
            color: status === 'pago' ? '#22c55e' : '#ef4444',
          }}
        >
          {jugador.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{jugador.nombre}</p>
          <p className="text-xs" style={{ color }}>{etiqueta}</p>
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
              style={{ background: '#ef444415', color: '#ef4444' }}
            >
              {proximoPago.mesesDeuda > 1 ? `${proximoPago.mesesDeuda} meses` : 'Pendiente'}
            </span>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              {formatCOP(Number(jugador.cuota_mensual))}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
