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
    'block w-64 mx-auto font-bold py-4 px-8 rounded-lg text-xl transition-colors text-center';

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <Link href={href} className={combinedClasses}>
      <div className='flex items-center justify-center space-x-2'>
        {icon && <span className='text-2xl'>{icon}</span>}
        <span>{children}</span>
      </div>
    </Link>
  );
}
