import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';

/* ── Types ── */
export type Screen = 'login' | 'tutorial' | 'briefing' | 'live' | 'ended';
export type Phase = 'opening' | 'investigating' | 'demonstrating' | 'commitment';
export type SpinType = 'S' | 'P' | 'I' | 'N' | 'PITCH' | 'SOCIAL' | 'CLOSE';
export type MoveLabel = 'STRONG' | 'GOOD' | 'WEAK' | 'BLUNDER';
export type InsightKey = 'Current Challenge' | 'Where It Hurts' | 'The Deadline' | 'What They\'ve Tried' | 'EXL Scope Gap';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  spinType: SpinType | null;
  subType: 'FEATURE' | 'ADVANTAGE' | 'BENEFIT' | null;
  needSurfaced: 'implied' | 'explicit' | null;
  needLabel: string | null;
  missedOpportunity: boolean;
  missedOpportunityDetail: string | null;
  coachingNote: string | null;
  timestamp: number;
}

export interface MoveLogEntry {
  id: string;
  turnText: string;
  label: MoveLabel;
  delta: number;
  reason: string;
  timestamp: number;
}

export interface SpinClassification {
  spin_type: SpinType;
  sub_type: 'FEATURE' | 'ADVANTAGE' | 'BENEFIT' | null;
  need_surfaced: 'implied' | 'explicit' | null;
  need_label: string | null;
  insight_unlocked: string | null;
  coaching_note: string | null;
  missed_opportunity: boolean;
  missed_opportunity_detail: string | null;
  phase_signal: Phase | null;
  mission_step_completed: number | null;
  move_label: MoveLabel;
  move_reason: string;
}

export interface MissionStep {
  id: number;
  text: string;
  completed: boolean;
}

export interface DebriefData {
  overall: string;
  did_well: string;
  improve: string;
  takeaway: string;
}

export interface AppState {
  screen: Screen;
  repName: string;
  repRole: string;
  tutorialStep: number;
  tutorialComplete: boolean;
  phase: Phase;
  conversationHistory: Message[];
  spinCounts: { S: number; P: number; I: number; N: number; PITCH: number };
  trustScore: number;
  trustHistory: number[];
  moveLog: MoveLogEntry[];
  impliedNeeds: string[];
  explicitNeeds: string[];
  unlockedInsights: string[];
  pillarScores: { introduction: number; curiosity: number; implication: number; advancement: number };
  missionSteps: MissionStep[];
  meetingButtonUnlocked: boolean;
  pitchRiskVisible: boolean;
  outcome: 'advance' | 'continuation' | 'no_sale' | null;
  isTTSSpeaking: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  coachingTip: string;
  timer: number;
  isMuted: boolean;
  callStarted: boolean;
  isTransitioning: boolean;
  debrief: DebriefData | null;
  debriefLoading: boolean;
}

const INIT_MISSIONS: MissionStep[] = [
  { id: 1, text: 'Open strong — say who you are and why this matters', completed: false },
  { id: 2, text: 'Surface a real operational challenge', completed: false },
  { id: 3, text: 'Deepen with an Implication question', completed: false },
  { id: 4, text: 'Make Marcus articulate the value of solving it', completed: false },
  { id: 5, text: 'Secure a specific next step', completed: false },
];

const initialState: AppState = {
  screen: 'login',
  repName: '', repRole: '',
  tutorialStep: 0, tutorialComplete: false,
  phase: 'opening',
  conversationHistory: [],
  spinCounts: { S: 0, P: 0, I: 0, N: 0, PITCH: 0 },
  trustScore: 0, trustHistory: [],
  moveLog: [],
  impliedNeeds: [], explicitNeeds: [],
  unlockedInsights: [],
  pillarScores: { introduction: 0, curiosity: 0, implication: 0, advancement: 0 },
  missionSteps: INIT_MISSIONS.map(m => ({ ...m })),
  meetingButtonUnlocked: false,
  pitchRiskVisible: false,
  outcome: null,
  isTTSSpeaking: false, isRecording: false, isProcessing: false,
  coachingTip: 'Begin with rapport — a brief, genuine opener before diving into questions.',
  timer: 0, isMuted: false, callStarted: false, isTransitioning: false,
  debrief: null, debriefLoading: false,
};

