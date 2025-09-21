import React from 'react';
import NavigationButton from '../ui/NavigationButton';

interface MainMenuProps {
  className?: string;
}

interface NavigationItem {
  label: string;
  href: string;
  description: string;
  icon?: string;
  variant?: 'primary' | 'secondary';
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Play Game',
    href: '/game',
    description: 'Start playing the snake game',
    icon: '🎮',
    variant: 'primary',
  },
  {
    label: 'High Scores',
    href: '/scores',
    description: 'View your best scores',
    icon: '🏆',
    variant: 'secondary',
  },
  {
    label: 'Settings',
    href: '/settings',
    description: 'Configure game options',
    icon: '⚙️',
    variant: 'secondary',
  },
];

export default function MainMenu({
  className = '',
}: MainMenuProps): React.JSX.Element {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center relative overflow-hidden ${className}`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 retro-grid opacity-20"></div>
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 animate-floating"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-green-500/20 animate-floating animate-delay-2"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 animate-floating animate-delay-4"></div>

      <div className='text-center relative z-10'>
        {/* Main title with enhanced styling */}
        <div className="mb-8 animate-slide-in-down">
          <h1 className='text-6xl md:text-8xl font-bold mb-4 text-neon-green animate-neon-flicker'>
            SNAKE
          </h1>
          <div className="text-2xl md:text-4xl font-bold text-neon-cyan animate-neon-pulse">
            GAME
          </div>
        </div>

        {/* Subtitle with glowing effect */}
        <p className='text-lg md:text-xl mb-12 text-gray-300 animate-slide-in-up animate-delay-1'>
          <span className="inline-block animate-neon-pulse">Classic Snake game</span>
          <br />
          <span className="text-neon-pink">built with Next.js and TypeScript</span>
        </p>

        {/* Navigation buttons with staggered animations */}
        <div className='space-y-4 mb-8'>
          {NAVIGATION_ITEMS.map((item, index) => (
            <div 
              key={item.href}
              className={`animate-scale-in animate-delay-${index + 2}`}
            >
              <NavigationButton
                href={item.href}
                icon={item.icon}
                variant={item.variant || 'primary'}
              >
                {item.label}
              </NavigationButton>
            </div>
          ))}
        </div>

        {/* Enhanced control hints */}
        <div className='mt-12 text-sm text-gray-400 animate-fade-in animate-delay-5'>
          <div className="glass-effect rounded-lg p-4 inline-block">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-neon-green">⌨️</span>
              <span>Use arrow keys to control the snake</span>
            </div>
            <div className="text-xs text-gray-500">
              Press SPACE to pause • ESC to menu
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-20 bg-gradient-to-t from-transparent to-neon-green opacity-30 animate-neon-pulse"></div>
        </div>
      </div>
    </div>
  );
}
