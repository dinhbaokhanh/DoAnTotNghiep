import { apiGet } from './client';
import type { Tag, PaginatedResponse } from '@/types';

export const tagsApi = {
  list: (page = 1, limit = 50, search?: string) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) q.set('search', search);
    return apiGet<PaginatedResponse<Tag>>(`/api/tags?${q.toString()}`);
  },

  get: (id: string) => apiGet<Tag>(`/api/tags/${id}`),
};
