import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('@line/liff', () => ({
  default: {
    init: vi.fn(),
    isLoggedIn: vi.fn(() => true),
    getProfile: vi.fn(() => Promise.resolve({ userId: 'test-user', displayName: 'Test User' })),
  },
}));

describe('App', () => {
  it('renders purchase and history links', () => {
    render(<App />);
    expect(screen.getByText('購入履歴')).toBeInTheDocument();
    expect(screen.getByText('履歴一覧')).toBeInTheDocument();
  });
});