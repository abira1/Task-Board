import React, { useState } from 'react';
import { UserIcon } from 'lucide-react';

interface AvatarProps {
  src: string | undefined;
  alt: string | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Log the src prop for debugging
  console.log(`Avatar rendering for ${alt} with src:`, src);

  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', src);
    console.error('Image error event:', e);
    setImageError(true);
  };

  // If image fails to load or src is undefined, show fallback
  if (imageError || !src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[#f5f0e8] flex items-center justify-center ${className}`}>
        <UserIcon className="text-[#7a7067] w-1/2 h-1/2" />
      </div>
    );
  }

  // Otherwise show the image
  return (
    <img
      src={src}
      alt={alt || 'User'}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      onError={handleImageError}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
};

export default Avatar;
