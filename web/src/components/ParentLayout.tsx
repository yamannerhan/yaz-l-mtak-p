'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
  { href: '/dashboard/calls', label: 'Aramalar', icon: '📞' },
  { href: '/dashboard/sms', label: 'SMS', icon: '💬' },
  { href: '/dashboard/notifications', label: 'Bildirimler', icon: '🔔' },
  { href: '/dashboard/web', label: 'İnternet', icon: '🌐' },
  { href: '/dashboard/inputs', label: 'Yazılanlar', icon: '⌨️' },
  { href: '/dashboard/media', label: 'Medya', icon: '📷' },
  { href: '/dashboard/location', label: 'Konum', icon: '📍' },
];

export function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMenuOpen(false)}
        className={`nav-link ${active ? 'nav-link-active' : ''}`}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop">
        <div className="sidebar-brand">
          <h1>Aile Takip</h1>
          <p>{user?.email}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" className="nav-link nav-link-admin">
              <span className="text-lg">⚙️</span>
              <span>Admin</span>
            </Link>
          )}
        </nav>
        <button type="button" onClick={logout} className="btn-secondary w-full text-sm">
          Çıkış Yap
        </button>
      </aside>

      {/* Mobile header */}
      <header className="mobile-header lg:hidden">
        <button type="button" className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
          ☰
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">Aile Takip</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-drawer lg:hidden">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {user?.role === 'admin' && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="nav-link nav-link-admin">
                <span className="text-lg">⚙️</span>
                <span>Admin</span>
              </Link>
            )}
            <button type="button" onClick={logout} className="btn-secondary w-full text-sm mt-4">
              Çıkış Yap
            </button>
          </nav>
        </div>
      )}

      <main className="main-content">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav lg:hidden">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? 'bottom-nav-active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
