'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP } from '@/lib/format';

type Filtro = 'activos' | 'todos' | 'inactivos';

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [todosPagos, setTodosPagos] = useState<Pago[]>([]);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('activos');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        setJugadores(Array.isArray(data.jugadores) ? data.jugadores : []);
        setTodosPagos(Array.isArray(data.pagos) ? data.pagos : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const añoActual = hoy.getFullYear();

  function deudaMes(jugador: Jugador): number {
    const cuota = Number(jugador.cuota_mensual);
    const abonado = todosPagos
      .filter(p => p.jugador_id === jugador.id && Number(p.mes) === mesActual && Number(p.año) === añoActual)
      .reduce((s, p) => s + Number(p.monto), 0);
    return Math.max(0, cuota - abonado);
  }

  const filtered = jugadores
    .filter(j => {
      if (filtro === 'activos') return j.activo;
      if (filtro === 'inactivos') return !j.activo;
      return true;
    })
    .filter(j =>
      j.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (j.telefono ?? '').includes(search),
    );

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-bebas text-4xl text-white tracking-wider">JUGADORES</h1>
          <Link
            href="/jugadores/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1d4ed8' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#6b7280', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(['activos', 'todos', 'inactivos'] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
              style={{
                background: filtro === f ? '#1d4ed8' : '#141414',
                color: filtro === f ? '#fff' : '#9ca3af',
                border: filtro === f ? 'none' : '1px solid #1f1f1f',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16" style={{ color: '#6b7280' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#6b7280' }}>
            {search ? 'Sin resultados para esa búsqueda.' : 'No hay jugadores aquí.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(j => {
              const deuda = deudaMes(j);
              const pagado = deuda === 0;
              return (
                <button
                  key={j.id}
                  onClick={() => router.push(`/jugadores/${j.id}`)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left"
                  style={{ background: '#141414', border: '1px solid #1f1f1f' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                    style={{
                      background: j.activo ? '#1d4ed818' : '#6b728018',
                      color: j.activo ? '#1d4ed8' : '#6b7280',
                    }}
                  >
                    {j.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{j.nombre}</p>
                    <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                      {j.telefono || 'Sin teléfono'}{j.acudiente ? ` · ${j.acudiente}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {!j.activo ? (
                      <p className="text-xs" style={{ color: '#6b7280' }}>Inactivo</p>
                    ) : pagado ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#22c55e15', color: '#22c55e' }}
                      >
                        Al día
                      </span>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                        {formatCOP(deuda)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
