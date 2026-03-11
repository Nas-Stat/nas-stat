import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreferencesForm from './PreferencesForm';

const CATEGORIES = [
  { slug: 'bezpecnost', label: 'Bezpečnost' },
  { slug: 'zivotni-prostredi', label: 'Životní prostředí' },
];

const EMPTY = { territory_level: '' as const, territories: [], categories: [] };

describe('PreferencesForm', () => {
  test('renders territory level buttons', () => {
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('level-kraj')).toBeTruthy();
    expect(screen.getByTestId('level-orp')).toBeTruthy();
  });

  test('shows territory list after selecting level', () => {
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByTestId('level-kraj'));
    expect(screen.getByTestId('territory-list')).toBeTruthy();
    expect(screen.getByTestId('territory-Hlavní město Praha')).toBeTruthy();
  });

  test('clears territories when level changes', () => {
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByTestId('level-kraj'));
    fireEvent.click(screen.getByTestId('territory-Středočeský kraj'));
    fireEvent.click(screen.getByTestId('level-orp'));
    // Territory list is now ORP, not kraj
    expect(screen.queryByTestId('territory-Středočeský kraj')).toBeFalsy();
  });

  test('toggles category selection', () => {
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} />);
    const btn = screen.getByTestId('category-bezpecnost');
    fireEvent.click(btn);
    expect(btn.className).toContain('bg-blue-600');
    fireEvent.click(btn);
    expect(btn.className).not.toContain('bg-blue-600');
  });

  test('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('category-bezpecnost'));
    fireEvent.click(screen.getByTestId('preferences-submit'));
    await new Promise((r) => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledWith({
      territory_level: '',
      territories: [],
      categories: ['bezpecnost'],
    });
  });

  test('renders with pre-filled initial data', () => {
    render(
      <PreferencesForm
        initial={{ territory_level: 'kraj', territories: ['Praha'], categories: ['bezpecnost'] }}
        categories={CATEGORIES}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('level-kraj').className).toContain('bg-blue-600');
    expect(screen.getByTestId('category-bezpecnost').className).toContain('bg-blue-600');
  });

  test('shows custom submit label', () => {
    render(
      <PreferencesForm
        initial={EMPTY}
        categories={CATEGORIES}
        onSubmit={vi.fn()}
        submitLabel="Uložit nastavení"
      />,
    );
    expect(screen.getByTestId('preferences-submit').textContent).toBe('Uložit nastavení');
  });

  test('shows loading state when isPending', () => {
    render(
      <PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} isPending />,
    );
    expect(screen.getByTestId('preferences-submit').textContent).toBe('Ukládám…');
    expect(screen.getByTestId('preferences-submit')).toBeDisabled();
  });

  test('shows clear level button and clears selection', () => {
    render(<PreferencesForm initial={EMPTY} categories={CATEGORIES} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByTestId('level-kraj'));
    const clearBtn = screen.getByTestId('level-clear');
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn);
    expect(screen.queryByTestId('territory-list')).toBeFalsy();
  });
});
