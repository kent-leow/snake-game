import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Layout({ 
  children, 
  title = 'Snake Game',
  className = ''
}: LayoutProps): React.JSX.Element {
  return (
    <div className={`min-h-screen bg-gray-900 text-white ${className}`}>
      {title && (
        <header className="bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-center text-green-400">
              {title}
            </h1>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}