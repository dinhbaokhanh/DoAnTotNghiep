import { apiPost } from './client';
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OtpRequest,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiPost<AuthTokens>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    apiPost<{ message: string }>('/api/auth/register', data),

  verifyOtp: (data: OtpRequest) =>
    apiPost<{ message: string }>('/api/auth/verify-otp', data),

  resendOtp: (email: string) =>
    apiPost<{ message: string }>('/api/auth/resend-otp', { email }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiPost<{ message: string }>('/api/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiPost<{ message: string }>('/api/auth/reset-password', data),

  logout: () =>
    apiPost<{ message: string }>('/api/auth/logout', {}, true),

  refresh: (refreshToken: string) =>
    apiPost<AuthTokens>('/api/auth/refresh', { refreshToken }),
};
