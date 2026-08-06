import React from 'react';
import styles from './PlaceholderImage.module.css';

export interface PlaceholderImageProps {
  src?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  className?: string;
  label?: string; // Text to show if no src
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  src,
  alt,
  width = '100%',
  height = '100%',
  aspectRatio,
  className = '',
  label = 'Asset Pending',
}) => {
  const containerStyle = aspectRatio ? { aspectRatio } : { width, height };

  if (!src) {
    return (
      <div 
        className={`${styles.placeholder} ${className}`} 
        style={containerStyle}
        role="img"
        aria-label={alt}
      >
        <span>{label}</span>
      </div>
    );
  }

  // Once real assets are injected, this will render actual images.
  // We recommend using next/image directly in the Next.js app for production,
  // but for UI components this serves as a reusable foundation.
  return (
    <div className={`${styles.imageWrapper} ${className}`} style={containerStyle}>
      <img src={src} alt={alt} className={styles.image} loading="lazy" />
    </div>
  );
};
