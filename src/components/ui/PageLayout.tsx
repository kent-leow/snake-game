'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  showNavigation?: boolean;
  scrollable?: boolean; // New prop to control scrolling behavior
  disableLaserEffects?: boolean; // New prop to disable animated borders
}

// Navigation items
const NAVIGATION_ITEMS = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Play', href: '/game', icon: '🎮' },
  { label: 'Scores', href: '/scores', icon: '🏆' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function PageLayout({
  children,
  title,
  showBackButton = true,
  backHref = '/',
  showNavigation = true,
  scrollable = true, // Default to scrollable for most pages
  disableLaserEffects = false, // Default to showing laser effects
}: PageLayoutProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className={`page-layout ${scrollable ? 'scrollable' : 'non-scrollable'}`}>
      {/* Animated background */}
      <div className="page-layout-bg-grid"></div>
      {!disableLaserEffects && <div className="page-layout-top-border"></div>}
      
      <header className='page-layout-header'>
        <div className='page-layout-header-container'>
          <div className='page-layout-header-content'>
            <div className='page-layout-header-left'>
              {showBackButton && (
                <Link
                  href={backHref}
                  className='page-layout-back-button'
                >
                  <div className="page-layout-back-content">
                    <span className="page-layout-back-arrow">←</span>
                    <span>Back</span>
                  </div>
                  <div className="page-layout-back-glow" />
                </Link>
              )}
              <h1 className='page-layout-title'>
                {title}
              </h1>
            </div>
            
            {/* Enhanced Navigation */}
            {showNavigation && (
              <nav className='page-layout-nav'>
                {NAVIGATION_ITEMS.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`page-layout-nav-item ${
                      pathname === item.href ? 'active' : 'inactive'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className={`page-layout-nav-icon ${pathname === item.href ? 'pulse' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="page-layout-nav-label">{item.label}</span>
                    
                    {/* Glow effect for active item */}
                    {pathname === item.href && (
                      <div className="page-layout-nav-active-glow" />
                    )}
                    
                    {/* Hover glow for inactive items */}
                    {pathname !== item.href && (
                      <div className="page-layout-nav-hover-glow" />
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>
      
      <main className={`page-layout-main ${scrollable ? 'scrollable-main' : 'fixed-main'}`}>
        {children}
      </main>
      
      {/* Decorative bottom border */}
      {!disableLaserEffects && <div className="page-layout-bottom-border"></div>}
    </div>
  );
}
