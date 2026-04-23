import React, { createContext, useContext, useReducer } from 'react';
import type { CoachOutcome, ScenarioACoachDebrief } from '../lib/coachDebrief';

export type Screen = 'login' | 'how_it_works' | 'brief' | 'call' | 'replay' | 'scorecard';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  spinType?: string;
  feedback?: string;
}

export interface AppState {
  screen: Screen;
  repName: string;
  repRole: string;
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  callEnded: boolean;
  callOutcome: CoachOutcome;
  coachDebrief: ScenarioACoachDebrief | null;
  coachDebriefLoading: boolean;
}

const initialState: AppState = {
  screen: 'login',
  repName: '',
  repRole: '',
  messages: [],
  isLoading: false,
  isRecording: false,
  callEnded: false,
  callOutcome: 'no_sale',
  coachDebrief: null,
  coachDebriefLoading: false,
};

export type Action =
  | { type: 'START_BRIEF'; name: string; role: string }
  | { type: 'START_DISCOVERY' }
  | { type: 'START_CALL' }
  | { type: 'OPEN_SCORECARD' }
  | { type: 'OPEN_REPLAY' }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_RECORDING'; value: boolean }
  | { type: 'END_CALL'; outcome: CoachOutcome }
  | { type: 'SET_COACH_DEBRIEF'; data: ScenarioACoachDebrief }
  | { type: 'SET_COACH_DEBRIEF_LOADING'; loading: boolean }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_BRIEF':
      return { ...state, screen: 'how_it_works', repName: action.name, repRole: action.role };
    case 'START_DISCOVERY':
      return { ...state, screen: 'brief' };
    case 'START_CALL':
      return {
        ...state,
        screen: 'call',
        messages: [],
        callEnded: false,
        callOutcome: 'no_sale',
        coachDebrief: null,
        coachDebriefLoading: false,
      };
    case 'OPEN_SCORECARD':
      return { ...state, screen: 'scorecard' };
    case 'OPEN_REPLAY':
      return { ...state, screen: 'replay' };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.value };
    case 'END_CALL':
      return {
        ...state,
        screen: 'replay',
        callEnded: true,
        callOutcome: action.outcome,
        isLoading: false,
        coachDebrief: null,
        coachDebriefLoading: false,
      };
    case 'SET_COACH_DEBRIEF':
      return { ...state, coachDebrief: action.data, coachDebriefLoading: false };
    case 'SET_COACH_DEBRIEF_LOADING':
      return { ...state, coachDebriefLoading: action.loading };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface Ctx { state: AppState; dispatch: React.Dispatch<Action> }
const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
