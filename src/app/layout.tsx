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
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          minHeight: '100vh',
          overflowX: 'hidden'
        }}
      >
        <div id="app-root" style={{ minHeight: '100vh' }}>
          {children}
        </div>
        
        {/* Retro scanlines overlay */}
        <div 
          style={{
            position: 'fixed',
            inset: '0',
            pointerEvents: 'none',
            zIndex: '50',
            opacity: '0.015',
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
        <div style={{
          position: 'fixed',
          inset: '0',
          pointerEvents: 'none',
          zIndex: '0',
          overflow: 'hidden'
        }}>
          <div className="floating-particle floating-particle-1"></div>
          <div className="floating-particle floating-particle-2"></div>
          <div className="floating-particle floating-particle-3"></div>
          <div className="floating-particle floating-particle-4"></div>
          <div className="floating-particle floating-particle-5"></div>
        </div>
      </body>
    </html>
  );
}
