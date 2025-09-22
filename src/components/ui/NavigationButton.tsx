import React from 'react';
import Link from 'next/link';

interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function NavigationButton({
  href,
  children,
  icon,
  variant = 'primary',
  className = '',
}: NavigationButtonProps): React.JSX.Element {
  const buttonClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <Link href={href} className={`nav-button ${buttonClass} ${className}`}>
      <div className='nav-button-content'>
        {icon && (
          <span className='nav-button-icon'>
            {icon}
          </span>
        )}
        <span className="nav-button-text">{children}</span>
        
        {/* Animated arrow indicator */}
        <div className="nav-button-arrow">
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}
