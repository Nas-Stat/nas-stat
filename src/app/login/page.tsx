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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Vítejte v aplikaci Náš stát
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Přihlaste se nebo si vytvořte účet
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Emailová adresa
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" title="Heslo" className="block text-sm font-medium text-gray-700">
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {searchParams.error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{searchParams.error}</p>
              </div>
            )}

            {searchParams.message && (
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-700">{searchParams.message}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                formAction={login}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Přihlásit se
              </button>
              <button
                formAction={signup}
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Zaregistrovat se
              </button>
            </div>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Nebo pokračujte přes</span>
            </div>
          </div>

          <div>
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.22-1.9 4.28-1.2 1.2-3.06 2.4-6.42 2.4-4.8 0-8.94-3.9-8.94-8.7s4.14-8.7 8.94-8.7c2.46 0 4.5 1.02 6.1 2.52l2.32-2.32C18.16 1.44 15.56 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.7 0 6.48-1.24 8.62-3.46 2.22-2.22 2.92-5.34 2.92-7.82 0-.62-.04-1.24-.12-1.84h-11.4z" />
                </svg>
                Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
