'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Usuario o contraseña incorrectos');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="font-bebas text-5xl tracking-widest" style={{ color: '#22c55e' }}>
            MIGUEL FC
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Gestión de jugadores
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: '#9ca3af' }}>
              Usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="miguel"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: '#9ca3af' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all mt-2"
            style={{
              background: loading ? '#16a34a90' : '#22c55e',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
