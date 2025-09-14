import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveNavigation from '../navigation/ResponsiveNavigation';
import { useMediaQuery } from '@/hooks';

// Mock the useMediaQuery hook
jest.mock('@/hooks', () => ({
  useMediaQuery: jest.fn(),
  useKeyboardNavigation: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockLink = ({ children, href, className, ...props }: {
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

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>;

describe('ResponsiveNavigation', () => {
  const defaultProps = {
    currentPath: '/',
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow after each test
    document.body.style.overflow = '';
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    it('renders desktop navigation correctly', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Should render main nav element
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
      
      // Should render all navigation items
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('Scores')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
      render(<ResponsiveNavigation {...defaultProps} currentPath="/game" />);
      
      const gameLink = screen.getByText('Play').closest('a');
      expect(gameLink).toHaveClass('responsive-navigation__link--active');
    });

    it('renders navigation links with correct href attributes', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      const homeLink = screen.getByText('Home').closest('a');
      const playLink = screen.getByText('Play').closest('a');
      const scoresLink = screen.getByText('Scores').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(homeLink?.getAttribute('href')).toBe('/');
      expect(playLink?.getAttribute('href')).toBe('/game');
      expect(scoresLink?.getAttribute('href')).toBe('/scores');
      expect(settingsLink?.getAttribute('href')).toBe('/settings');
    });

    it('renders navigation icons', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('🎮')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('does not render mobile navigation elements', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Should not have hamburger button
      expect(screen.queryByRole('button', { name: /navigation menu/i })).not.toBeInTheDocument();
      
      // Should not have mobile menu
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    it('renders mobile navigation correctly', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Should render brand name (check that at least one exists)
      const brandElements = screen.getAllByText('Snake Game');
      expect(brandElements.length).toBeGreaterThan(0);
      
      // Should render hamburger menu button
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      expect(menuButton).toBeInTheDocument();
      
      // Should have proper ARIA attributes
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    it('opens mobile menu when hamburger is clicked', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Menu button should be expanded
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      expect(menuButton).toHaveAttribute('aria-label', 'Close navigation menu');
      
      // Mobile menu should be visible
      const mobileMenu = screen.getByRole('dialog');
      expect(mobileMenu).toBeInTheDocument();
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
      
      // Should render navigation items in mobile menu
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('Scores')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('closes mobile menu when close button is clicked', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Close menu using the X button in the menu header (not the hamburger)
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      // Menu should be closed
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');
    });

    it('closes mobile menu when overlay is clicked', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Click overlay
      const overlay = document.querySelector('.mobile-menu-overlay');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);
      
      // Menu should be closed
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('highlights active navigation item in mobile menu', () => {
      render(<ResponsiveNavigation {...defaultProps} currentPath="/scores" />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      const scoresLink = screen.getByText('Scores').closest('a');
      expect(scoresLink).toHaveClass('mobile-menu__link--active');
    });

    it('prevents body scroll when mobile menu is open', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Body should have overflow hidden
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close menu using the X button
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      // Body overflow should be reset
      expect(document.body.style.overflow).toBe('');
    });

    it('has proper touch targets for mobile accessibility', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      expect(menuButton).toHaveClass('touch-target');
      
      // Open menu and check navigation items
      fireEvent.click(menuButton);
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('touch-target');
    });
  });

  describe('Responsive Behavior', () => {
    it('closes mobile menu when switching from mobile to desktop', () => {
      const { rerender } = render(<ResponsiveNavigation {...defaultProps} />);
      
      // Start with mobile
      mockUseMediaQuery.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
      rerender(<ResponsiveNavigation {...defaultProps} />);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Switch to desktop
      mockUseMediaQuery.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
      rerender(<ResponsiveNavigation {...defaultProps} />);
      
      // Mobile menu should be closed and hamburger should not be visible
      expect(screen.queryByRole('button', { name: /navigation menu/i })).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom brand name and href', () => {
      mockUseMediaQuery.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
      
      render(
        <ResponsiveNavigation 
          {...defaultProps} 
          brandName="Custom Game"
          brandHref="/custom"
        />
      );
      
      const brandLinks = screen.getAllByText('Custom Game');
      // The first one should be the link in the mobile header
      const brandLink = brandLinks[0].closest('a');
      expect(brandLink?.getAttribute('href')).toBe('/custom');
    });

    it('accepts custom navigation items', () => {
      const customItems = [
        { label: 'Custom', href: '/custom', icon: '🎯' },
        { label: 'Test', href: '/test', icon: '🧪' },
      ];
      
      mockUseMediaQuery.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
      
      render(
        <ResponsiveNavigation 
          {...defaultProps} 
          items={customItems}
        />
      );
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('🧪')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ResponsiveNavigation 
          {...defaultProps} 
          className="custom-navigation"
        />
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-navigation');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    it('has proper ARIA labels and roles', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      // Main navigation
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Mobile menu dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'mobile-menu-title');
      
      // The mobile menu nav is inside the dialog
      const mobileNavs = screen.getAllByRole('navigation', { name: 'Main navigation' });
      expect(mobileNavs.length).toBe(2); // One for the main container, one for the mobile menu
    });

    it('sets aria-current for active page', () => {
      render(<ResponsiveNavigation {...defaultProps} currentPath="/game" />);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      const playLink = screen.getByText('Play').closest('a');
      expect(playLink).toHaveAttribute('aria-current', 'page');
    });

    it('uses aria-hidden correctly for mobile menu visibility', () => {
      render(<ResponsiveNavigation {...defaultProps} />);
      
      const mobileMenu = document.querySelector('#mobile-menu');
      const overlay = document.querySelector('.mobile-menu-overlay');
      
      // Initially hidden
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      fireEvent.click(menuButton);
      
      // Should be visible
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
      expect(overlay).toHaveAttribute('aria-hidden', 'false');
    });
  });
});