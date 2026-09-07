// Application-wide constants

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// -------------------------------------------------------------------------
// Route paths
// -------------------------------------------------------------------------
export const ROUTES = {
  // Auth
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Main
  HOME:       '/',
  QUESTIONS:  '/questions',
  DISCUSSIONS:'/discussions',
  TAGS:       '/tags',
  TAG:        (slug: string) => `/tags/${slug}`,

  // Posts
  POST:        (id: string) => `/posts/${id}`,
  POST_CREATE: '/posts/create',
  POST_EDIT:   (id: string) => `/posts/${id}/edit`,

  // Profile
  PROFILE:          '/profile',
  PROFILE_SETTINGS: '/profile/settings',
  USER_PROFILE:     (username: string) => `/users/${username}`,
} as const;

// -------------------------------------------------------------------------
// Pagination
// -------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 15;
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;

// -------------------------------------------------------------------------
// Discussion filters
// -------------------------------------------------------------------------
export const SORT_OPTIONS = [
  { value: 'newest',        label: 'Newest' },
  { value: 'oldest',        label: 'Oldest' },
  { value: 'most_votes',    label: 'Most Votes' },
  { value: 'most_comments', label: 'Most Answers' },
] as const;

export const POST_TYPE_OPTIONS = [
  { value: '',           label: 'All Posts' },
  { value: 'question',   label: 'Questions' },
  { value: 'discussion', label: 'Discussions' },
] as const;

export const POST_STATUS_OPTIONS = [
  { value: '',         label: 'All Statuses' },
  { value: 'open',     label: 'Open' },
  { value: 'solved',   label: 'Solved' },
  { value: 'closed',   label: 'Closed' },
] as const;

// -------------------------------------------------------------------------
// User roles
// -------------------------------------------------------------------------
export const ROLE_LABELS: Record<string, string> = {
  student:   'Student',
  teacher:   'Faculty',
  moderator: 'Moderator',
  admin:     'Admin',
};

// -------------------------------------------------------------------------
// Local storage / cookie keys
// -------------------------------------------------------------------------
export const TOKEN_KEY         = 'sn_access_token';
export const REFRESH_TOKEN_KEY = 'sn_refresh_token';

// -------------------------------------------------------------------------
// Misc
// -------------------------------------------------------------------------
export const SITE_NAME        = 'AcaSocial';
export const SITE_DESCRIPTION = 'Mạng xã hội học thuật dành cho sinh viên và giảng viên.';
export const MAX_TITLE_LENGTH = 300;
export const MAX_TAG_COUNT    = 5;
export const MIN_TAG_COUNT    = 1;
