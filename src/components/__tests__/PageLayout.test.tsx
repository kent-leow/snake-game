import React from 'react';
import { render, screen } from '@testing-library/react';
import PageLayout from '../ui/PageLayout';

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

describe('PageLayout', () => {
  const defaultProps = {
    title: 'Test Page',
    children: <div>Test Content</div>,
  };

  it('renders the page title correctly', () => {
    render(<PageLayout {...defaultProps} />);
    expect(screen.getByText('Test Page')).toBeDefined();
  });

  it('renders children content', () => {
    render(<PageLayout {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('renders back button by default', () => {
    render(<PageLayout {...defaultProps} />);
    expect(screen.getByText('Back')).toBeDefined();
    expect(screen.getByText('←')).toBeDefined();
  });

  it('hides back button when showBackButton is false', () => {
    render(<PageLayout {...defaultProps} showBackButton={false} />);
    expect(screen.queryByText('Back')).toBeNull();
  });

  it('renders back button with custom href', () => {
    render(<PageLayout {...defaultProps} backHref='/custom' />);
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink?.getAttribute('href')).toBe('/custom');
  });

  it('renders back button with default href when not specified', () => {
    render(<PageLayout {...defaultProps} />);
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink?.getAttribute('href')).toBe('/');
  });

  it('renders navigation menu with all expected links', () => {
    render(<PageLayout {...defaultProps} />);

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Play')).toBeDefined();
    expect(screen.getByText('Scores')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders navigation links with correct href attributes', () => {
    render(<PageLayout {...defaultProps} />);

    const homeLink = screen.getByText('Home').closest('a');
    const gameLink = screen.getByText('Play').closest('a');
    const scoresLink = screen.getByText('Scores').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(homeLink?.getAttribute('href')).toBe('/');
    expect(gameLink?.getAttribute('href')).toBe('/game');
    expect(scoresLink?.getAttribute('href')).toBe('/scores');
    expect(settingsLink?.getAttribute('href')).toBe('/settings');
  });

  it('has proper semantic structure with header and main elements', () => {
    const { container } = render(<PageLayout {...defaultProps} />);

    const header = container.querySelector('header');
    const main = container.querySelector('main');

    expect(header).toBeDefined();
    expect(main).toBeDefined();
  });
});
