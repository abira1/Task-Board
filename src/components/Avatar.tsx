import React, { useState, useEffect } from 'react';
import { UserIcon } from 'lucide-react';

interface AvatarProps {
  src: string | undefined;
  alt: string | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  fallbackBgColor?: 'default' | 'primary' | 'secondary' | 'tertiary';
  debug?: boolean; // Enable debug mode to log avatar loading issues
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  className = '',
  fallbackBgColor = 'default',
  debug = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processedSrc, setProcessedSrc] = useState<string | undefined>(src);

  // Process the source URL to handle Google profile pictures correctly
  useEffect(() => {
    if (!src) {
      setProcessedSrc(undefined);
      if (debug) console.log(`Avatar for ${alt}: No source URL provided`);
      return;
    }

    if (debug) console.log(`Avatar for ${alt}: Original src: ${src}`);

    // Handle Google profile pictures that might have size restrictions
    if (src.includes('googleusercontent.com')) {
      // Remove any size restrictions and ensure we get the full-size image
      const googleSrc = src.replace(/=s\d+-c/, '=s256-c');
      setProcessedSrc(googleSrc);
      if (debug) console.log(`Avatar for ${alt}: Processed Google src: ${googleSrc}`);
    } else {
      setProcessedSrc(src);
    }

    // Reset error state when src changes
    setImageError(false);
    setIsLoading(true);
  }, [src, alt, debug]);

  // Size mapping
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const handleImageError = () => {
    if (debug) console.log(`Avatar image error for ${alt}: ${processedSrc}`);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    if (debug) console.log(`Avatar image loaded successfully for ${alt}: ${processedSrc}`);
    setIsLoading(false);
  };

  // Generate initials for fallback
  const getInitials = () => {
    if (!alt || alt === 'User') return '';

    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get background color class based on fallbackBgColor prop
  const getBgColorClass = () => {
    switch (fallbackBgColor) {
      case 'primary':
        return 'bg-[#d4a5a5]';
      case 'secondary':
        return 'bg-[#7a7067]';
      case 'tertiary':
        return 'bg-[#3a3226]';
      case 'default':
      default:
        return 'bg-[#f5f0e8]';
    }
  };

  // Get text color class based on fallbackBgColor prop
  const getTextColorClass = () => {
    switch (fallbackBgColor) {
      case 'primary':
      case 'secondary':
      case 'tertiary':
        return 'text-white';
      case 'default':
      default:
        return 'text-[#3a3226]';
    }
  };

  // If image fails to load or src is undefined, show fallback
  if (imageError || !processedSrc) {
    const initials = getInitials();
    const bgColorClass = getBgColorClass();
    const textColorClass = getTextColorClass();

    return (
      <div
        className={`${sizeClasses[size]} rounded-full ${bgColorClass} flex items-center justify-center ${className}`}
        title={alt}
      >
        {initials ? (
          <span className={`${textColorClass} font-medium text-xs`}>
            {initials}
          </span>
        ) : (
          <UserIcon className={`${fallbackBgColor === 'default' ? 'text-[#7a7067]' : 'text-white opacity-80'} w-1/2 h-1/2`} />
        )}
      </div>
    );
  }

  // Otherwise show the image
  const bgColorClass = getBgColorClass();

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className} relative`}>
      {isLoading && (
        <div className={`absolute inset-0 ${bgColorClass} flex items-center justify-center`}>
          <div className="w-1/2 h-1/2 rounded-full border-2 border-[#d4a5a5] border-t-transparent animate-spin"></div>
        </div>
      )}
      <img
        src={processedSrc}
        alt={alt || 'User'}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Avatar;
