'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function NuevoJugadorPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    acudiente: '',
    cuota_mensual: '',
    fecha_ingreso: today,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jugadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cuota_mensual: Number(form.cuota_mensual),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      router.push('/jugadores');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el jugador.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-6 md:pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-1 transition-colors"
            style={{ color: '#6b7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="font-bebas text-3xl text-white tracking-wider">NUEVO JUGADOR</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#9ca3af' }}>
              Nombre completo *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Juan García"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#9ca3af' }}>
              Teléfono
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={set('telefono')}
              placeholder="300 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#9ca3af' }}>
              Nombre del acudiente
            </label>
            <input
              type="text"
              value={form.acudiente}
              onChange={set('acudiente')}
              placeholder="María García (mamá)"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#9ca3af' }}>
              Cuota mensual (COP) *
            </label>
            <input
              type="number"
              value={form.cuota_mensual}
              onChange={set('cuota_mensual')}
              placeholder="80000"
              required
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#9ca3af' }}>
              Fecha de ingreso *
            </label>
            <input
              type="date"
              value={form.fecha_ingreso}
              onChange={set('fecha_ingreso')}
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl font-medium transition-colors"
              style={{ border: '1px solid #2a2a2a', color: '#9ca3af', background: 'transparent' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: loading ? '#16a34a80' : '#22c55e', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
