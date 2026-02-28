'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface TopicFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  error?: string | null;
  onErrorClose?: () => void;
}

export default function TopicForm({
  onSubmit,
  onClose,
  isSubmitting,
  error,
  onErrorClose,
}: TopicFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Nové téma
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            type="button"
          >
            <X className="h-6 w-6 text-zinc-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            {onErrorClose && (
              <button
                onClick={onErrorClose}
                className="ml-auto text-xs underline"
                type="button"
              >
                Zavřít
              </button>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Název tématu *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              minLength={3}
              maxLength={100}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Např. Kvalita školství v kraji"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Popis (volitelně)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              minLength={10}
              maxLength={1000}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Popište podrobněji, o co jde..."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-zinc-900 py-3 font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? 'Vytvářím...' : 'Vytvořit téma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
