import { apiFetch } from './client';
import { API_BASE_URL } from '@/lib/constants';
import { getAccessToken } from './client';

export interface MediaUploadResponse {
  id: string;
  secureUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export const mediaApi = {
  upload: async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'image');

    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(err.message ?? 'Upload failed');
    }
    return res.json();
  },

  delete: (id: string) => apiFetch<{ message: string }>(`/api/media/${id}`, { method: 'DELETE', auth: true }),
};
