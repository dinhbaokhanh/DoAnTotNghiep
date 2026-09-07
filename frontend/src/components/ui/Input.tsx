import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  /** Provide a unique id — falls back to label-derived id */
  id: string;
}

export function Input({
  label,
  error,
  hint,
  prefixIcon,
  suffixIcon,
  id,
  className,
  ...props
}: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {props.required && <span className={styles.required} aria-hidden>*</span>}
        </label>
      )}
      <div className={[styles.inputRow, error ? styles.hasError : ''].filter(Boolean).join(' ')}>
        {prefixIcon && (
          <span className={styles.prefixIcon} aria-hidden="true">{prefixIcon}</span>
        )}
        <input
          id={id}
          className={[
            styles.input,
            prefixIcon ? styles.withPrefix : '',
            suffixIcon ? styles.withSuffix : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {suffixIcon && (
          <span className={styles.suffixIcon} aria-hidden="true">{suffixIcon}</span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