export type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_USER'; name: string; role: string }
  | { type: 'SET_TRANSITIONING'; value: boolean }
  | { type: 'SET_TUTORIAL_STEP'; step: number }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'START_CALL' }
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | { type: 'UPDATE_LAST_USER_SPIN'; classification: SpinClassification; trustDelta: number }
  | { type: 'ADD_ASSISTANT_MESSAGE'; content: string }
  | { type: 'SET_TTS_SPEAKING'; value: boolean }
  | { type: 'SET_RECORDING'; value: boolean }
  | { type: 'SET_PROCESSING'; value: boolean }
  | { type: 'SET_MUTED'; value: boolean }
  | { type: 'SET_COACHING_TIP'; tip: string }
  | { type: 'SET_PITCH_RISK'; visible: boolean }
  | { type: 'SET_OUTCOME'; outcome: 'advance' | 'continuation' | 'no_sale' }
  | { type: 'SET_DEBRIEF'; data: DebriefData }
  | { type: 'SET_DEBRIEF_LOADING'; loading: boolean }
  | { type: 'TICK_TIMER' }
  | { type: 'END_CALL' }
  | { type: 'RESET_CALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen };
    case 'SET_USER': return { ...state, repName: action.name, repRole: action.role };
    case 'SET_TRANSITIONING': return { ...state, isTransitioning: action.value };
    case 'SET_TUTORIAL_STEP': return { ...state, tutorialStep: action.step };
    case 'COMPLETE_TUTORIAL': return { ...state, tutorialComplete: true, callStarted: true, timer: 0, screen: 'live' };
    case 'START_CALL': return { ...state, callStarted: true, timer: 0, screen: 'live' };
    case 'ADD_USER_MESSAGE':
      return { ...state, conversationHistory: [...state.conversationHistory, { role: 'user', content: action.content, spinType: null, subType: null, needSurfaced: null, needLabel: null, missedOpportunity: false, missedOpportunityDetail: null, coachingNote: null, timestamp: Date.now() }] };
    case 'UPDATE_LAST_USER_SPIN': {
      const hist = [...state.conversationHistory];
      const idx = hist.findLastIndex(e => e.role === 'user');
      if (idx === -1) return state;
      const c = action.classification;
      hist[idx] = { ...hist[idx], spinType: c.spin_type, subType: c.sub_type, needSurfaced: c.need_surfaced, needLabel: c.need_label, missedOpportunity: c.missed_opportunity, missedOpportunityDetail: c.missed_opportunity_detail, coachingNote: c.coaching_note };
      const sc = { ...state.spinCounts };
      const st = c.spin_type;
      if (st === 'S' || st === 'P' || st === 'I' || st === 'N' || st === 'PITCH') sc[st]++;
      let implied = [...state.impliedNeeds], explicit = [...state.explicitNeeds];
      if (c.need_surfaced === 'implied' && c.need_label && !implied.includes(c.need_label)) implied.push(c.need_label);
      if (c.need_surfaced === 'explicit' && c.need_label) { implied = implied.filter(n => n !== c.need_label); if (!explicit.includes(c.need_label)) explicit.push(c.need_label); }
      let unlocked = [...state.unlockedInsights];
      if (c.insight_unlocked && !unlocked.includes(c.insight_unlocked)) unlocked.push(c.insight_unlocked);
      let phase = state.phase;
      const po: Phase[] = ['opening', 'investigating', 'demonstrating', 'commitment'];
      if (c.phase_signal && po.indexOf(c.phase_signal) > po.indexOf(phase)) phase = c.phase_signal;
      else { if ((st === 'P' || st === 'I' || st === 'N') && phase === 'opening') phase = 'investigating'; if (st === 'PITCH' && explicit.length > 0 && po.indexOf(phase) < 2) phase = 'demonstrating'; if (st === 'CLOSE') phase = 'commitment'; }
      const missions = state.missionSteps.map(m => c.mission_step_completed === m.id ? { ...m, completed: true } : m);
      let risk = state.pitchRiskVisible;
      if (st === 'PITCH' && explicit.length === 0) risk = true;
      const newTrust = Math.max(-100, Math.min(100, state.trustScore + action.trustDelta));
      const pillar = { ...state.pillarScores };
      if (c.mission_step_completed === 1) pillar.introduction = Math.min(100, pillar.introduction + 30);
      if (st === 'P' || st === 'I') pillar.curiosity = Math.min(100, pillar.curiosity + 15);
      if (st === 'I') pillar.implication = Math.min(100, pillar.implication + 20);
      if (st === 'N' || st === 'CLOSE') pillar.advancement = Math.min(100, pillar.advancement + 15);
      const moveEntry: MoveLogEntry = { id: `${Date.now()}-${Math.random()}`, turnText: hist[idx].content.slice(0, 60), label: c.move_label || 'GOOD', delta: action.trustDelta, reason: c.move_reason || c.coaching_note || '', timestamp: Date.now() };
      return { ...state, conversationHistory: hist, spinCounts: sc, impliedNeeds: implied, explicitNeeds: explicit, unlockedInsights: unlocked, phase, missionSteps: missions, pitchRiskVisible: risk, trustScore: newTrust, trustHistory: [...state.trustHistory, action.trustDelta], meetingButtonUnlocked: newTrust >= 50, pillarScores: pillar, moveLog: [moveEntry, ...state.moveLog].slice(0, 8) };
    }
    case 'ADD_ASSISTANT_MESSAGE': return { ...state, conversationHistory: [...state.conversationHistory, { role: 'assistant', content: action.content, spinType: null, subType: null, needSurfaced: null, needLabel: null, missedOpportunity: false, missedOpportunityDetail: null, coachingNote: null, timestamp: Date.now() }] };
    case 'SET_TTS_SPEAKING': return { ...state, isTTSSpeaking: action.value };
    case 'SET_RECORDING': return { ...state, isRecording: action.value };
    case 'SET_PROCESSING': return { ...state, isProcessing: action.value };
    case 'SET_MUTED': return { ...state, isMuted: action.value };
    case 'SET_COACHING_TIP': return { ...state, coachingTip: action.tip };
    case 'SET_PITCH_RISK': return { ...state, pitchRiskVisible: action.visible };
    case 'SET_OUTCOME': return { ...state, outcome: action.outcome };
    case 'SET_DEBRIEF': return { ...state, debrief: action.data, debriefLoading: false };
    case 'SET_DEBRIEF_LOADING': return { ...state, debriefLoading: action.loading };
    case 'TICK_TIMER': return { ...state, timer: state.timer + 1 };
    case 'END_CALL': return { ...state, screen: 'ended', callStarted: false };
    case 'RESET_CALL': return { ...initialState, screen: 'briefing', repName: state.repName, repRole: state.repRole, tutorialComplete: true };
    default: return state;
  }
}

interface Ctx { state: AppState; dispatch: React.Dispatch<Action> }
const CallContext = createContext<Ctx | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (state.callStarted && !ref.current) ref.current = window.setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000);
    if (!state.callStarted && ref.current) { clearInterval(ref.current); ref.current = null; }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [state.callStarted]);
  return <CallContext.Provider value={{ state, dispatch }}>{children}</CallContext.Provider>;
}

export function useCallContext() { const c = useContext(CallContext); if (!c) throw new Error('No CallProvider'); return c; }
