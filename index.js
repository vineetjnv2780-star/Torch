import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Power, Zap, Battery, Calculator, X, Delete } from 'lucide-react';

const App = () => {
  const [isOn, setIsOn] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [display, setDisplay] = useState('');
  const [history, setHistory] = useState([]);
  const trackRef = useRef(null);

  // --- Torch Logic ---
  const toggleTorch = async () => {
    try {
      if (isOn) {
        trackRef.current?.stop();
        setIsOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({ advanced: [{ torch: true }] });
        trackRef.current = track;
        setIsOn(true);
        if (navigator.vibrate) navigator.vibrate(40);
      }
    } catch (e) { alert("Torch not supported on this device"); }
  };

  // --- Calculator Logic ---
  const handleCalc = (val) => {
    if (val === 'C') return setDisplay('');
    if (val === '⌫') return setDisplay(d => d.slice(0, -1));
    if (val === '=') {
      try {
        const result = eval(display.replace(/×/g, '*').replace(/÷/g, '/').replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos'));
        setHistory(prev => [{ exp: display, res: result }, ...prev].slice(0, 3));
        setDisplay(String(result));
      } catch { setDisplay('Error'); }
      return;
    }
    setDisplay(d => d + val);
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-between p-8 overflow-hidden font-sans">
      {/* Status Bar */}
      <div className="w-full flex justify-between opacity-40 text-sm font-medium">
        <div className="flex items-center gap-2"><Zap size={16} /> <span>SYSTEM LIVE</span></div>
        <Battery size={20} />
      </div>

      {/* Modern Torch Button */}
      <div className="relative">
        {isOn && <div className="absolute inset-0 bg-yellow-400/20 blur-[80px] rounded-full animate-pulse" />}
        <button 
          onClick={toggleTorch}
          className={`relative z-10 w-52 h-52 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
            isOn ? 'bg-yellow-400 border-yellow-200 shadow-2xl' : 'bg-neutral-900 border-white/5'
          }`}
        >
          <Power size={80} className={isOn ? 'text-black' : 'text-neutral-700'} />
        </button>
      </div>

      {/* Floating UI Toggle */}
      <button 
        onClick={() => setCalcOpen(true)}
        className="mb-6 p-5 glass rounded-full hover:bg-yellow-400 hover:text-black transition-all active:scale-90 shadow-xl"
      >
        <Calculator size={32} />
      </button>

      {/* Slide-up Calculator Modal */}
      {calcOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
          <div className="w-full bg-[#1c1c1e] rounded-t-[40px] p-8 pb-12 animate-slide-up border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/30 font-bold uppercase tracking-[0.2em] text-xs">Scientific Utility</span>
              <button onClick={() => setCalcOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
            </div>
            
            {/* Display Screen */}
            <div className="text-right mb-8 px-2">
              <div className="text-white/20 text-sm h-6 font-mono">{history[0]?.exp || ''}</div>
              <div className="text-white text-6xl font-light truncate">{display || '0'}</div>
            </div>
            
            {/* Keyboard Grid */}
            <div className="grid grid-cols-4 gap-3">
              {['C', '÷', '×', '⌫', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalc(btn)}
                  className={`h-14 rounded-2xl text-xl font-medium transition-all active:scale-90 ${
                    btn === '=' ? 'bg-yellow-400 text-black' : 
                    ['C','÷','×','-','+','⌫'].includes(btn) ? 'bg-white/10 text-yellow-400' : 'bg-white/5 text-white hover:bg-white/10'
                  } ${btn === '0' ? 'col-span-1' : ''}`}
                >
                  {btn === '⌫' ? <Delete size={20} className="mx-auto"/> : btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
