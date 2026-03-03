import { login, signup, signInWithGoogle } from './actions'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Přihlášení | Náš stát',
  description: 'Přihlaste se do aplikace Náš stát.',
}

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Náš stát
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Přihlaste se nebo si vytvořte účet
            </p>
          </div>

          {/* Email/Password form */}
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Emailová adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                title="Heslo"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
            </div>

            {searchParams.error && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/20"
                data-testid="error-message"
              >
                <p className="text-sm text-red-700 dark:text-red-400">{searchParams.error}</p>
              </div>
            )}

            {searchParams.message && (
              <div
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/20"
                data-testid="success-message"
              >
                <p className="text-sm text-blue-700 dark:text-blue-400">{searchParams.message}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                formAction={login}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-zinc-900"
              >
                Přihlásit se
              </button>
              <button
                formAction={signup}
                className="flex w-full justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
              >
                Zaregistrovat se
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Nebo pokračujte přes
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
            >
              <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.22-1.9 4.28-1.2 1.2-3.06 2.4-6.42 2.4-4.8 0-8.94-3.9-8.94-8.7s4.14-8.7 8.94-8.7c2.46 0 4.5 1.02 6.1 2.52l2.32-2.32C18.16 1.44 15.56 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.7 0 6.48-1.24 8.62-3.46 2.22-2.22 2.92-5.34 2.92-7.82 0-.62-.04-1.24-.12-1.84h-11.4z" />
              </svg>
              Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
