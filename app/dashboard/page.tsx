'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP, formatMes } from '@/lib/format';

export default function DashboardPage() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [año, setAño] = useState(today.getFullYear());
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jugRes, pagRes] = await Promise.all([
        fetch('/api/jugadores'),
        fetch(`/api/pagos?mes=${mes}&año=${año}`),
      ]);
      const [jugData, pagData] = await Promise.all([jugRes.json(), pagRes.json()]);
      setJugadores(Array.isArray(jugData) ? jugData.filter((j: Jugador) => j.activo) : []);
      setPagos(Array.isArray(pagData) ? pagData : []);
    } catch {
      setJugadores([]);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [mes, año]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAño(a => a - 1); }
    else setMes(m => m - 1);
  };

  const nextMes = () => {
    if (mes === 12) { setMes(1); setAño(a => a + 1); }
    else setMes(m => m + 1);
  };

  const jugadoresPagaron = jugadores.filter(j =>
    pagos.some(p => p.jugador_id === j.id),
  );
  const jugadoresDeben = jugadores.filter(j =>
    !pagos.some(p => p.jugador_id === j.id),
  );
  const totalRecaudado = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const totalEsperado = jugadores.reduce((s, j) => s + Number(j.cuota_mensual), 0);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-8">
        {/* Month navigator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMes}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#6b7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-bebas text-3xl tracking-wider text-white">
            {formatMes(mes, año).toUpperCase()}
          </h2>
          <button
            onClick={nextMes}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#6b7280' }}
          >
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
            {jugadoresDeben.length > 0 && (
              <section className="mb-6">
                <SectionHeader color="#ef4444" label={`Pendientes (${jugadoresDeben.length})`} />
                <div className="space-y-2">
                  {jugadoresDeben.map(j => (
                    <PlayerRow
                      key={j.id}
                      jugador={j}
                      status="debe"
                      onClick={() => router.push(`/jugadores/${j.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {jugadoresPagaron.length > 0 && (
              <section className="mb-6">
                <SectionHeader color="#22c55e" label={`Al día (${jugadoresPagaron.length})`} />
                <div className="space-y-2">
                  {jugadoresPagaron.map(j => {
                    const pago = pagos.find(p => p.jugador_id === j.id);
                    return (
                      <PlayerRow
                        key={j.id}
                        jugador={j}
                        status="pago"
                        monto={pago?.monto}
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
    <div
      className="rounded-xl p-4"
      style={{ background: '#141414', border: '1px solid #1f1f1f' }}
    >
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>{label}</p>
      <p className="font-bebas text-2xl" style={{ color }}>{value}</p>
    </div>
  );
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color }}>
        {label}
      </h3>
    </div>
  );
}

function PlayerRow({
  jugador,
  status,
  monto,
  onClick,
}: {
  jugador: Jugador;
  status: 'pago' | 'debe';
  monto?: number;
  onClick: () => void;
}) {
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
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Cuota: {formatCOP(Number(jugador.cuota_mensual))}
          </p>
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
              <p className="text-xs mt-0.5" style={{ color: '#22c55e' }}>
                {formatCOP(Number(monto))}
              </p>
            )}
          </>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: '#ef444415', color: '#ef4444' }}
          >
            Pendiente
          </span>
        )}
      </div>
    </button>
  );
}
