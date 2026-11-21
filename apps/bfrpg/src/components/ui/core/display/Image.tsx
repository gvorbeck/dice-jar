import { forwardRef, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import './Image.css';

type ImageVariant = 'logo' | 'avatar' | 'standard';
type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  src: string;
  alt: string;
  variant?: ImageVariant;
  size?: ImageSize;
  fallback?: string | React.ReactElement;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Image component with consistent loading, error handling, and styling patterns.
 *
 * @example
 * // Logo image with eager loading
 * <Image variant="logo" src="/logo.png" alt="App logo" />
 *
 * @example
 * // Avatar with fallback initials
 * <Image variant="avatar" size="md" src={url} alt="User" fallback="JD" />
 *
 * @example
 * // Standard image with lazy loading
 * <Image src={url} alt="Description" loading="lazy" />
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, variant = 'standard', size, fallback, onError, className, loading, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    // Handle image load errors
    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      onError?.(e);
    };

    // Variant-specific default loading strategy
    const defaultLoading = variant === 'logo' ? 'eager' : 'lazy';
    const imageLoading = loading ?? defaultLoading;

    // Show fallback if error occurred and fallback is provided
    if (hasError && fallback) {
      // If fallback is a string (e.g., initials), render as text
      if (typeof fallback === 'string') {
        return (
          <div className={cn('img-fallback', className)} data-variant={variant} data-size={size} aria-label={alt}>
            <span aria-hidden="true">{fallback}</span>
          </div>
        );
      }

      // If fallback is a React node, render it directly
      return <>{fallback}</>;
    }

    // Hide image if error and no fallback
    if (hasError) {
      return null;
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={imageLoading}
        onError={handleError}
        className={cn('img', className)}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    );
  },
);

Image.displayName = 'Image';

export default Image;
