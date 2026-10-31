import { useEffect, useMemo, useState } from 'react';
import { QUOTE_TIPS } from '@/data/tips';

const TIP_INTERVAL_MS = 5000;
// Si la carga es casi instantánea no se muestra nada, para evitar un parpadeo.
const SHOW_DELAY_MS = 250;

function QuotiaMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="250 220 760 700" aria-hidden="true">
      <circle cx="617" cy="560" r="247" fill="none" stroke="#D99A4E" strokeWidth="92" />
      <polygon points="590,610 722,610 930,850 798,850" fill="#04172F" stroke="#04172F" strokeWidth="40" strokeLinejoin="miter" />
      <polygon points="590,610 722,610 930,850 798,850" fill="#D99A4E" />
    </svg>
  );
}

/** Pantalla de carga con la marca y consejos para quien cotiza. */
export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTE_TIPS.length));

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    const rotate = setInterval(() => setIndex((i) => (i + 1) % QUOTE_TIPS.length), TIP_INTERVAL_MS);
    return () => clearInterval(rotate);
  }, []);

  const tip = useMemo(() => QUOTE_TIPS[index], [index]);

  if (!visible) return <div className="h-screen w-full" style={{ background: '#04172F' }} />;

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-between px-6 py-12"
      style={{ background: '#04172F' }}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes quotia-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes quotia-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
      `}</style>

      <div />

      <div className="flex flex-col items-center gap-5">
        <QuotiaMark />
        <span className="text-2xl font-semibold tracking-wide text-white">Quotia</span>
        <div className="h-[3px] w-28 overflow-hidden rounded-full" style={{ background: 'rgba(217,154,78,0.25)' }}>
          <div className="h-full w-1/3 rounded-full" style={{ background: '#D99A4E', animation: 'quotia-bar 1.4s ease-in-out infinite' }} />
        </div>
      </div>

      <div key={index} className="w-full max-w-sm text-center" style={{ animation: 'quotia-fade 0.6s ease both' }}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#D99A4E' }}>
          {tip.kind === 'dato' ? 'Dato' : 'Consejo'}
        </p>
        <p className="text-sm leading-relaxed text-white/85">{tip.text}</p>
        {tip.source && <p className="mt-2 text-[11px] leading-snug text-white/45">Fuente: {tip.source}</p>}
      </div>
    </div>
  );
}
