import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test } from 'vitest';

test('renders Home page', () => {
  render(<Page />);
  const element = screen.getByText(/To get started, edit the page.tsx file/i);
  expect(element).toBeInTheDocument();
});
