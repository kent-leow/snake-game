import type { Metadata } from 'next';
import { GamePage } from './GamePage';

export const metadata: Metadata = {
  title: 'Snake Game - Play',
  description: 'Play the classic Snake game',
};

export default function Page(): React.JSX.Element {
  return <GamePage />;
}
