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

test('renders app name heading', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByRole('heading', { name: /náš stát/i })).toBeInTheDocument();
});

test('renders Google login button', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
});

test('shows error message from searchParams', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: 'Chybné údaje' }) });
  render(ResolvedPage);
  expect(screen.getByTestId('error-message')).toBeInTheDocument();
  expect(screen.getByText(/Chybné údaje/i)).toBeInTheDocument();
});

test('shows success message from searchParams', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: 'Zkontrolujte email', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByTestId('success-message')).toBeInTheDocument();
  expect(screen.getByText(/Zkontrolujte email/i)).toBeInTheDocument();
});

test('does not show error block when error is empty', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
});

test('does not show success block when message is empty', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
});

test('email input has correct type and autocomplete', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  const emailInput = screen.getByLabelText(/Emailová adresa/i);
  expect(emailInput).toHaveAttribute('type', 'email');
  expect(emailInput).toHaveAttribute('autocomplete', 'email');
});

test('password input has correct type', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  const passwordInput = screen.getByLabelText(/Heslo/i);
  expect(passwordInput).toHaveAttribute('type', 'password');
});

test('renders role select with all role options', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  const roleSelect = screen.getByTestId('role-select');
  expect(roleSelect).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Občan' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Obec' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Kraj' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Ministerstvo' })).toBeInTheDocument();
});

test('role select defaults to citizen', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  const roleSelect = screen.getByTestId('role-select') as HTMLSelectElement;
  expect(roleSelect.value).toBe('citizen');
});

test('renders official role disclaimer note', async () => {
  const ResolvedPage = await LoginPage({ searchParams: Promise.resolve({ message: '', error: '' }) });
  render(ResolvedPage);
  expect(screen.getByText(/Úřednické role.*vyžadují schválení administrátorem/i)).toBeInTheDocument();
});
