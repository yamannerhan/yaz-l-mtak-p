'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/admin', label: 'İstatistikler' },
  { href: '/admin/users', label: 'Kullanıcılar' },
  { href: '/admin/devices', label: 'Cihazlar' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="font-bold text-lg">Admin Panel</h1>
          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? 'bg-purple-600' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/dashboard" className="block px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800">
            Ebeveyn Paneli
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout} className="w-full px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
