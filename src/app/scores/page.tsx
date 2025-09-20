'use client';

import React from 'react';
import { PageLayout } from '@/components';
import { HighScoreTable } from '@/components/HighScoreTable';
import { useHighScores } from '@/hooks/useHighScores';

export default function ScoresPage(): React.JSX.Element {
  const { scores, loading, error, refetch } = useHighScores({
    limit: 10,
    sortBy: 'score',
    order: 'desc',
    autoFetch: true,
    timeout: 3000, // 3 second timeout to meet performance requirement
  });

  return (
    <PageLayout title='High Scores' showBackButton={true}>
      <div className='flex-1 overflow-auto p-6'>
        <div className='max-w-4xl mx-auto'>
          <HighScoreTable
            scores={scores}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </div>
      </div>
    </PageLayout>
  );
}
