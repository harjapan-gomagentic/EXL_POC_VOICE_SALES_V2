import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { spinCountsFromMessages } from '../lib/coachDebrief';

function toPercentages(counts: { S: number; P: number; I: number; N: number }) {
  const total = counts.S + counts.P + counts.I + counts.N;
  if (!total) return { S: 0, P: 0, I: 0, N: 0 };
  return {
    S: Math.round((counts.S / total) * 100),
    P: Math.round((counts.P / total) * 100),
    I: Math.round((counts.I / total) * 100),
    N: Math.round((counts.N / total) * 100),
  };
}

function imbalanceFlag(pct: { S: number; P: number; I: number; N: number }) {
  if (pct.I === 0) return 'No Implication questions detected.';
  if (pct.N === 0) return 'No Need-payoff questions detected.';
  if (pct.S > 55) return 'Heavy Situation bias; move faster into Problem/Implication.';
  return 'Question mix is broadly balanced.';
}

export default function Scorecard() {
  const { state, dispatch } = useApp();
  const counts = useMemo(
    () =>
      spinCountsFromMessages(
        state.messages.map(m => ({
          role: m.role,
          content: m.content,
          spinType: m.spinType,
          feedback: m.feedback,
        })),
      ),
    [state.messages],
  );
  const pct = toPercentages(counts);

  const overallScore = state.coachDebrief?.overall_score ?? Math.min(100, counts.P * 8 + counts.I * 12 + counts.N * 10 + 20);

  return (
    <div style={{ width: '100%', flex: 1, overflow: 'auto', background: 'var(--bg)', padding: 28 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: 6 }}>
            PERFORMANCE SUMMARY
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--text-1)' }}>Scorecard</h2>
          <p style={{ marginTop: 8, color: 'var(--text-2)' }}>Clear snapshot of conversation quality and close readiness.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Overall score', value: `${overallScore} / 100` },
            { label: 'Commitment type', value: state.callOutcome },
          ].map(card => (
            <div key={card.label} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>
            SPIN DISTRIBUTION
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {(['S', 'P', 'I', 'N'] as const).map(letter => (
              <span key={letter} style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 700 }}>
                {letter}: {pct[letter]}%
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{imbalanceFlag(pct)}</div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 20, background: 'var(--surface-2)' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>
            NARRATIVE FEEDBACK
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-1)' }}>Top strength:</strong> {state.coachDebrief?.did_well ?? 'Keep building depth before pitching.'}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-1)' }}>Top development area:</strong>{' '}
            {state.coachDebrief?.improve ?? 'Push implication questions until the cost of inaction is explicit.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => dispatch({ type: 'START_CALL' })}
            style={{
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: '#fff',
              color: 'var(--text-1)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Replay this scenario
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            style={{
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #ff5c14, #e04400)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try a new scenario
          </button>
        </div>
      </div>
    </div>
  );
}
