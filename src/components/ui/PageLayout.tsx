import React from 'react';
import Link from 'next/link';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  backHref?: string;
}

export default function PageLayout({
  children,
  title,
  showBackButton = true,
  backHref = '/',
}: PageLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link
                  href={backHref}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  ← Back
                </Link>
              )}
              <h1 className="text-2xl font-bold text-green-400">{title}</h1>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/game"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Game
              </Link>
              <Link
                href="/scores"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Scores
              </Link>
              <Link
                href="/settings"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}