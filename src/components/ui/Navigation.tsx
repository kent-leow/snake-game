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
  className = ''
}: NavigationProps): React.JSX.Element {
  // Note: usePathname would require 'use client' directive in real app
  // For now, we'll use the prop-based approach
  const pathname = currentPath || '/';

  return (
    <nav className={`bg-gray-800 shadow-lg ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-8">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
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