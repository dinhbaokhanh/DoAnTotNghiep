import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { Comment, PaginatedResponse, CreateCommentPayload } from '@/types';

export const commentsApi = {
  list: (discussionId: string, page = 1, limit = 20) =>
    apiGet<PaginatedResponse<Comment>>(
      `/api/discussions/${discussionId}/comments?page=${page}&limit=${limit}`,
    ),

  create: (discussionId: string, data: CreateCommentPayload) =>
    apiPost<Comment>(`/api/discussions/${discussionId}/comments`, data, true),

  update: (commentId: string, data: { content: string }) =>
    apiPatch<Comment>(`/api/comments/${commentId}`, data),

  remove: (commentId: string) =>
    apiDelete<{ message: string }>(`/api/comments/${commentId}`),
};
