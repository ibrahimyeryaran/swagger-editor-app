import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

function Trigger({ type }: { type?: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('hello toast', type)}>
      trigger
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows and manually dismisses toasts', () => {
    render(
      <ToastProvider>
        <Trigger type="success" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByText('hello toast')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('hello toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts after the lifetime', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByText('hello toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByText('hello toast')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('throws when useToast is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });
});
