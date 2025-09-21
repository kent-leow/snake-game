import React from 'react';
import { render, screen } from '@testing-library/react';
import MainMenu from '../navigation/MainMenu';

// Mock Next.js Link
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockLink = ({
    children,
    href,
    className,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    [key: string]: unknown;
  }): React.JSX.Element => {
    return React.createElement('a', { href, className, ...props }, children);
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('MainMenu', () => {
  it('renders the main title correctly', () => {
    render(<MainMenu />);
    expect(screen.getByText('SNAKE')).toBeDefined();
    expect(screen.getByText('GAME')).toBeDefined();
  });

  it('renders the description text', () => {
    render(<MainMenu />);
    expect(screen.getByText('Classic Snake game')).toBeDefined();
    expect(screen.getByText('built with Next.js and TypeScript')).toBeDefined();
  });

  it('renders all navigation buttons with correct labels', () => {
    render(<MainMenu />);

    expect(screen.getByText('Play Game')).toBeDefined();
    expect(screen.getByText('High Scores')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders navigation buttons with correct href attributes', () => {
    render(<MainMenu />);

    const playGameLink = screen.getByText('Play Game').closest('a');
    const highScoresLink = screen.getByText('High Scores').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(playGameLink?.getAttribute('href')).toBe('/game');
    expect(highScoresLink?.getAttribute('href')).toBe('/scores');
    expect(settingsLink?.getAttribute('href')).toBe('/settings');
  });

  it('renders navigation buttons with icons', () => {
    render(<MainMenu />);

    // Check that emoji icons are present
    expect(screen.getByText('🎮')).toBeDefined();
    expect(screen.getByText('🏆')).toBeDefined();
    expect(screen.getByText('⚙️')).toBeDefined();
  });

  it('renders the controls instruction text', () => {
    render(<MainMenu />);
    expect(
      screen.getByText('Use arrow keys to control the snake')
    ).toBeDefined();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-test-class';
    const { container } = render(<MainMenu className={customClass} />);
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild?.classList?.contains(customClass)).toBe(true);
  });
});
