import Image from 'next/image';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  /** Fallback initials (e.g. "JD" from "John Doe") */
  initials?: string;
  className?: string;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs:  24,
  sm:  32,
  md:  40,
  lg:  48,
  xl:  64,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ src, alt, size = 'md', initials, className }: AvatarProps) {
  const px = SIZE_PX[size];
  const fallback = initials ?? getInitials(alt);

  return (
    <span
      className={[styles.avatar, styles[size], className ?? ''].filter(Boolean).join(' ')}
      style={{ width: px, height: px } as React.CSSProperties}
      aria-label={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className={styles.img}
          unoptimized={src.startsWith('http')}
        />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {fallback}
        </span>
      )}
    </span>
  );
}
