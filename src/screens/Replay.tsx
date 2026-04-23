import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateScenarioACoachDebrief } from '../lib/coachDebrief';

type TurnAnnotation = {
  id: string;
  repText: string;
  spin: 'S' | 'P' | 'I' | 'N' | 'FAB' | 'None';
  spinLabel: string;
  coachNote: string;
  quality: 'GOOD' | 'BAD' | 'OKAY';
};

const TAG_STYLE: Record<'S' | 'P' | 'I' | 'N' | 'FAB' | 'None', { bg: string; text: string }> = {
  S: { bg: '#E6F1FB', text: '#0C447C' },
  P: { bg: '#FAEEDA', text: '#633806' },
  I: { bg: '#FAECE7', text: '#712B13' },
  N: { bg: '#E1F5EE', text: '#085041' },
  FAB: { bg: '#EEEDFE', text: '#3C3489' },
  None: { bg: '#F3F4F6', text: '#6B7280' },
};

function detectFab(text: string): boolean {
  return /(feature|advantage|benefit|solution|platform|automation|capability|we can|we've done|outcome)/i.test(text);
}

function buildCoachNote(raw: string | undefined, spin: TurnAnnotation['spin']): string {
  const cleaned = (raw ?? '')
    .replace(/arvenix life/gi, 'New Port Insurance')
    .replace(/\barvenix\b/gi, 'New Port Insurance')
    .trim();
  if (cleaned) return cleaned;

  if (spin === 'S') return 'Good setup. Move next into a concrete process friction question.';
  if (spin === 'P') return 'Strong discovery direction. Probe one level deeper on impact or frequency.';
  if (spin === 'I') return 'Great implication work. Stay here briefly until the cost of inaction is explicit.';
  if (spin === 'N') return 'Good value framing. Let Marcus describe outcomes in his own words.';
  if (spin === 'FAB') return 'Capability talk is most effective after clear problem and implication depth.';
  return 'Make the next message more specific and discovery-oriented.';
}

function toAnnotations(messages: { role: 'user' | 'assistant'; content: string; spinType?: string; feedback?: string }[]): TurnAnnotation[] {
  const rows: TurnAnnotation[] = [];
  let seenProblemOrImplication = false;
  for (let i = 0; i < messages.length - 1; i++) {
    const rep = messages[i];
    const prospect = messages[i + 1];
    if (rep.role !== 'user' || prospect.role !== 'assistant') continue;
    const raw = (prospect.spinType ?? 'None').toUpperCase();
    let spin: TurnAnnotation['spin'] = raw === 'S' || raw === 'P' || raw === 'I' || raw === 'N' ? raw : 'None';
    if (spin === 'None' && detectFab(rep.content)) spin = 'FAB';
    if (spin === 'P' || spin === 'I') seenProblemOrImplication = true;

    let quality: TurnAnnotation['quality'] = 'OKAY';
    if (spin === 'P' || spin === 'I' || spin === 'N') {
      quality = 'GOOD';
    } else if (spin === 'FAB') {
      if (seenProblemOrImplication) {
        quality = 'GOOD';
      } else {
        quality = 'BAD';
      }
    } else if (spin === 'S') {
      quality = 'OKAY';
    } else {
      quality = 'BAD';
    }

    rows.push({
      id: `${i}-${spin}`,
      repText: rep.content,
      spin,
      spinLabel: spin === 'FAB' ? 'F/A/B' : spin,
      coachNote: buildCoachNote(prospect.feedback, spin),
      quality,
    });
  }
  return rows;
}

const OUTCOME_LABEL: Record<string, string> = {
  advance: 'Advance',
  continuation: 'Continuation',
  no_sale: 'No sale',
};

const OUTCOME_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  advance: { bg: '#E1F5EE', text: '#085041', border: '#BEE9DB' },
  continuation: { bg: '#FAEEDA', text: '#633806', border: '#F0D8B0' },
  no_sale: { bg: '#FCEBEB', text: '#791F1F', border: '#F4C8C8' },
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
            <p style={{ marginTop: 8, color: 'var(--text-2)' }}>Each message in your dialogue is auto-labeled with SPIN and paired with coaching.</p>
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
              background: OUTCOME_STYLE[state.callOutcome].bg,
              color: OUTCOME_STYLE[state.callOutcome].text,
              border: `1px solid ${OUTCOME_STYLE[state.callOutcome].border}`,
            }}
          >
            Call outcome: {OUTCOME_LABEL[state.callOutcome]}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {annotations.map(turn => (
            <div key={turn.id} style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
                  YOUR MESSAGE
                </div>
                <span
                  className="mono"
                  style={{
                    height: 22,
                    borderRadius: 999,
                    padding: '0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: TAG_STYLE[turn.spin].bg,
                    color: TAG_STYLE[turn.spin].text,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {turn.spinLabel}
                </span>
                <span
                  className="mono"
                  style={{
                    height: 22,
                    borderRadius: 999,
                    padding: '0 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: turn.quality === 'GOOD' ? '#E1F5EE' : turn.quality === 'BAD' ? '#FCEBEB' : '#FAEEDA',
                    color: turn.quality === 'GOOD' ? '#085041' : turn.quality === 'BAD' ? '#791F1F' : '#633806',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {turn.quality}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.55 }}>{turn.repText}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-1)' }}>Coach note:</strong> {turn.coachNote}
              </div>
            </div>
          ))}
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
