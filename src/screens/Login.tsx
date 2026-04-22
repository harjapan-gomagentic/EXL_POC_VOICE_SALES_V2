import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const ROLES = ['Account Executive', 'Senior Account Executive', 'Sales Director', 'VP Sales', 'Practice Lead'];

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId = 0;
    const resize = () => {
      const d = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * d;
      canvas.height = canvas.offsetHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;
    
    // Floating orbs
    const orbs = Array.from({ length: 5 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      r: 80 + Math.random() * 160,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: 0.06 + Math.random() * 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = w() + orb.r;
        if (orb.x > w() + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h() + orb.r;
        if (orb.y > h() + orb.r) orb.y = -orb.r;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `rgba(255,255,255,${orb.opacity})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function Login() {
  const { dispatch } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const valid = name.trim().length > 1 && role.length > 0;

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: 'START_BRIEF', name: name.trim(), role });
    }, 700);
  };

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto', background: 'var(--bg)' }}>
      {/* LEFT — Orange Brand Panel */}
      <div style={{
        width: '52%',
        background: 'linear-gradient(155deg, #FF5500 0%, #FF3500 40%, #E02800 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 8s ease infinite',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <AnimatedBackground />

        {/* Decorative shapes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -160, right: -100, width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: -100, right: -40, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
          <div style={{ position: 'absolute', bottom: 120, right: 80, width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'float 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: 200, right: 160, width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'float 5s ease-in-out 1s infinite' }} />
          <div style={{ position: 'absolute', top: '45%', left: '15%', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: 'float 6s ease-in-out 2s infinite' }} />
        </div>

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 24, color: '#fff', letterSpacing: '0.06em' }}>EXL</span>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontWeight: 500, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Service</span>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s' }}>
          <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            AI Sales Simulation
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 20 }}>
            Practice the<br/>consultative sale.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 400, fontWeight: 400 }}>
            Earn trust. Uncover pain. Close deals — before you walk into the room.
          </p>

          {/* Feature tags */}
          <div style={{ display: 'flex', gap: 10, marginTop: 40, flexWrap: 'wrap' }}>
            {['Real AI Prospect', 'Voice Enabled', 'Live Coaching'].map((tag, i) => (
              <span key={tag} style={{
                padding: '8px 18px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.18)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.1}s`,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20, opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 0.6s' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.6 }}>
            "The best reps don't just talk — they ask the right questions."
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Korn Ferry SPIN® Methodology</p>
        </div>
      </div>

      {/* RIGHT — Login Form */}
      <div style={{
        width: '48%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 420, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s' }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Sign in
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-3)', lineHeight: 1.6 }}>Enter your details to start the simulation.</p>
          </div>

          <form onSubmit={handleStart}>
            {/* Name */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 15,
                  color: 'var(--text-1)',
                  transition: 'border-color 200ms, box-shadow 200ms',
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 4px var(--orange-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Role */}
            <div style={{ marginBottom: 32, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Your Role
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 18px',
                    borderRadius: 12,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: 15,
                    color: role ? 'var(--text-1)' : 'var(--text-3)',
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 200ms, box-shadow 200ms',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 4px var(--orange-glow)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="" disabled>Select your role</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <svg style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={!valid || loading}
              style={{
                width: '100%',
                height: 54,
                borderRadius: 14,
                border: 'none',
                background: valid ? 'linear-gradient(135deg, #FF5500, #FF3300)' : 'var(--border)',
                color: valid ? '#fff' : 'var(--text-3)',
                fontSize: 16,
                fontWeight: 700,
                cursor: valid && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: valid ? '0 6px 24px rgba(255,78,0,0.35)' : 'none',
                transform: valid ? 'translateY(0)' : 'translateY(0)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (valid && !loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(255,78,0,0.45)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = valid ? '0 6px 24px rgba(255,78,0,0.35)' : 'none'; }}
            >
              {loading ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: `dot-bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              ) : (
                <>Start Training <span style={{ fontSize: 18 }}>→</span></>
              )}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
            SPIN® is a registered trademark of Korn Ferry · EXL Service
          </p>
        </div>
      </div>
    </div>
  );
}
