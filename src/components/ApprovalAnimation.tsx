import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';

// This component uses lottie-web directly instead of lottie-react
const ApprovalAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (containerRef.current) {
      setIsLoading(true);
      setHasError(false);

      // Load the animation directly from the public directory
      fetch('/Animation - 1747241696124.json')
        .then(response => response.json())
        .then(animationData => {
          if (!isMounted) return;

          // Clean up previous animation if it exists
          if (animationRef.current) {
            animationRef.current.destroy();
          }

          // Create new animation with optimized settings
          animationRef.current = lottie.loadAnimation({
            container: containerRef.current!,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid slice',
              progressiveLoad: true,
              hideOnTransparent: true,
              className: 'lottie-svg',
              viewBoxOnly: true // Improves performance
            }
          });

          // Set animation speed slightly faster for better UX
          animationRef.current.setSpeed(1.1);

          // Add event listeners
          animationRef.current.addEventListener('DOMLoaded', () => {
            if (isMounted) setIsLoading(false);
          });

          // Handle resize for responsiveness
          const handleResize = () => {
            if (animationRef.current) {
              animationRef.current.resize();
            }
          };

          window.addEventListener('resize', handleResize);

          return () => {
            window.removeEventListener('resize', handleResize);
          };
        })
        .catch(error => {
          console.error('Failed to load animation:', error);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        });
    }

    // Clean up animation on unmount
    return () => {
      isMounted = false;
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isLoading && (
        <div className="text-[#d4a5a5] text-xs">Loading...</div>
      )}

      <div
        ref={containerRef}
        className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transition: 'opacity 0.2s ease',
          minHeight: '100%',
          maxHeight: '100%',
          transform: 'scale(1.15)', // Slightly larger scale for better visibility
          transformOrigin: 'center center'
        }}
      ></div>

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
            alt="Toiral Task Board"
            className="h-12 opacity-70"
          />
        </div>
      )}
    </div>
  );
};

export default ApprovalAnimation;
