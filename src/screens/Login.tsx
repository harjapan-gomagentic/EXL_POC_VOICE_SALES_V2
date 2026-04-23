import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const ROLES = ['Sales Director (Practice)'];

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

    const orbs = Array.from({ length: 6 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      r: 70 + Math.random() * 140,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      opacity: 0.05 + Math.random() * 0.09,
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
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="login-canvas" aria-hidden />;
}

export default function Login() {
  const { dispatch } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const valid = name.trim().length > 1 && role.length > 0;

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: 'START_BRIEF', name: name.trim(), role });
    }, 650);
  };

  return (
    <div className="login-root">
      <section className={`login-hero ${mounted ? 'login-hero--stagger' : ''}`}>
        <AnimatedBackground />
        <div className="login-hero__mesh" aria-hidden />
        <div className="login-hero__logo-wrap">
          <img src="/exl-logo.png" alt="EXL logo" className="login-hero__logo" />
        </div>

        <div className="login-hero__content">
          <h1 className="login-hero__title">
            Practice the conversation. Perfect the outcome.
          </h1>
          <p className="login-hero__lead">
            Enter your details to begin your SPIN simulation session.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__blob" aria-hidden />
        <div className={`login-card ${mounted ? 'login-card--enter' : ''}`}>
          <div className="login-card__head">
            <h2>Claim your seat</h2>
          </div>

          <form onSubmit={handleStart} style={{ marginTop: 28 }}>
            <div className="login-field">
              <label htmlFor="login-name">Your name</label>
              <input
                id="login-name"
                type="text"
                className="login-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-role">Your role</label>
              <div style={{ position: 'relative' }}>
                <select
                  id="login-role"
                  className={`login-select ${!role ? 'placeholder' : ''}`}
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  {ROLES.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <svg
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-3)"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={!valid || loading}>
              <span className="login-submit__shine" aria-hidden />
              {loading ? (
                <span style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#fff',
                        animation: `dot-bounce 0.9s ease-in-out ${i * 0.14}s infinite`,
                      }}
                    />
                  ))}
                </span>
              ) : (
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  Start my session
                  <span style={{ fontSize: 20, lineHeight: 1, transition: 'transform 0.3s ease' }} aria-hidden>
                    →
                  </span>
                </span>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
