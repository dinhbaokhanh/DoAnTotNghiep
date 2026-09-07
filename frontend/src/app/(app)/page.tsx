import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Feed } from './_components/Feed';
import { LoadingState } from '@/components/shared/LoadingState';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Knowledge Feed — ${SITE_NAME}`,
  description: 'Browse questions and discussions from the academic community.',
};

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState variant="feed" count={8} />}>
      <Feed
        title="Knowledge Feed"
        description="Questions and discussions from the academic community."
      />
    </Suspense>
  );
}
