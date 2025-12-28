import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Power, AlertTriangle, Zap, Battery, Calculator, X } from 'lucide-react';

// --- Calculator ---
const buttons = [
  ['sin', 'cos', 'tan', '(', ')', 'C'],
  ['7', '8', '9', '÷', '√', '^'],
  ['4', '5', '6', '×', '%', 'π'],
  ['1', '2', '3', '−', 'e', 'ln'],
  ['0', '.', '=', '+', '-', 'log'],
];

// Scientific functions (degrees for trig, natural for ln/log)
const sciFns = {
  sin: a => Math.sin((parseFloat(a) * Math.PI) / 180),
  cos: a => Math.cos((parseFloat(a) * Math.PI) / 180),
  tan: a => Math.tan((parseFloat(a) * Math.PI) / 180),
  ln: a => Math.log(parseFloat(a)),
  log: a => Math.log10(parseFloat(a)),
  '√': a => Math.sqrt(parseFloat(a)),
  π: _ => Math.PI,
  e: _ => Math.E,
};

function safeEval(expr) {
  try {
    expr = expr
      .replace(/÷/g, '/')
      .replace(/×/g, '*')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/\bπ\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');
    // Functions such as sin(x), √(9)
    expr = expr.replace(/(sin|cos|tan|log|ln|√)\(([^()]+)\)/g, (_, fn, arg) =>
      sciFns[fn] ? sciFns[fn](safeEval(arg)) : arg
    );
    return eval(expr);
  } catch {
    return 'Err';
  }
}

const CalculatorModal = ({ open, onClose }) => {
  const [display, setDisplay] = useState('');
  const [history, setHistory] = useState([]);
  // Keyboard support
  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (e.key === 'Enter') return append('=');
      if (e.key === 'Escape') return onClose();
      const keyMap = {
        '*': '×',
        '/': '÷',
        '-': '−',
        '+': '+',
        '.': '.',
        '%': '%',
        '^': '^',
      };
      if (/\d/.test(e.key)) append(e.key);
      if (keyMap[e.key]) append(keyMap[e.key]);
      if (e.key === 'c' || e.key === 'C') append('C');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const append = v => {
    if (v === 'C') {
      setDisplay('');
      return;
    }
    if (v === '=') {
      const res = safeEval(display);
      setHistory([...history, { exp: display, res }]);
      setDisplay(res.toString());
      return;
    }
    setDisplay(display + v);
  };

  return open ? (
    <div className="fixed z-50 bottom-0 left-0 w-full h-full flex items-end md:items-center justify-center backdrop-blur-[4px] bg-black/40 select-none">
      <div className="w-full max-w-sm mx-auto bg-white/20 backdrop-blur-lg border border-white/30 rounded-t-3xl md:rounded-2xl shadow-2xl p-4 pb-6 md:pb-8 flex flex-col glassy-animation">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold text-white/90">Calculator</span>
          <button onClick={onClose} title="Close calculator" className="p-2 rounded hover:bg-white/10 text-white">
            <X size={22}/>
          </button>
        </div>
        <div className="rounded-xl bg-black/40 px-4 text-right text-white font-mono text-2xl min-h-12 py-2 select-text break-all mb-3 border border-white/10">
          {display || <span className="text-gray-400">0</span>}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {buttons.flat().map(key => (
            <button
              key={key}
              onClick={() => append(key)}
              className="w-12 h-12 m-1 rounded-lg flex items-center justify-center font-semibold text-lg glassy-btn focus:outline-none transition group text-white/80 hover:text-yellow-400 hover:scale-105 shadow hover:shadow-yellow-200/30"
            >
              {key === '^' ? <span className="font-sans">x<sup>y</sup></span> : key}
            </button>
          ))}
        </div>
        {history.length > 0 && (
          <div className="max-h-28 overflow-y-auto bg-black/20 rounded p-2 mt-2">
            <div className="font-bold text-xs text-white/60 mb-0.5">History</div>
            {history.map((h, i) => (
              <div className="flex text-xs justify-between mb-1 text-white/80" key={i}>
                <span>{h.exp}</span>
                <span>= {h.res}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;
};

// --- Torch App ---
const FlashlightApp = () => {
  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
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

  return (
    <div className="min-h-screen w-full bg-neutral-900 flex flex-col items-center justify-between text-neutral-100 font-sans relative">
      <header className="w-full p-6 flex justify-between items-center opacity-70">
        <div className="flex items-center gap-2">
          <Zap size={20} className={isOn ? "text-yellow-400" : "text-neutral-500"} />
          <span className="font-semibold tracking-wider text-sm uppercase">Torch Lite</span>
        </div>
        <Battery size={20} className="text-neutral-500" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center w-full relative">
        {error && (
          <div className="absolute top-10 px-6 py-3 bg-red-900/50 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <button
          onClick={toggleFlashlight}
          disabled={!isSupported || isLoading}
          className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all ${isOn ? 'bg-neutral-800 shadow-[0_0_60px_-10px_rgba(250,204,21,0.6)] border-4 border-yellow-400/70' : 'bg-gradient-to-b from-black/50 to-neutral-900 border-yellow-500/10 border-2'} focus:outline-none`}
        >
          <Power size={64} className={isOn ? 'text-yellow-400' : 'text-neutral-600'} />
        </button>
        {/* Floating Calculator Button */}
        <button
          onClick={() => setCalcOpen(true)}
          className="fixed z-30 bottom-6 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-lg border border-white/30 p-4 rounded-full shadow-lg shadow-yellow-200/10 hover:shadow-yellow-200/40 hover:bg-yellow-400/50 group transition-all focus:outline-none glassy-btn"
          style={{ boxShadow: '0 8px 34px 0 rgba(250,204,21,.09)' }}
          title="Open Calculator"
        >
          <Calculator size={32} className="text-yellow-400 group-hover:text-white transition" />
        </button>
        <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<FlashlightApp />);

// --- CSS glassy effect helper (add to your Tailwind config or global css for slightly better results if you like) ---
// .glassy-btn { backdrop-filter: blur(8px); background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.25); }
// .glassy-animation { animation: glassy-fadein .5s cubic-bezier(.74,.08,.36,1.19); }
// @keyframes glassy-fadein { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }