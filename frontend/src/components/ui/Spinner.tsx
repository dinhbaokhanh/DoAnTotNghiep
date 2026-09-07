import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Loading…', className }: SpinnerProps) {
  return (
    <span
      className={[styles.spinner, styles[size], className ?? ''].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    >
      <span className={styles.ring} aria-hidden="true" />
    </span>
  );
}
