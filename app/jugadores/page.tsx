'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador } from '@/types';

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/jugadores')
      .then(r => r.json())
      .then(data => {
        setJugadores(Array.isArray(data) ? data.filter((j: Jugador) => j.activo) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtrados = jugadores
    .filter(j =>
      j.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (j.telefono ?? '').includes(search)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-6 md:pt-8">
        <div className="mb-5">
          <h1 className="font-bebas text-4xl text-white tracking-wider leading-none">JUGADORES</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{jugadores.length} activos</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
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
          <div className="text-center py-16" style={{ color: '#6b7280' }}>Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: '#6b7280' }}>
            {search ? 'Sin resultados.' : 'No hay jugadores activos.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((j, i) => (
              <button
                key={j.id}
                onClick={() => router.push(`/jugadores/${j.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors"
                style={{ background: '#141414', border: '1px solid #1f1f1f' }}
              >
                <span className="text-sm font-bold w-6 text-right flex-shrink-0" style={{ color: '#4b5563' }}>
                  {i + 1}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: '#1d4ed818', color: '#1d4ed8' }}
                >
                  {j.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-white flex-1">{j.nombre}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  className="w-4 h-4 flex-shrink-0" style={{ color: '#4b5563' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
