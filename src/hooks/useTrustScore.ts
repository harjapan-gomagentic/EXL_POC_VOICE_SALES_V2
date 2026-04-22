import type { SpinClassification } from '../context/CallContext';

export function useTrustScore() {
  const calculateDelta = (c: SpinClassification): number => {
    let delta = 0;

    // Type logic
    const weights: Record<string, number> = {
      S: 2,   // Situation: low value
      P: 10,  // Problem: good value
      I: 20,  // Implication: high value
      N: 25,  // Need-Payoff: high value
      PITCH: -15, // Pitching: penalty if premature
      SOCIAL: 5,
      CLOSE: 10
    };

    delta += weights[c.spin_type] || 0;

    // Multipliers
    if (c.move_label === 'STRONG') delta *= 1.5;
    if (c.move_label === 'WEAK') delta *= 0.5;
    if (c.move_label === 'BLUNDER') delta = -15;

    // Sub-type bonuses
    if (c.sub_type === 'BENEFIT') delta += 5;
    if (c.sub_type === 'FEATURE' && c.spin_type === 'PITCH') delta -= 5;

    // Insight bonus
    if (c.insight_unlocked) delta += 10;

    return Math.round(delta);
  };

  const getCoachingTip = (c: SpinClassification): string => {
    if (c.missed_opportunity && c.missed_opportunity_detail) return c.missed_opportunity_detail;
    if (c.move_label === 'BLUNDER') return "Careful! You launched into a pitch before Marcus validated the need. Pull back and ask 'What impact would solving this have?'";
    if (c.spin_type === 'S') return "Good situational context, but don't stay here too long. Find a problem to explore.";
    if (c.spin_type === 'P') return "You found a pain point! Now ask an Implication question to make the cost of that problem feel real.";
    return "Keep going. Focus on asking questions that make Marcus articulate the value of change.";
  };

  return { calculateDelta, getCoachingTip };
}
