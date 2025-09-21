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
    <div className='h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col overflow-hidden relative'>
      {/* Animated background */}
      <div className="absolute inset-0 retro-grid opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-pink animate-glow-rotate"></div>
      
      <header className='glass-effect border-b border-white/10 flex-shrink-0 relative z-10 animate-slide-in-down'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              {showBackButton && (
                <Link
                  href={backHref}
                  className='group relative bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 border border-gray-500 hover:border-purple-400'
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:animate-bounce">←</span>
                    <span>Back</span>
                  </div>
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_20px_rgba(147,51,234,0.5)]" />
                </Link>
              )}
              <h1 className='text-2xl font-bold text-neon-green animate-neon-pulse'>
                {title}
              </h1>
            </div>
            
            {/* Enhanced Navigation */}
            {showNavigation && (
              <nav className='flex items-center space-x-2 animate-slide-in-right'>
                {NAVIGATION_ITEMS.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 ${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-green-600 to-cyan-500 text-white shadow-lg border border-green-400'
                        : 'text-gray-300 hover:text-white glass-effect border border-white/10 hover:border-purple-400'
                    } animate-scale-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className={`text-lg transition-transform duration-300 ${pathname !== item.href ? 'group-hover:animate-bounce' : 'animate-neon-pulse'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    
                    {/* Glow effect for active item */}
                    {pathname === item.href && (
                      <div className="absolute inset-0 rounded-lg opacity-70 pointer-events-none shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                    )}
                    
                    {/* Hover glow for inactive items */}
                    {pathname !== item.href && (
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[0_0_20px_rgba(147,51,234,0.5)]" />
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>
      
      <main className='flex-1 overflow-hidden relative z-10 animate-fade-in animate-delay-1'>
        {children}
      </main>
      
      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan animate-glow-rotate" style={{ animationDirection: 'reverse' }}></div>
    </div>
  );
}
