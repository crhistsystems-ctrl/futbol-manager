'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const LINKS = [
  { href: '/dashboard', label: 'Panel', icon: <IconGrid /> },
  { href: '/jugadores', label: 'Jugadores', icon: <IconUsers /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Pumas F.C." className="w-14 h-14 object-contain" />
          <span className="font-bebas text-2xl tracking-widest" style={{ color: '#f59e0b' }}>PUMAS F.C.</span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: pathname.startsWith(link.href) ? '#1d4ed815' : 'transparent',
                color: pathname.startsWith(link.href) ? '#1d4ed8' : '#9ca3af',
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm transition-colors"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
        >
          Salir
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{ background: '#0f0f0f', borderTop: '1px solid #1f1f1f' }}>
        <div className="flex">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
              style={{ color: pathname.startsWith(link.href) ? '#1d4ed8' : '#6b7280' }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium"
            style={{ color: '#6b7280' }}
          >
            <IconLogout />
            Salir
          </button>
        </div>
      </nav>
    </>
  );
}
