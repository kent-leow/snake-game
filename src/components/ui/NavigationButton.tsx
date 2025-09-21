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
  const baseClasses =
    'group relative block w-72 mx-auto font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 text-center overflow-hidden transform hover:scale-105 hover:-translate-y-1';

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-green-600 to-cyan-500 
      hover:from-green-500 hover:to-cyan-400 
      text-white shadow-lg hover:shadow-2xl 
      border-2 border-transparent hover:border-green-400
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-400 before:to-cyan-300 
      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-20
    `,
    secondary: `
      bg-gradient-to-r from-gray-700 to-gray-600 
      hover:from-gray-600 hover:to-purple-600 
      text-white shadow-lg hover:shadow-2xl 
      border-2 border-gray-500 hover:border-purple-400
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-400 before:to-pink-400 
      before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-20
    `,
  };

  const glowClasses = {
    primary: 'hover:shadow-green-500/50 focus:shadow-green-500/70',
    secondary: 'hover:shadow-purple-500/50 focus:shadow-purple-500/70',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${glowClasses[variant]} ${className}`;

  return (
    <Link href={href} className={combinedClasses}>
      <div className='relative z-10 flex items-center justify-center space-x-3'>
        {icon && (
          <span className='text-2xl group-hover:animate-bounce transition-transform duration-300'>
            {icon}
          </span>
        )}
        <span className="font-semibold tracking-wide">{children}</span>
        
        {/* Animated arrow indicator */}
        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <span className="text-lg">→</span>
        </div>
      </div>

      {/* Neon glow effect */}
      <div 
        className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 pointer-events-none
          ${variant === 'primary' 
            ? 'shadow-[0_0_30px_rgba(34,197,94,0.6)]' 
            : 'shadow-[0_0_30px_rgba(147,51,234,0.6)]'
          }
        `}
      />

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700 ease-out" />
      </div>
    </Link>
  );
}
