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
}: PageLayoutProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className='h-screen bg-gray-900 text-white flex flex-col overflow-hidden'>
      <header className='bg-gray-800 shadow-lg flex-shrink-0'>
        <div className='container mx-auto px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              {showBackButton && (
                <Link
                  href={backHref}
                  className='bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded transition-colors text-sm'
                >
                  ← Back
                </Link>
              )}
              <h1 className='text-xl font-bold text-green-400'>{title}</h1>
            </div>
            
            {/* Inline Navigation */}
            {showNavigation && (
              <nav className='flex items-center space-x-1'>
                {NAVIGATION_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded text-sm transition-colors ${
                      pathname === item.href
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <span className='text-xs'>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>
      <main className='flex-1 overflow-hidden'>{children}</main>
    </div>
  );
}
