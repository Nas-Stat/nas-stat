import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Map from '@/components/Map';

export default function ReportsPage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="flex h-16 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="mr-4 flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Hlášení podnětů
        </h1>
      </header>

      {/* Main content - Map */}
      <main className="relative flex-1">
        <Map />
      </main>
    </div>
  );
}
