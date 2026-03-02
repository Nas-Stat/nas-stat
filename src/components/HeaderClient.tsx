'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { logout } from '@/app/login/actions';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { href: '/reports', label: 'Mapa' },
  { href: '/topics', label: 'Témata' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function HeaderClient({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-blue-600 dark:text-blue-500"
        >
          Náš stát
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Hlavní navigace"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'text-blue-600 dark:text-blue-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="max-w-[200px] truncate text-sm text-slate-600 dark:text-zinc-400">
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  Odhlásit se
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Přihlásit se
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? (
            <X className="h-5 w-5 text-slate-900 dark:text-zinc-100" />
          ) : (
            <Menu className="h-5 w-5 text-slate-900 dark:text-zinc-100" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobilní navigace">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium ${
                  pathname.startsWith(href)
                    ? 'text-blue-600 dark:text-blue-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-zinc-800">
            {user ? (
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-xs text-slate-500 dark:text-zinc-500">
                  {user.email}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex-shrink-0 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Odhlásit se
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-blue-600 dark:text-blue-500"
              >
                Přihlásit se
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
