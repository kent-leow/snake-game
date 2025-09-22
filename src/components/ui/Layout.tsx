import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Layout({
  children,
  title = 'Snake Game',
  className = '',
}: LayoutProps): React.JSX.Element {
  return (
    <div className={`layout-container ${className}`}>
      {title && (
        <header className='layout-header'>
          <div className='layout-header-content'>
            <h1 className='layout-title'>
              {title}
            </h1>
          </div>
        </header>
      )}
      <main className='layout-main'>{children}</main>
    </div>
  );
}
