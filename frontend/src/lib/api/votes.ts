import { apiPost, apiDelete } from './client';
import type { CastVotePayload, TargetType } from '@/types';

export const votesApi = {
  castVote: (targetType: TargetType, targetId: string, data: CastVotePayload) => {
    const path =
      targetType === 'discussion'
        ? `/api/discussions/${targetId}/vote`
        : `/api/comments/${targetId}/vote`;
    return apiPost<{ message: string }>(path, data, true);
  },

  removeVote: (targetType: TargetType, targetId: string) => {
    const path =
      targetType === 'discussion'
        ? `/api/discussions/${targetId}/vote`
        : `/api/comments/${targetId}/vote`;
    return apiDelete<{ message: string }>(path);
  },
};
