import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test } from 'vitest';

test('renders Home page', () => {
  render(<Page />);
  const element = screen.getByText(/To get started, edit the page.tsx file/i);
  expect(element).toBeInTheDocument();
});

test('contains links to documentation and learning', () => {
  render(<Page />);
  const docLink = screen.getByRole('link', { name: /documentation/i });
  const templatesLink = screen.getByRole('link', { name: /templates/i });
  const learningLink = screen.getByRole('link', { name: /learning/i });
  
  expect(docLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/docs'));
  expect(templatesLink).toHaveAttribute('href', expect.stringContaining('vercel.com/templates'));
  expect(learningLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/learn'));
});

test('contains Deploy Now link', () => {
  render(<Page />);
  const deployLink = screen.getByRole('link', { name: /deploy now/i });
  expect(deployLink).toHaveAttribute('href', expect.stringContaining('vercel.com/new'));
});
