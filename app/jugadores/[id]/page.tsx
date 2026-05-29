'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Jugador, Pago } from '@/types';
import { formatCOP, formatFecha, formatMes, MESES, calcProximoPago, labelDias, colorDias } from '@/lib/format';

export default function JugadorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Jugador>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [mostrarFormPago, setMostrarFormPago] = useState(false);

  const fetchData = useCallback(async () => {
    const [jRes, pRes] = await Promise.all([
      fetch(`/api/jugadores/${id}`),
      fetch(`/api/pagos?jugadorId=${id}`),
    ]);
    const [j, p] = await Promise.all([jRes.json(), pRes.json()]);
    setJugador(j);
    setEditForm(j);
    setPagos(
      Array.isArray(p)
        ? p.sort((a: Pago, b: Pago) => {
            if (Number(b.año) !== Number(a.año)) return Number(b.año) - Number(a.año);
            return Number(b.mes) - Number(a.mes);
          })
        : [],
    );
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await fetch(`/api/jugadores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, cuota_mensual: Number(editForm.cuota_mensual) }),
      });
      setEditando(false);
      fetchData();
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActivo = async () => {
    if (!jugador) return;
    const msg = jugador.activo
      ? `¿Desactivar a ${jugador.nombre}?`
      : `¿Reactivar a ${jugador.nombre}?`;
    if (!confirm(msg)) return;
    await fetch(`/api/jugadores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !jugador.activo }),
    });
    fetchData();
  };

  const deletePagoHandler = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago?')) return;
    await fetch(`/api/pagos/${pagoId}`, { method: 'DELETE' });
    fetchData();
  };

  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-20" style={{ color: '#6b7280' }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (!jugador || (jugador as { error?: string }).error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-20" style={{ color: '#6b7280' }}>
          <p>Jugador no encontrado.</p>
          <button
            onClick={() => router.push('/jugadores')}
            className="mt-3 text-sm underline"
            style={{ color: '#1d4ed8' }}
          >
            Volver a jugadores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-6 md:pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="p-1 transition-colors"
            style={{ color: '#6b7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bebas text-3xl text-white tracking-wider leading-none truncate">
              {jugador.nombre.toUpperCase()}
            </h1>
            {!jugador.activo && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#1f1f1f', color: '#6b7280' }}
              >
                Inactivo
              </span>
            )}
          </div>
          <button
            onClick={() => { setEditando(e => !e); setEditForm(jugador); }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: editando ? '#1d4ed8' : '#6b7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Info card */}
        <div className="rounded-xl p-4 mb-4" style={{ background: '#141414', border: '1px solid #1f1f1f' }}>
          {editando ? (
            <div className="space-y-3">
              <Field label="Nombre">
                <input
                  type="text"
                  value={editForm.nombre ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  value={editForm.telefono ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, telefono: e.target.value }))}
                />
              </Field>
              <Field label="Acudiente">
                <input
                  type="text"
                  value={editForm.acudiente ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, acudiente: e.target.value }))}
                />
              </Field>
              <Field label="Cuota mensual (COP)">
                <input
                  type="number"
                  value={editForm.cuota_mensual ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, cuota_mensual: Number(e.target.value) }))}
                  min={0}
                />
              </Field>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid #2a2a2a', color: '#9ca3af', background: 'transparent' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: '#1d4ed8' }}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <InfoRow label="Teléfono" value={jugador.telefono || '—'} />
              <InfoRow label="Acudiente" value={jugador.acudiente || '—'} />
              <InfoRow label="Ingresó" value={formatFecha(jugador.fecha_ingreso)} />
              <div className="border-t pt-2.5 space-y-2" style={{ borderColor: '#1f1f1f' }}>
                <InfoRow
                  label="Cuota mensual"
                  value={formatCOP(Number(jugador.cuota_mensual))}
                  valueColor="#f59e0b"
                />
                <InfoRow
                  label="Total pagado (histórico)"
                  value={formatCOP(totalPagado)}
                  valueColor="#ffffff"
                />
                {(() => {
                  const prox = calcProximoPago(jugador, pagos);
                  const value = prox.pendienteParcial
                    ? `Abono parcial — faltan ${formatCOP(prox.pendienteParcial)}`
                    : labelDias(prox.diasHasta);
                  const color = prox.pendienteParcial ? '#f59e0b' : colorDias(prox.diasHasta);
                  return (
                    <InfoRow
                      label="Próximo pago"
                      value={value}
                      valueColor={color}
                    />
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMostrarFormPago(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: '#1d4ed8' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Registrar pago
          </button>
          <button
            onClick={toggleActivo}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'transparent',
              border: jugador.activo ? '1px solid #ef444430' : '1px solid #1d4ed830',
              color: jugador.activo ? '#ef4444' : '#1d4ed8',
            }}
          >
            {jugador.activo ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>

        {/* Payment history */}
        <h2 className="font-bebas text-2xl text-white tracking-wider mb-3">HISTORIAL DE PAGOS</h2>

        {pagos.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: '#6b7280' }}>
            Sin pagos registrados
          </p>
        ) : (
          <div className="space-y-2">
            {pagos.map(pago => (
              <div
                key={pago.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#141414', border: '1px solid #1f1f1f' }}
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {formatMes(Number(pago.mes), Number(pago.año))}
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {formatFecha(pago.fecha)}
                    {pago.notas ? ` · ${pago.notas}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm" style={{ color: '#22c55e' }}>
                    {formatCOP(Number(pago.monto))}
                  </span>
                  <button
                    onClick={() => deletePagoHandler(pago.id)}
                    className="transition-colors"
                    style={{ color: '#374151' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {mostrarFormPago && (
        <FormPago
          jugador={jugador}
          onClose={() => setMostrarFormPago(false)}
          onSuccess={() => { setMostrarFormPago(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueColor = '#d1d5db',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>{label}</label>
      {children}
    </div>
  );
}

function FormPago({
  jugador,
  onClose,
  onSuccess,
}: {
  jugador: Jugador;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date();
  const [form, setForm] = useState({
    monto: String(jugador.cuota_mensual),
    fecha: today.toISOString().split('T')[0],
    mes: today.getMonth() + 1,
    año: today.getFullYear(),
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jugador_id: jugador.id,
          monto: Number(form.monto),
          fecha: form.fecha,
          mes: form.mes,
          año: form.año,
          notas: form.notas,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-5"
        style={{ background: '#141414', border: '1px solid #1f1f1f' }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bebas text-2xl text-white tracking-wider">REGISTRAR PAGO</h3>
          <button onClick={onClose} style={{ color: '#6b7280' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{jugador.nombre}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>Mes</label>
              <select
                value={form.mes}
                onChange={e => setForm(p => ({ ...p, mes: Number(e.target.value) }))}
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>Año</label>
              <input
                type="number"
                value={form.año}
                onChange={e => setForm(p => ({ ...p, año: Number(e.target.value) }))}
                min={2020}
                max={2035}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>Monto (COP)</label>
            <input
              type="number"
              value={form.monto}
              onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
              required
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>Fecha de pago</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>Notas (opcional)</label>
            <input
              type="text"
              value={form.notas}
              onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              placeholder="Pagó en efectivo..."
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white mt-1"
            style={{ background: loading ? '#1e40af80' : '#1d4ed8', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Guardando...' : 'Confirmar pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
