import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import TopicForm from './TopicForm';

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
}));

test('renders TopicForm and handles submission', async () => {
  const mockOnSubmit = vi.fn((e) => e.preventDefault());
  const mockOnClose = vi.fn();

  render(
    <TopicForm
      onSubmit={mockOnSubmit}
      onClose={mockOnClose}
      isSubmitting={false}
    />
  );

  expect(screen.getByText('Nové téma')).toBeInTheDocument();
  expect(screen.getByLabelText(/Název tématu/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Název tématu/i), { target: { value: 'Test Topic' } });
  fireEvent.change(screen.getByLabelText(/Popis/i), { target: { value: 'Test Description' } });

  fireEvent.submit(screen.getByText('Vytvořit téma').closest('form')!);

  expect(mockOnSubmit).toHaveBeenCalled();
});

test('shows error message when provided', () => {
  render(
    <TopicForm
      onSubmit={vi.fn()}
      onClose={vi.fn()}
      isSubmitting={false}
      error="Something went wrong"
      onErrorClose={vi.fn()}
    />
  );

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
});

test('disables submit button while submitting', () => {
  render(
    <TopicForm
      onSubmit={vi.fn()}
      onClose={vi.fn()}
      isSubmitting={true}
    />
  );

  const submitButton = screen.getByText('Vytvářím...');
  expect(submitButton).toBeDisabled();
});

test('calls onClose when close button is clicked', () => {
  const mockOnClose = vi.fn();
  render(
    <TopicForm
      onSubmit={vi.fn()}
      onClose={mockOnClose}
      isSubmitting={false}
    />
  );

  fireEvent.click(screen.getByTestId('x-icon'));
  expect(mockOnClose).toHaveBeenCalled();
});
