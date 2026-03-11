import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingClient from './OnboardingClient';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: vi.fn() }) }));

vi.mock('@/app/settings/actions', () => ({
  updatePreferences: vi.fn().mockResolvedValue({ success: true }),
}));

const CATEGORIES = [
  { slug: 'zivotni-prostredi', label: 'Životní prostředí' },
  { slug: 'bezpecnost', label: 'Bezpečnost' },
];

describe('OnboardingClient', () => {
  test('renders welcome form and skip button', () => {
    render(<OnboardingClient categories={CATEGORIES} />);
    expect(screen.getByTestId('preferences-form')).toBeTruthy();
    expect(screen.getByTestId('skip-onboarding')).toBeTruthy();
  });

  test('renders category options', () => {
    render(<OnboardingClient categories={CATEGORIES} />);
    expect(screen.getByTestId('category-zivotni-prostredi')).toBeTruthy();
    expect(screen.getByTestId('category-bezpecnost')).toBeTruthy();
  });

  test('skip button calls updatePreferences with empty prefs and redirects to /dashboard', async () => {
    const { updatePreferences } = await import('@/app/settings/actions');
    render(<OnboardingClient categories={CATEGORIES} />);
    fireEvent.click(screen.getByTestId('skip-onboarding'));
    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalledWith({
        territory_level: '',
        territories: [],
        categories: [],
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('submit redirects to /dashboard after saving', async () => {
    const { updatePreferences } = await import('@/app/settings/actions');
    render(<OnboardingClient categories={CATEGORIES} />);
    fireEvent.click(screen.getByTestId('preferences-submit'));
    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
