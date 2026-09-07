import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Feed } from '../_components/Feed';
import { LoadingState } from '@/components/shared/LoadingState';

export const metadata: Metadata = {
  title: 'Discussions',
  description: 'Academic discussions and open-ended conversations.',
};

export default function DiscussionsPage() {
  return (
    <Suspense fallback={<LoadingState variant="feed" count={8} />}>
      <Feed
        fixedPostType="discussion"
        title="Discussions"
        description="Open-ended academic conversations and knowledge exchange."
      />
    </Suspense>
  );
}
