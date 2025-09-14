'use client';

import React, { useState } from 'react';
import { useMediaQuery } from '@/hooks';
import NavigationMenu, { NavigationItem } from './NavigationMenu';
import MobileNavigation from './MobileNavigation';

interface ResponsiveNavigationProps {
  currentPath: string;
  className?: string;
  brandName?: string;
  brandHref?: string;
  items?: NavigationItem[];
}

// Default navigation items matching existing navigation structure
const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Play', href: '/game', icon: '🎮' },
  { label: 'Scores', href: '/scores', icon: '🏆' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

/**
 * Main responsive navigation component
 * Adapts to different screen sizes and provides mobile-friendly navigation
 */
export default function ResponsiveNavigation({
  currentPath,
  className = '',
  brandName = 'Snake Game',
  brandHref = '/',
  items = DEFAULT_NAVIGATION_ITEMS,
}: ResponsiveNavigationProps): React.JSX.Element {
  const { isMobile } = useMediaQuery();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when switching to desktop view
  React.useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  return (
    <nav 
      className={`responsive-navigation ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="responsive-navigation__container">
        {isMobile ? (
          <MobileNavigation
            isOpen={isMobileMenuOpen}
            onToggle={toggleMobileMenu}
            items={items}
            currentPath={currentPath}
            brandName={brandName}
            brandHref={brandHref}
          />
        ) : (
          <div className="responsive-navigation__desktop">
            <NavigationMenu
              items={items}
              currentPath={currentPath}
              isMobile={false}
            />
          </div>
        )}
      </div>
    </nav>
  );
}