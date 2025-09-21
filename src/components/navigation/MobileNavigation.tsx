'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import NavigationMenu, { NavigationItem } from './NavigationMenu';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  items: NavigationItem[];
  currentPath: string;
  brandName?: string;
  brandHref?: string;
}

/**
 * Mobile-specific navigation component with hamburger menu
 * Provides proper touch targets and overlay functionality
 */
export default function MobileNavigation({
  isOpen,
  onToggle,
  items,
  currentPath,
  brandName = 'Snake Game',
  brandHref = '/',
}: MobileNavigationProps): React.JSX.Element {
  // Close mobile menu on escape key
  useKeyboardNavigation({
    onEscape: () => {
      if (isOpen) {
        onToggle();
      }
    },
    disabled: !isOpen,
  });

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return (): void => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (): void => {
    // Close mobile menu when navigation item is clicked
    onToggle();
  };

  const handleOverlayClick = (event: React.MouseEvent): void => {
    // Only close if clicking the overlay itself, not its children
    if (event.target === event.currentTarget) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile header with hamburger */}
      <div className='responsive-navigation__mobile'>
        <Link
          href={brandHref}
          className='responsive-navigation__brand'
          aria-label={`${brandName} - Go to home page`}
        >
          {brandName}
        </Link>

        <button
          type='button'
          className='responsive-navigation__toggle touch-target'
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls='mobile-menu'
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <div className={`hamburger ${isOpen ? 'hamburger--open' : ''}`}>
            <span className='hamburger__line'></span>
            <span className='hamburger__line'></span>
            <span className='hamburger__line'></span>
          </div>
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay ${isOpen ? 'mobile-menu-overlay--open' : ''}`}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      />

      {/* Mobile menu panel */}
      <div
        id='mobile-menu'
        className={`mobile-menu ${isOpen ? 'mobile-menu--open' : ''}`}
        aria-hidden={!isOpen}
        role='dialog'
        aria-modal='true'
        aria-labelledby='mobile-menu-title'
      >
        <div className='mobile-menu__header'>
          <h2 id='mobile-menu-title' className='responsive-navigation__brand'>
            {brandName}
          </h2>
          <button
            type='button'
            className='mobile-menu__close touch-target'
            onClick={onToggle}
            aria-label='Close navigation menu'
          >
            ×
          </button>
        </div>

        <nav className='mobile-menu__nav' aria-label='Main navigation'>
          <NavigationMenu
            items={items}
            currentPath={currentPath}
            onItemClick={handleItemClick}
            isMobile={true}
          />
        </nav>
      </div>
    </>
  );
}
