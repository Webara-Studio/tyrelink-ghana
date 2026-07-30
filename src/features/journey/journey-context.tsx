"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { Dispatch, PropsWithChildren } from "react";
import { initialJourneyState, journeyReducer } from "./journey-reducer";
import type { JourneyAction, JourneyState } from "./journey-types";

const JourneyContext = createContext<{ state: JourneyState; dispatch: Dispatch<JourneyAction> } | null>(null);

export function JourneyProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error("useJourney must be used within JourneyProvider");
  return value;
}
