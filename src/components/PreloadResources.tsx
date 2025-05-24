import React, { useEffect } from 'react';

/**
 * Component to preload critical resources for better performance
 * This component doesn't render anything visible but preloads important resources
 */
const PreloadResources: React.FC = () => {
  useEffect(() => {
    // Preload critical images
    const preloadImages = [
      // Logo
      'https://i.postimg.cc/ZKt1RKQB/Toiral-croped-1-removebg-preview.png',
      // Favicon
      'https://i.postimg.cc/MpyY0sQY/Profile-picture-8-removebg-preview.png'
    ];

    preloadImages.forEach(imageUrl => {
      const img = new Image();
      img.src = imageUrl;
    });

    // Preload Firebase connection
    const preconnectUrls = [
      'https://toiral-taskboard-default-rtdb.asia-southeast1.firebasedatabase.app',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical fonts
    const preloadFonts = [
      'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    preloadFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = fontUrl;
      document.head.appendChild(link);

      // Also load the font
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = fontUrl;
      document.head.appendChild(fontLink);
    });

    // Clean up function
    return () => {
      // Remove any elements we added if component unmounts
      document.querySelectorAll('link[rel="preconnect"], link[rel="preload"]').forEach(el => {
        if (el.parentNode === document.head) {
          document.head.removeChild(el);
        }
      });
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default PreloadResources;
