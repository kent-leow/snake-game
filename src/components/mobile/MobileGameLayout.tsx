'use client';

import React, { useEffect, useState } from 'react';
import TouchControls from './TouchControls';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { GameStateType } from '@/lib/game/types';

interface MobileGameLayoutProps {
  children: React.ReactNode;
  gameState: GameStateType;
  showTouchControls?: boolean;
  controlsPosition?: 'bottom' | 'side';
  onDirectionChange?: (direction: import('@/lib/game/types').Direction) => void;
}

/**
 * Mobile-optimized game layout wrapper with responsive behavior
 * Adapts layout based on device capabilities and orientation
 */
export const MobileGameLayout: React.FC<MobileGameLayoutProps> = ({
  children,
  gameState,
  showTouchControls = true,
  controlsPosition = 'bottom',
  onDirectionChange,
}) => {
  const { isMobile, orientation, screenSize } = useResponsiveLayout();
  const [layoutMode, setLayoutMode] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    setLayoutMode(orientation === 'landscape' ? 'landscape' : 'portrait');
  }, [orientation]);

  const shouldShowTouchControls = (): boolean => {
    return isMobile && showTouchControls && gameState === 'playing';
  };

  const getLayoutClasses = (): string => {
    const classes = ['mobile-game-layout'];

    classes.push(`mobile-game-layout--${layoutMode}`);
    classes.push(`mobile-game-layout--${screenSize}`);

    if (shouldShowTouchControls()) {
      classes.push('mobile-game-layout--with-controls');
      classes.push(`mobile-game-layout--controls-${controlsPosition}`);
    }

    return classes.join(' ');
  };

  const handleDirectionChange = (direction: import('@/lib/game/types').Direction): void => {
    if (onDirectionChange) {
      onDirectionChange(direction);
    } else {
      // Fallback: dispatch custom event for game engine
      window.dispatchEvent(new CustomEvent('gameDirectionChange', {
        detail: { direction }
      }));
    }
  };

  return (
    <div className={`${getLayoutClasses()} game-page-container`}>
      <div className="mobile-game-layout__content">
        {children}
      </div>

      {shouldShowTouchControls() && (
        <div className="mobile-game-layout__controls">
          <TouchControls
            onDirectionChange={handleDirectionChange}
            showDirectional={true}
            disabled={gameState !== 'playing'}
          />
        </div>
      )}

      {/* Safe area padding for notched devices */}
      <style jsx>{`
        .mobile-game-layout {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>
    </div>
  );
};

export default MobileGameLayout;