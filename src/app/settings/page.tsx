import type { Metadata } from 'next';
import PageLayout from '../../components/ui/PageLayout';

export const metadata: Metadata = {
  title: 'Snake Game - Settings',
  description: 'Configure game settings and preferences',
};

export default function SettingsPage(): React.JSX.Element {
  return (
    <PageLayout title='Settings' showBackButton={true} scrollable={true}>
      <div className='settings-content'>
        {/* Animated background elements */}
        <div className="settings-bg-element settings-bg-1"></div>
        <div className="settings-bg-element settings-bg-2"></div>
        
        <div className='settings-container'>
          {/* Page Header */}
          <div className="settings-header">
            <h1 className="settings-title">
              <span className="text-neon-orange">⚙️</span>
              <span className="text-neon-purple">Game Settings</span>
            </h1>
            <p className="settings-subtitle">
              Customize your gaming experience
            </p>
          </div>

          {/* Settings Panels */}
          <div className="settings-panels">
            {/* Game Configuration */}
            <div className="settings-card">
              <h2 className="settings-section-title text-neon-green">
                <span className="settings-icon">🎮</span>
                Game Configuration
              </h2>
              
              <div className='settings-group'>
                {/* Game Speed Setting */}
                <div className="setting-item">
                  <label className='setting-label text-neon-cyan'>
                    Game Speed
                  </label>
                  <select className='form-select'>
                    <option value='slow'>🐌 Slow (Beginner)</option>
                    <option value='normal' selected>🚶 Normal (Standard)</option>
                    <option value='fast'>🏃 Fast (Expert)</option>
                    <option value='insane'>🚀 Insane (Master)</option>
                  </select>
                  <p className="setting-description">Choose your preferred game difficulty level</p>
                </div>

                {/* Grid Size Setting */}
                <div className="setting-item">
                  <label className='setting-label text-neon-cyan'>
                    Grid Size
                  </label>
                  <select className='form-select'>
                    <option value='small'>📱 Small (15x15) - Mobile Friendly</option>
                    <option value='medium' selected>💻 Medium (20x20) - Balanced</option>
                    <option value='large'>🖥️ Large (25x25) - Desktop</option>
                    <option value='xl'>📺 Extra Large (30x30) - Pro</option>
                  </select>
                  <p className="setting-description">Larger grids provide more space but increased challenge</p>
                </div>

                {/* Theme Setting */}
                <div className="setting-item">
                  <label className='setting-label text-neon-cyan'>
                    Visual Theme
                  </label>
                  <select className='form-select'>
                    <option value='neon' selected>✨ Neon Retro (Current)</option>
                    <option value='classic'>🎯 Classic Green</option>
                    <option value='cyberpunk'>🌃 Cyberpunk</option>
                    <option value='matrix'>💚 Matrix Style</option>
                  </select>
                  <p className="setting-description">Choose your preferred visual style</p>
                </div>
              </div>
            </div>

            {/* Audio & Effects */}
            <div className="settings-card">
              <h2 className="settings-section-title text-neon-pink">
                <span className="settings-icon">🔊</span>
                Audio & Effects
              </h2>
              
              <div className='settings-group'>
                {/* Sound Setting */}
                <div className="setting-toggle">
                  <label className='setting-toggle-label'>
                    <input
                      type='checkbox'
                      className='form-checkbox'
                      defaultChecked
                    />
                    <div>
                      <span className='setting-toggle-title'>🎵 Enable Sound Effects</span>
                      <p className="setting-description">Play sounds for eating, game over, and achievements</p>
                    </div>
                  </label>
                </div>

                {/* Music Setting */}
                <div className="setting-toggle">
                  <label className='setting-toggle-label'>
                    <input
                      type='checkbox'
                      className='form-checkbox'
                      defaultChecked
                    />
                    <div>
                      <span className='setting-toggle-title'>🎶 Background Music</span>
                      <p className="setting-description">Play retro-style background music during gameplay</p>
                    </div>
                  </label>
                </div>

                {/* Vibration Setting */}
                <div className="setting-toggle">
                  <label className='setting-toggle-label'>
                    <input
                      type='checkbox'
                      className='form-checkbox'
                      defaultChecked
                    />
                    <div>
                      <span className='setting-toggle-title'>📳 Haptic Feedback (Mobile)</span>
                      <p className="setting-description">Vibrate on game events for mobile devices</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Controls Guide */}
            <div className="settings-card">
              <h2 className="settings-section-title text-neon-cyan">
                <span className="settings-icon">⌨️</span>
                Controls Reference
              </h2>
              
              <div className='controls-grid'>
                <div className="controls-column">
                  <h4 className="controls-heading text-neon-green">Movement</h4>
                  <div className='controls-list'>
                    <div className="control-row">
                      <span>Move Up</span>
                      <div className="control-keys">
                        <kbd className='control-key'>↑</kbd>
                        <kbd className='control-key'>W</kbd>
                      </div>
                    </div>
                    <div className="control-row">
                      <span>Move Down</span>
                      <div className="control-keys">
                        <kbd className='control-key'>↓</kbd>
                        <kbd className='control-key'>S</kbd>
                      </div>
                    </div>
                    <div className="control-row">
                      <span>Move Left</span>
                      <div className="control-keys">
                        <kbd className='control-key'>←</kbd>
                        <kbd className='control-key'>A</kbd>
                      </div>
                    </div>
                    <div className="control-row">
                      <span>Move Right</span>
                      <div className="control-keys">
                        <kbd className='control-key'>→</kbd>
                        <kbd className='control-key'>D</kbd>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="controls-column">
                  <h4 className="controls-heading text-neon-green">Game Actions</h4>
                  <div className='controls-list'>
                    <div className="control-row">
                      <span>Pause/Resume</span>
                      <kbd className='control-key'>Space</kbd>
                    </div>
                    <div className="control-row">
                      <span>Restart Game</span>
                      <kbd className='control-key'>R</kbd>
                    </div>
                    <div className="control-row">
                      <span>Main Menu</span>
                      <kbd className='control-key'>Esc</kbd>
                    </div>
                    <div className="control-row">
                      <span>Mute Sounds</span>
                      <kbd className='control-key'>M</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Tips */}
            <div className="settings-card">
              <h2 className="settings-section-title text-neon-yellow">
                <span className="settings-icon">💡</span>
                Pro Tips
              </h2>
              
              <div className='tips-grid'>
                <ul className='tips-list'>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-green">•</span>
                    <span>Plan your path ahead to avoid getting trapped</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-green">•</span>
                    <span>Use the edges of the board strategically</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-green">•</span>
                    <span>The snake speeds up as it grows longer</span>
                  </li>
                </ul>
                <ul className='tips-list'>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-cyan">•</span>
                    <span>Special food items give bonus points</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-cyan">•</span>
                    <span>Combo sequences multiply your score</span>
                  </li>
                  <li className="tip-item">
                    <span className="tip-bullet text-neon-cyan">•</span>
                    <span>Practice makes perfect - keep trying!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className='settings-save'>
            <button className='btn-primary settings-save-btn'>
              💾 Save Settings
            </button>
            <p className="settings-save-note">
              Settings are automatically saved to your browser
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
