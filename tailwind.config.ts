/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39ff14',
        'neon-pink': '#ff073a',
        'neon-cyan': '#00ffff',
        'neon-orange': '#ff8c00',
        'neon-purple': '#8a2be2',
        'neon-yellow': '#ffff00',
        'retro-bg-primary': '#0f0f0f',
        'retro-bg-secondary': '#1a1a1a',
        'retro-bg-tertiary': '#262626',
      },
      fontFamily: {
        'geist-sans': ['var(--font-geist-sans)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'glow-rotate': 'glowRotate 4s linear infinite',
        'slide-in-up': 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-in-down': 'slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) both',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
        'floating': 'floatingAnimation 3s ease-in-out infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': {
            opacity: '1',
            filter: 'brightness(1)',
          },
          '50%': {
            opacity: '0.8',
            filter: 'brightness(1.2)',
          },
        },
        glowRotate: {
          from: {
            transform: 'rotate(0deg)',
            filter: 'hue-rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
            filter: 'hue-rotate(360deg)',
          },
        },
        slideInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInDown: {
          from: {
            opacity: '0',
            transform: 'translateY(-30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          from: {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInRight: {
          from: {
            opacity: '0',
            transform: 'translateX(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          from: {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        fadeIn: {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '2%': { opacity: '0.9' },
          '4%': { opacity: '1' },
          '8%': { opacity: '0.95' },
          '10%': { opacity: '1' },
          '12%': { opacity: '0.98' },
          '14%': { opacity: '1' },
        },
        floatingAnimation: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 7, 58, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;