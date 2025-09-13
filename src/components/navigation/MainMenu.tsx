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

export default function MainMenu({ className = '' }: MainMenuProps): React.JSX.Element {
  return (
    <div className={`min-h-screen bg-gray-900 text-white flex items-center justify-center ${className}`}>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-8 text-green-400">Snake Game</h1>
        <p className="text-xl mb-12 text-gray-300">
          Classic Snake game built with Next.js and TypeScript
        </p>
        
        <div className="space-y-4">
          {NAVIGATION_ITEMS.map((item) => (
            <NavigationButton
              key={item.href}
              href={item.href}
              icon={item.icon}
              variant={item.variant || 'primary'}
            >
              {item.label}
            </NavigationButton>
          ))}
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          Use arrow keys to control the snake
        </div>
      </div>
    </div>
  );
}