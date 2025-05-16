import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, DownloadIcon } from 'lucide-react';
import lottie from 'lottie-web';
import {
  detectOperatingSystem,
  OperatingSystem,
  supportsPwaInstallation,
  isAppInstalledAsPwa
} from '../utils/platformDetection';
import { downloadShortcutFile } from '../utils/shortcutGenerator';
import InstallationModal from '../components/InstallationModal';

const DownloadPage: React.FC = () => {
  const animationContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Installation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedOS, setDetectedOS] = useState<OperatingSystem>('unknown');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Load animation
  useEffect(() => {
    let isMounted = true;

    if (animationContainerRef.current) {
      setIsLoading(true);
      setHasError(false);

      // Load the animation directly from the project root
      fetch('/Animation - 1747324007624.json')
        .then(response => response.json())
        .then(animationData => {
          if (!isMounted) return;

          // Clean up previous animation if it exists
          if (animationRef.current) {
            animationRef.current.destroy();
          }

          // Create new animation with optimized settings
          animationRef.current = lottie.loadAnimation({
            container: animationContainerRef.current!,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid slice',
              progressiveLoad: true,
              hideOnTransparent: true,
              className: 'lottie-svg',
              viewBoxOnly: true
            }
          });

          // Set animation speed
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

  // Detect operating system and check if the app is installable
  useEffect(() => {
    // Detect the user's operating system
    const os = detectOperatingSystem();
    setDetectedOS(os);

    // Check if the app is already installed as a PWA
    if (isAppInstalledAsPwa()) {
      setIsInstallable(false);
      return;
    }

    // Check if the browser supports PWA installation
    const supportsInstallation = supportsPwaInstallation();

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Only add the event listener if the browser supports installation
    if (supportsInstallation) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      if (supportsInstallation) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  // Handle download of shortcut file
  const handleDownloadShortcut = async () => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    setDownloadError(null);

    try {
      await downloadShortcutFile(detectedOS);
      setDownloadSuccess(true);
    } catch (error) {
      console.error('Error downloading shortcut:', error);
      setDownloadError('Failed to download shortcut file. Please try again.');
      setDownloadSuccess(false);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle install button click
  const handleInstall = async () => {
    // If we have a deferred prompt, try to use it for native installation
    if (deferredPrompt) {
      try {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We no longer need the prompt regardless of outcome
        setDeferredPrompt(null);

        if (outcome === 'accepted') {
          setIsInstallable(false);
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
        // Fall back to the modal approach
        setIsModalOpen(true);
      }
    } else {
      // If native installation isn't available, show the modal with instructions
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <img
          src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
          alt="Toiral Task Board"
          className="h-8 md:h-10"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-8">
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center">
          {/* Animation Section */}
          <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-96 mb-8 md:mb-0">
            {isLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#d4a5a5] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div
              ref={animationContainerRef}
              className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              style={{ transition: 'opacity 0.3s ease' }}
            ></div>
            {hasError && (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
                  alt="Toiral Task Board"
                  className="h-16 opacity-70"
                />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="w-full md:w-1/2 text-center md:text-left md:pl-8 lg:pl-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3a3226] mb-4">
              Download the Toiral Task Board App
            </h1>
            <p className="text-[#7a7067] mb-6 max-w-lg mx-auto md:mx-0">
              No matter where you are, Toiral Taskboard helps you stay organized, connected, and in control
              of everything that matters — from tracking client tasks to managing leads and planning big
              events.
            </p>
            <p className="text-[#7a7067] mb-8 max-w-lg mx-auto md:mx-0">
              Whether you're at a café meeting a client or working remotely with your team, this app brings
              the full Toiral experience right to your fingertips.
            </p>

            {/* Install Button */}
            <button
              onClick={handleInstall}
              className="bg-[#d4a5a5] hover:bg-[#c99595] text-white font-medium py-4 px-10 rounded-lg shadow-md transition-colors flex items-center justify-center mx-auto md:mx-0 text-lg"
            >
              <DownloadIcon className="mr-3 h-6 w-6" />
              Install Taskboard App
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[#7a7067]">
        <p>© {new Date().getFullYear()} Toiral. All rights reserved.</p>
      </footer>

      {/* Installation Modal */}
      <InstallationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        os={detectedOS}
        onDownload={handleDownloadShortcut}
        isDownloading={isDownloading}
        downloadSuccess={downloadSuccess}
        downloadError={downloadError}
      />
    </div>
  );
};

export default DownloadPage;
