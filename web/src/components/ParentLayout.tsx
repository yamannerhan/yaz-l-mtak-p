'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/calls', label: 'Aramalar' },
  { href: '/dashboard/sms', label: 'SMS' },
  { href: '/dashboard/notifications', label: 'Bildirimler' },
  { href: '/dashboard/web', label: 'İnternet' },
  { href: '/dashboard/inputs', label: 'Yazılanlar' },
  { href: '/dashboard/media', label: 'Ekran/Kamera' },
  { href: '/dashboard/location', label: 'Konum' },
];

export function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="font-bold text-lg">Takip Paneli</h1>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="block px-4 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-4 border-t">
          <button onClick={logout} className="btn-secondary w-full text-sm">
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
