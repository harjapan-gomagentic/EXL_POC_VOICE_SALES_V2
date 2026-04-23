import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateScenarioACoachDebrief } from '../lib/coachDebrief';

type TurnAnnotation = {
  id: string;
  repText: string;
  spin: string;
  coachNote: string;
};

function toAnnotations(messages: { role: 'user' | 'assistant'; content: string; spinType?: string; feedback?: string }[]): TurnAnnotation[] {
  const rows: TurnAnnotation[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const rep = messages[i];
    const prospect = messages[i + 1];
    if (rep.role !== 'user' || prospect.role !== 'assistant') continue;
    rows.push({
      id: `${i}-${prospect.spinType ?? 'None'}`,
      repText: rep.content,
      spin: prospect.spinType ?? 'None',
      coachNote: prospect.feedback ?? 'No coaching note captured for this turn.',
    });
  }
  return rows;
}

const OUTCOME_LABEL: Record<string, string> = {
  advance: 'Advance',
  continuation: 'Continuation',
  no_sale: 'No sale',
};

export default function Replay() {
  const { state, dispatch } = useApp();
  const annotations = useMemo(() => toAnnotations(state.messages), [state.messages]);

  useEffect(() => {
    if (state.coachDebrief || state.coachDebriefLoading) return;
    dispatch({ type: 'SET_COACH_DEBRIEF_LOADING', loading: true });
    const payload = state.messages.map(m => ({
      role: m.role,
      content: m.content,
      spinType: m.spinType,
      feedback: m.feedback,
    }));
    generateScenarioACoachDebrief({
      repName: state.repName,
      repRole: state.repRole,
      messages: payload,
      commitmentOutcome: state.callOutcome,
    })
      .then(data => dispatch({ type: 'SET_COACH_DEBRIEF', data }))
      .catch(err => {
        console.error('Replay debrief error:', err);
        dispatch({ type: 'SET_COACH_DEBRIEF_LOADING', loading: false });
      });
  }, [dispatch, state.callOutcome, state.coachDebrief, state.coachDebriefLoading, state.messages, state.repName, state.repRole]);

  return (
    <div style={{ width: '100%', flex: 1, overflow: 'auto', background: 'var(--bg)', padding: 28 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: 6 }}>
              POST-CALL REVIEW
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--text-1)' }}>Annotated replay</h2>
            <p style={{ marginTop: 8, color: 'var(--text-2)' }}>Each rep turn is tagged and paired with a focused coaching note.</p>
          </div>
          <span
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 800,
              background: 'rgba(26,26,26,0.06)',
              color: 'var(--text-1)',
            }}
          >
            Outcome: {OUTCOME_LABEL[state.callOutcome]}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {annotations.map(turn => (
            <div key={turn.id} style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.08em' }}>
                REP TURN · {turn.spin}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.55 }}>{turn.repText}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-1)' }}>Coach note:</strong> {turn.coachNote}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>
            HIDDEN PAIN SUMMARY
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {state.coachDebriefLoading
              ? 'Analyzing hidden pains surfaced in the call...'
              : state.coachDebrief?.hidden_pain_and_next_step ?? 'No hidden pain summary available.'}
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => dispatch({ type: 'OPEN_SCORECARD' })}
            style={{
              height: 46,
              borderRadius: 12,
              border: 'none',
              padding: '0 20px',
              fontSize: 14,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ff5c14, #e04400)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Continue to scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
