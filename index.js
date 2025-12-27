
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Power, AlertTriangle, Zap, Battery } from 'lucide-react';

const FlashlightApp = () => {
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError("Browser doesn't support camera access.");
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('SW Registered'))
        .catch(err => console.error('SW Failed', err));
    }
    return () => stopFlashlight();
  }, []);

  const stopFlashlight = () => {
    if (trackRef.current) {
      trackRef.current.stop();
      trackRef.current = null;
    }
  };

  const toggleFlashlight = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    setError(null);
    if (isOn) {
      stopFlashlight();
      setIsOn(false);
    } else {
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        await track.applyConstraints({ advanced: [{ torch: true }] });
        setIsOn(true);
      } catch (err) {
        stopFlashlight();
        setError("Flashlight not supported on this device.");
        setIsOn(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return React.createElement('div', { className: "min-h-screen w-full bg-neutral-900 flex flex-col items-center justify-between text-neutral-100 font-sans" },
    React.createElement('header', { className: "w-full p-6 flex justify-between items-center opacity-70" },
      React.createElement('div', { className: "flex items-center gap-2" },
        React.createElement(Zap, { size: 20, className: isOn ? "text-yellow-400" : "text-neutral-500" }),
        React.createElement('span', { className: "font-semibold tracking-wider text-sm uppercase" }, "Torch Lite")
      ),
      React.createElement(Battery, { size: 20, className: "text-neutral-500" })
    ),
    React.createElement('main', { className: "flex-1 flex flex-col items-center justify-center w-full relative" },
      error && React.createElement('div', { className: "absolute top-10 px-6 py-3 bg-red-900/50 border border-red-500/30 rounded-lg flex items-center gap-3" },
        React.createElement(AlertTriangle, { size: 20 }),
        React.createElement('p', { className: "text-sm" }, error)
      ),
      React.createElement('button', {
        onClick: toggleFlashlight,
        disabled: !isSupported || isLoading,
        className: `relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all ${isOn ? 'bg-neutral-800 shadow-[0_0_60px_-10px_rgba(250,204,21,0.6)] border-4 border-yellow-500/50' : 'bg-neutral-800 border-4 border-neutral-700'}`
      }, React.createElement(Power, { size: 64, className: isOn ? 'text-yellow-400' : 'text-neutral-600' }))
    )
  );
};

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(FlashlightApp));
      
