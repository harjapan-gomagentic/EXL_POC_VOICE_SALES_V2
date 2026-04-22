import type { SpinType } from '../context/CallContext';

export default function SpinBadge({ type }: { type: SpinType | null }) {
  if (!type) return null;
  
  const config: Record<string, { label: string; c: string; bg: string }> = {
    S: { label: 'SITUATION', c: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
    P: { label: 'PROBLEM', c: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    I: { label: 'IMPLICATION', c: '#F97316', bg: 'rgba(249,115,22,0.15)' },
    N: { label: 'NEED-PAYOFF', c: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
    PITCH: { label: 'PITCH', c: '#FF4D4D', bg: 'rgba(255,77,77,0.15)' },
    SOCIAL: { label: 'SOCIAL', c: '#3B8BD4', bg: 'rgba(59,139,212,0.15)' },
    CLOSE: { label: 'CLOSE', c: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
  };

  const c = config[type] || config.S;

  return (
    <span className="mono" style={{ 
      display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 8px', borderRadius: 4, 
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', background: c.bg, color: c.c, border: `1px solid ${c.c}44`
    }}>
      {c.label}
    </span>
  );
}
