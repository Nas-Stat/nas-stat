import { render, screen } from '@testing-library/react';
import LoginPage from './page';
import { expect, test, vi } from 'vitest';

vi.mock('./actions', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

test('renders LoginPage with form', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  
  expect(screen.getByLabelText(/Emailová adresa/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Heslo/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /přihlásit se/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /zaregistrovat se/i })).toBeInTheDocument();
});

test('renders Google login button', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
});

test('shows error message from searchParams', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: 'Chybné údaje' }) });
  render(ResolvedPage);
  expect(screen.getByText(/Chybné údaje/i)).toBeInTheDocument();
});

test('shows success message from searchParams', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: 'Zkontrolujte email', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByText(/Zkontrolujte email/i)).toBeInTheDocument();
});
