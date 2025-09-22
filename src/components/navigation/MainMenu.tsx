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
    <div className={`page-container ${className}`}>
      {/* Main content container */}
      <div className="content-container">
        <div className="main-menu-content">
          {/* Main title with enhanced styling */}
          <div className="main-menu-header">
            <h1 className='heading-primary'>
              SNAKE
            </h1>
            <div className="heading-secondary">
              GAME
            </div>
          </div>

          {/* Subtitle with glowing effect */}
          <p className='main-menu-subtitle'>
            <span>Classic Snake game</span>
            <br />
            <span className="text-neon-pink">built with Next.js and TypeScript</span>
          </p>

          {/* Navigation buttons with staggered animations */}
          <div className='main-menu-buttons'>
            {NAVIGATION_ITEMS.map((item, index) => (
              <div 
                key={item.href}
                className={`menu-button-wrapper animate-delay-${index + 1}`}
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
          <div className='main-menu-controls'>
            <div className="control-hints">
              <div className="control-hint-row">
                <span className="text-neon-green">⌨️</span>
                <span>Use arrow keys to control the snake</span>
              </div>
              <div className="control-hint-sub">
                Press SPACE to pause • ESC to menu
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
