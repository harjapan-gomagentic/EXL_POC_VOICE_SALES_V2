import React, { createContext, useContext, useReducer } from 'react';
import type { ScenarioACoachDebrief } from '../lib/coachDebrief';

export type Screen = 'login' | 'brief' | 'call';

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
  coachDebrief: null,
  coachDebriefLoading: false,
};

export type Action =
  | { type: 'START_BRIEF'; name: string; role: string }
  | { type: 'START_CALL' }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_RECORDING'; value: boolean }
  | { type: 'END_CALL' }
  | { type: 'SET_COACH_DEBRIEF'; data: ScenarioACoachDebrief }
  | { type: 'SET_COACH_DEBRIEF_LOADING'; loading: boolean }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_BRIEF':
      return { ...state, screen: 'brief', repName: action.name, repRole: action.role };
    case 'START_CALL':
      return {
        ...state,
        screen: 'call',
        messages: [],
        callEnded: false,
        coachDebrief: null,
        coachDebriefLoading: false,
      };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.value };
    case 'END_CALL':
      return { ...state, callEnded: true, coachDebrief: null, coachDebriefLoading: false };
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
