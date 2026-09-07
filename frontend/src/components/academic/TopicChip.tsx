import Link from 'next/link';
import type { Tag } from '@/types';
import { ROUTES } from '@/lib/constants';
import styles from './TopicChip.module.css';

interface TopicChipProps {
  tag: Tag;
  /** 'link' renders as an anchor to the tag page; 'static' is non-interactive */
  variant?: 'link' | 'static';
  size?: 'sm' | 'md';
}

export function TopicChip({ tag, variant = 'link', size = 'md' }: TopicChipProps) {
  const className = [styles.chip, styles[size]].filter(Boolean).join(' ');

  if (variant === 'link') {
    return (
      <Link href={ROUTES.TAG(tag.slug)} className={className}>
        {tag.name}
      </Link>
    );
  }
  return <span className={className}>{tag.name}</span>;
}
