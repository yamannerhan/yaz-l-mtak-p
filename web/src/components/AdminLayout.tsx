'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/admin', label: 'İstatistikler', icon: '📊' },
  { href: '/admin/users', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/devices', label: 'Cihazlar', icon: '📱' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar-desktop bg-gray-900 text-white border-gray-800">
        <div className="sidebar-brand border-gray-800">
          <h1 className="text-white">Admin</h1>
          <p className="text-gray-400">{user?.email}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <Link href="/dashboard" className="nav-link text-gray-400 hover:bg-gray-800">
            <span>🏠</span>
            <span>Ebeveyn Paneli</span>
          </Link>
        </nav>
        <button type="button" onClick={logout} className="w-full px-4 py-2.5 bg-gray-800 rounded-xl text-sm hover:bg-gray-700">
          Çıkış Yap
        </button>
      </aside>

      <header className="mobile-header lg:hidden">
        <button type="button" className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <p className="font-semibold text-sm">Admin Panel</p>
      </header>

      {menuOpen && (
        <div className="mobile-drawer lg:hidden bg-gray-900 text-white">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="nav-link text-gray-200 hover:bg-gray-800">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="main-content bg-slate-50">{children}</main>
    </div>
  );
}
