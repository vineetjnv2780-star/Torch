import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Power, AlertTriangle, Zap, Battery } from 'lucide-react';

// Extend the native interfaces to include the non-standard 'torch' property
declare global {
  interface MediaTrackCapabilities {
    torch?: boolean;
  }

  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

const FlashlightApp = () => {
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    // Check for basic browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError("Your browser doesn't support camera access needed for the flashlight.");
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.log('Service Worker Failed', err));
    }

    // Cleanup on unmount
    return () => {
      stopFlashlight();
    };
  }, []);

  const stopFlashlight = () => {
    if (trackRef.current) {
      trackRef.current.stop();
      trackRef.current = null;
    }
  };

  const toggleFlashlight = async () => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    setError(null);

    if (isOn) {
      // Turn OFF
      stopFlashlight();
      setIsOn(false);
    } else {
      // Turn ON
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });

        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        // Check capabilities to see if torch is supported
        const capabilities = track.getCapabilities();
        if (!capabilities.torch) {
          // Some devices don't report capability but still support it via advanced constraints,
          // but usually, this is a good check. We'll try anyway but warn if fails.
          console.warn("Torch capability not reported by browser.");
        }

        await track.applyConstraints({
          advanced: [{ torch: true }]
        });

        setIsOn(true);
      } catch (err: any) {
        console.error(err);
        stopFlashlight();
        let msg = "Could not access flashlight.";
        if (err.name === 'NotAllowedError') {
          msg = "Camera permission denied. Please allow access to use the flashlight.";
        } else if (err.name === 'NotFoundError') {
          msg = "No rear camera found.";
        } else if (err.name === 'OverconstrainedError') {
          msg = "Flashlight control is not supported on this device/browser.";
        }
        setError(msg);
        setIsOn(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-900 flex flex-col items-center justify-between text-neutral-100 overflow-hidden font-sans select-none">
      
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center opacity-70">
        <div className="flex items-center gap-2">
          <Zap size={20} className={isOn ? "text-yellow-400" : "text-neutral-500"} />
          <span className="font-semibold tracking-wider text-sm uppercase">Torch Lite</span>
        </div>
        {/* Placeholder for battery status if we could read it - visual decoration */}
        <Battery size={20} className="text-neutral-500" />
      </header>

      {/* Main Control */}
      <main className="flex-1 flex flex-col items-center justify-center w-full relative">
        
        {/* Ambient Glow Background */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] transition-all duration-500 ease-in-out pointer-events-none
            ${isOn ? 'w-80 h-80 bg-yellow-500/20' : 'w-0 h-0 bg-transparent'}
          `} 
        />

        {/* Error Message */}
        {error && (
          <div className="absolute top-10 px-6 py-3 bg-red-900/50 border border-red-500/30 rounded-lg text-red-200 text-center max-w-xs backdrop-blur-sm z-20 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* The Button */}
        <button
          onClick={toggleFlashlight}
          disabled={!isSupported || isLoading}
          className={`
            relative z-10 w-48 h-48 rounded-full flex items-center justify-center
            transition-all duration-300 ease-out focus:outline-none touch-manipulation
            ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}
            ${isOn 
              ? 'bg-neutral-800 shadow-[0_0_60px_-10px_rgba(250,204,21,0.6),inset_0_2px_20px_rgba(0,0,0,0.2)] border-4 border-yellow-500/50' 
              : 'bg-neutral-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.3)] border-4 border-neutral-700'
            }
          `}
          aria-label={isOn ? "Turn flashlight off" : "Turn flashlight on"}
        >
          {/* Inner ring/detail */}
          <div className={`
            absolute inset-2 rounded-full border border-white/5 
            ${isOn ? 'bg-gradient-to-br from-yellow-500/10 to-transparent' : 'bg-transparent'}
          `} />

          {/* Icon */}
          <Power 
            size={64} 
            strokeWidth={1.5}
            className={`
              relative z-20 transition-all duration-300
              ${isOn 
                ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' 
                : 'text-neutral-600'
              }
            `} 
          />
        </button>

        <div className="mt-12 text-center space-y-2 opacity-60">
          <p className="text-sm font-medium tracking-widest uppercase">
            {isLoading ? 'Initializing...' : (isOn ? 'Power On' : 'Power Off')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-neutral-600">
        <p>Install this app for offline use</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<FlashlightApp />);