import type { Metadata } from 'next';
import { PageLayout } from '@/components';

export const metadata: Metadata = {
  title: 'Snake Game - Settings',
  description: 'Configure game settings and preferences',
};

export default function SettingsPage(): React.JSX.Element {
  return (
    <PageLayout title='Settings' showBackButton={true}>
      <div className='max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg'>
        <div className='p-6'>
          <div className='space-y-6'>
            {/* Game Speed Setting */}
            <div>
              <label className='block text-sm font-medium mb-2'>
                Game Speed
              </label>
              <select className='w-full bg-gray-700 border border-gray-600 rounded px-3 py-2'>
                <option value='slow'>Slow</option>
                <option value='normal'>Normal</option>
                <option value='fast'>Fast</option>
              </select>
            </div>

            {/* Grid Size Setting */}
            <div>
              <label className='block text-sm font-medium mb-2'>
                Grid Size
              </label>
              <select className='w-full bg-gray-700 border border-gray-600 rounded px-3 py-2'>
                <option value='small'>Small (15x15)</option>
                <option value='medium'>Medium (20x20)</option>
                <option value='large'>Large (25x25)</option>
              </select>
            </div>

            {/* Sound Setting */}
            <div>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded'
                  defaultChecked
                />
                <span className='text-sm font-medium'>Enable Sound</span>
              </label>
            </div>

            {/* Controls Help */}
            <div>
              <h3 className='text-lg font-semibold mb-3'>Controls</h3>
              <div className='text-sm text-gray-300 space-y-1'>
                <div>↑ Arrow Key - Move Up</div>
                <div>↓ Arrow Key - Move Down</div>
                <div>← Arrow Key - Move Left</div>
                <div>→ Arrow Key - Move Right</div>
                <div>Space - Pause/Resume</div>
              </div>
            </div>
          </div>
        </div>
        <div className='px-6 py-4 bg-gray-700'>
          <button className='w-full bg-green-600 hover:bg-green-700 py-2 rounded'>
            Save Settings
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
