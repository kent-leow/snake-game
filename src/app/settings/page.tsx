import type { Metadata } from 'next';
import PageLayout from '@/components/ui/PageLayout';

export const metadata: Metadata = {
  title: 'Snake Game - Settings',
  description: 'Configure game settings and preferences',
};

export default function SettingsPage(): React.JSX.Element {
  return (
    <PageLayout title='Settings' showBackButton={true} scrollable={true}>
      <div className='flex-1 overflow-auto p-6 relative'>
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-floating"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-floating animate-delay-2"></div>
        
        <div className='max-w-2xl mx-auto relative z-10'>
          {/* Page Header */}
          <div className="text-center mb-8 animate-slide-in-down">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-neon-orange">⚙️</span>
              <span className="text-neon-purple ml-3">Game Settings</span>
            </h1>
            <p className="text-lg text-gray-300 animate-fade-in animate-delay-1">
              Customize your gaming experience
            </p>
          </div>

          {/* Settings Panels */}
          <div className="space-y-6">
            {/* Game Configuration */}
            <div className="game-card p-6 animate-scale-in animate-delay-1">
              <h2 className="text-2xl font-bold text-neon-green mb-6 flex items-center">
                <span className="mr-3 animate-neon-pulse">🎮</span>
                Game Configuration
              </h2>
              
              <div className='space-y-6'>
                {/* Game Speed Setting */}
                <div className="animate-slide-in-left animate-delay-2">
                  <label className='block text-lg font-medium mb-3 text-neon-cyan'>
                    Game Speed
                  </label>
                  <select className='form-select w-full text-lg'>
                    <option value='slow'>🐌 Slow (Beginner)</option>
                    <option value='normal' selected>🚶 Normal (Standard)</option>
                    <option value='fast'>🏃 Fast (Expert)</option>
                    <option value='insane'>🚀 Insane (Master)</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-2">Choose your preferred game difficulty level</p>
                </div>

                {/* Grid Size Setting */}
                <div className="animate-slide-in-left animate-delay-3">
                  <label className='block text-lg font-medium mb-3 text-neon-cyan'>
                    Grid Size
                  </label>
                  <select className='form-select w-full text-lg'>
                    <option value='small'>📱 Small (15x15) - Mobile Friendly</option>
                    <option value='medium' selected>💻 Medium (20x20) - Balanced</option>
                    <option value='large'>🖥️ Large (25x25) - Desktop</option>
                    <option value='xl'>📺 Extra Large (30x30) - Pro</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-2">Larger grids provide more space but increased challenge</p>
                </div>

                {/* Theme Setting */}
                <div className="animate-slide-in-left animate-delay-4">
                  <label className='block text-lg font-medium mb-3 text-neon-cyan'>
                    Visual Theme
                  </label>
                  <select className='form-select w-full text-lg'>
                    <option value='neon' selected>✨ Neon Retro (Current)</option>
                    <option value='classic'>🎯 Classic Green</option>
                    <option value='cyberpunk'>🌃 Cyberpunk</option>
                    <option value='matrix'>💚 Matrix Style</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-2">Choose your preferred visual style</p>
                </div>
              </div>
            </div>

            {/* Audio & Effects */}
            <div className="game-card p-6 animate-scale-in animate-delay-2">
              <h2 className="text-2xl font-bold text-neon-pink mb-6 flex items-center">
                <span className="mr-3 animate-neon-pulse">🔊</span>
                Audio & Effects
              </h2>
              
              <div className='space-y-4'>
                {/* Sound Setting */}
                <div className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/10 hover-glow animate-slide-in-right animate-delay-3">
                  <div>
                    <label className='flex items-center space-x-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='form-checkbox'
                        defaultChecked
                      />
                      <div>
                        <span className='text-lg font-medium text-white'>🎵 Enable Sound Effects</span>
                        <p className="text-sm text-gray-400">Play sounds for eating, game over, and achievements</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Music Setting */}
                <div className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/10 hover-glow animate-slide-in-right animate-delay-4">
                  <div>
                    <label className='flex items-center space-x-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='form-checkbox'
                        defaultChecked
                      />
                      <div>
                        <span className='text-lg font-medium text-white'>🎶 Background Music</span>
                        <p className="text-sm text-gray-400">Play retro-style background music during gameplay</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Vibration Setting */}
                <div className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/10 hover-glow animate-slide-in-right animate-delay-5">
                  <div>
                    <label className='flex items-center space-x-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='form-checkbox'
                        defaultChecked
                      />
                      <div>
                        <span className='text-lg font-medium text-white'>📳 Haptic Feedback (Mobile)</span>
                        <p className="text-sm text-gray-400">Vibrate on game events for mobile devices</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Guide */}
            <div className="game-card p-6 animate-scale-in animate-delay-3">
              <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center">
                <span className="mr-3 animate-neon-pulse">⌨️</span>
                Controls Reference
              </h2>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-neon-green mb-3">Movement</h4>
                  <div className='space-y-2 text-sm text-gray-300'>
                    <div className="flex items-center justify-between">
                      <span>Move Up</span>
                      <div className="flex gap-1">
                        <kbd className='control-key'>↑</kbd>
                        <kbd className='control-key'>W</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Move Down</span>
                      <div className="flex gap-1">
                        <kbd className='control-key'>↓</kbd>
                        <kbd className='control-key'>S</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Move Left</span>
                      <div className="flex gap-1">
                        <kbd className='control-key'>←</kbd>
                        <kbd className='control-key'>A</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Move Right</span>
                      <div className="flex gap-1">
                        <kbd className='control-key'>→</kbd>
                        <kbd className='control-key'>D</kbd>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-neon-green mb-3">Game Actions</h4>
                  <div className='space-y-2 text-sm text-gray-300'>
                    <div className="flex items-center justify-between">
                      <span>Pause/Resume</span>
                      <kbd className='control-key'>Space</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Restart Game</span>
                      <kbd className='control-key'>R</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Main Menu</span>
                      <kbd className='control-key'>Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mute Sounds</span>
                      <kbd className='control-key'>M</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Tips */}
            <div className="game-card p-6 animate-scale-in animate-delay-4">
              <h2 className="text-2xl font-bold text-neon-yellow mb-6 flex items-center">
                <span className="mr-3 animate-neon-pulse">💡</span>
                Pro Tips
              </h2>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <ul className='space-y-3 text-sm text-gray-300'>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-green">•</span>
                    <span>Plan your path ahead to avoid getting trapped</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-green">•</span>
                    <span>Use the edges of the board strategically</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-green">•</span>
                    <span>The snake speeds up as it grows longer</span>
                  </li>
                </ul>
                <ul className='space-y-3 text-sm text-gray-300'>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-cyan">•</span>
                    <span>Special food items give bonus points</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-cyan">•</span>
                    <span>Combo sequences multiply your score</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-neon-cyan">•</span>
                    <span>Practice makes perfect - keep trying!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className='mt-8 text-center animate-fade-in animate-delay-5'>
            <button className='btn-primary text-xl px-12 py-4'>
              💾 Save Settings
            </button>
            <p className="text-sm text-gray-400 mt-3">
              Settings are automatically saved to your browser
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
