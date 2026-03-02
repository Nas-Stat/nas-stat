import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi, describe } from 'vitest';
import HeaderClient from './HeaderClient';
import type { User } from '@supabase/supabase-js';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock logout server action
vi.mock('@/app/login/actions', () => ({
  logout: vi.fn(),
}));

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '',
};

describe('HeaderClient', () => {
  test('renders logo link "Náš stát"', () => {
    render(<HeaderClient user={null} />);
    const logo = screen.getByRole('link', { name: /náš stát/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  test('renders all desktop nav links', () => {
    render(<HeaderClient user={null} />);
    expect(screen.getByRole('link', { name: 'Mapa' })).toHaveAttribute('href', '/reports');
    expect(screen.getByRole('link', { name: 'Témata' })).toHaveAttribute('href', '/topics');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  test('shows "Přihlásit se" when user is null', () => {
    render(<HeaderClient user={null} />);
    // Desktop shows at least one login link
    const loginLinks = screen.getAllByRole('link', { name: /přihlásit se/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });

  test('shows user email and logout button when user is logged in', () => {
    render(<HeaderClient user={mockUser} />);
    expect(screen.getAllByText(/test@example.com/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /odhlásit se/i })).toBeInTheDocument();
  });

  test('does not show login link when user is logged in', () => {
    render(<HeaderClient user={mockUser} />);
    expect(screen.queryByRole('link', { name: /přihlásit se/i })).not.toBeInTheDocument();
  });

  test('hamburger button is rendered', () => {
    render(<HeaderClient user={null} />);
    expect(screen.getByRole('button', { name: /otevřít menu/i })).toBeInTheDocument();
  });

  test('clicking hamburger opens mobile nav', () => {
    render(<HeaderClient user={null} />);
    const hamburger = screen.getByRole('button', { name: /otevřít menu/i });
    // Mobile nav not yet visible
    expect(screen.queryByRole('navigation', { name: /mobilní navigace/i })).not.toBeInTheDocument();
    fireEvent.click(hamburger);
    // Mobile nav appears; close button shown
    expect(screen.getByRole('navigation', { name: /mobilní navigace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zavřít menu/i })).toBeInTheDocument();
  });

  test('clicking hamburger again closes mobile nav', () => {
    render(<HeaderClient user={null} />);
    const hamburger = screen.getByRole('button', { name: /otevřít menu/i });
    fireEvent.click(hamburger);
    const closeBtn = screen.getByRole('button', { name: /zavřít menu/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('button', { name: /zavřít menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /mobilní navigace/i })).not.toBeInTheDocument();
  });

  test('active nav link gets active class when pathname matches', async () => {
    const { usePathname } = await import('next/navigation');
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/reports');

    render(<HeaderClient user={null} />);
    const mapaLinks = screen.getAllByRole('link', { name: 'Mapa' });
    expect(mapaLinks[0].className).toContain('text-blue-600');
  });
});
