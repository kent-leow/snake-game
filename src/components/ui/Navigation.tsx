import React from 'react';
import Link from 'next/link';

interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

interface NavigationProps {
  currentPath?: string;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Play', href: '/game', icon: '🎮' },
  { label: 'Scores', href: '/scores', icon: '🏆' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Navigation({
  currentPath,
  className = '',
}: NavigationProps): React.JSX.Element {
  // Note: usePathname would require 'use client' directive in real app
  // For now, we'll use the prop-based approach
  const pathname = currentPath || '/';

  return (
    <nav className={`navigation-bar ${className}`}>
      <div className='navigation-container'>
        <div className='navigation-items'>
          {navigationItems.map(item => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`navigation-item ${isActive ? 'active' : 'inactive'}`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
