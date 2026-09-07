import type { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/lib/constants';

interface FacultyBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

const FACULTY_ICON = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M5 1l1.5 3H9L6.5 5.5l1 3L5 7l-2.5 1.5 1-3L1 4h2.5L5 1z" fill="currentColor" />
  </svg>
);

/** Renders a role badge — only Faculty/Moderator/Admin get the special indigo badge */
export function FacultyBadge({ role, size = 'sm' }: FacultyBadgeProps) {
  if (role === 'student') return null;

  const variant =
    role === 'teacher' || role === 'admin' || role === 'moderator' ? 'faculty' : 'default';

  return (
    <Badge variant={variant} size={size} icon={role === 'teacher' ? FACULTY_ICON : undefined}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
