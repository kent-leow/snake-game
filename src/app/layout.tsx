import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Snake Game - Modern Retro Experience',
  description: 'A modern retro snake game built with Next.js and TypeScript. Experience classic gameplay with contemporary animations and neon aesthetics.',
  keywords: ['snake game', 'retro gaming', 'neon', 'arcade', 'typescript', 'nextjs'],
  authors: [{ name: 'Snake Game Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#39ff14',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang='en' className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Snake Game" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐍</text></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23000' width='100' height='100'/><text y='.9em' font-size='90'>🐍</text></svg>" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden`}
      >
        <div id="app-root" className="min-h-screen">
          {children}
        </div>
        
        {/* Retro scanlines overlay */}
        <div 
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(57, 255, 20, 0.3) 2px,
              rgba(57, 255, 20, 0.3) 4px
            )`
          }}
        />
        
        {/* Background ambient particles */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neon-green rounded-full opacity-30 animate-floating"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-neon-cyan rounded-full opacity-40 animate-floating animate-delay-2"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-neon-pink rounded-full opacity-25 animate-floating animate-delay-4"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-neon-purple rounded-full opacity-35 animate-floating animate-delay-1"></div>
          <div className="absolute bottom-1/4 right-1/2 w-2 h-2 bg-neon-orange rounded-full opacity-20 animate-floating animate-delay-3"></div>
        </div>
      </body>
    </html>
  );
}
