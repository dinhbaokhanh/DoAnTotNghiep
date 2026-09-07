import type { ReactNode } from 'react';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Use 'narrow' for content-only pages like auth flows, post detail */
  width?: 'default' | 'narrow' | 'full';
}

export function PageContainer({ children, className, width = 'default' }: PageContainerProps) {
  return (
    <div className={[styles.container, styles[width], className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
