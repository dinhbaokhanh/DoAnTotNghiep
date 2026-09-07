import { apiGet, apiPatch, apiPost, apiDelete } from './client'
import type {
  User,
  UpdateProfilePayload,
  UpdateAvatarPayload,
  ChangePasswordPayload,
  UpdatePrivacyPayload,
  RequestChangeEmailPayload,
  ConfirmChangeEmailPayload,
} from '@/types'

export const usersApi = {
  getMe: () => apiGet<User>('/api/users/me', true),

  updateProfile: (data: UpdateProfilePayload) =>
    apiPatch<User>('/api/users/me/profile', data),

  updateAvatar: (data: UpdateAvatarPayload) =>
    apiPatch<User>('/api/users/me/avatar', data),

  changePassword: (data: ChangePasswordPayload) =>
    apiPatch<{ message: string }>('/api/users/me/change-password', data),

  updatePrivacy: (data: UpdatePrivacyPayload) =>
    apiPatch<User>('/api/users/me/privacy', data),

  requestChangeEmail: (data: RequestChangeEmailPayload) =>
    apiPost<{ message: string }>(
      '/api/users/me/change-email/request',
      data,
      true
    ),

  confirmChangeEmail: (data: ConfirmChangeEmailPayload) =>
    apiPost<{ message: string }>(
      '/api/users/me/change-email/confirm',
      data,
      true
    ),

  deleteAccount: () => apiDelete<{ message: string }>('/api/users/me'),
}
