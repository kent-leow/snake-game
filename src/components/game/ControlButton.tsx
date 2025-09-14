'use client';

import React, { useState } from 'react';

interface ControlButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable control button component with visual feedback and accessibility
 */
export const ControlButton: React.FC<ControlButtonProps> = ({
  children,
  onClick,
  variant = 'medium',
  size = 'medium',
  icon,
  shortcut,
  disabled = false,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    setIsPressed(true);
    onClick();

    // Visual feedback
    setTimeout(() => setIsPressed(false), 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={`
        control-button
        control-button--${variant}
        control-button--${size}
        ${isPressed ? 'control-button--pressed' : ''}
        ${disabled ? 'control-button--disabled' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
      aria-label={`${children}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <span className="control-button__content">
        {icon && <span className="control-button__icon">{icon}</span>}
        <span className="control-button__text">{children}</span>
        {shortcut && (
          <span className="control-button__shortcut">{shortcut}</span>
        )}
      </span>
    </button>
  );
};

export default ControlButton;