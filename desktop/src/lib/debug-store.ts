"use client";

import { create } from "zustand";

export interface RawEvent {
  seq: number;
  timestamp: number;
  type: string;
  raw: Record<string, unknown>;
}

interface DebugState {
  events: RawEvent[];
  isOpen: boolean;
  filter: string;
  autoScroll: boolean;

  addEvent: (raw: Record<string, unknown>, timestamp: number) => void;
  clearEvents: () => void;
  toggleOpen: () => void;
  setFilter: (filter: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

let seq = 0;

export const useDebugStore = create<DebugState>()((set) => ({
  events: [],
  isOpen: false,
  filter: "",
  autoScroll: true,

  addEvent: (raw, timestamp) => {
    seq++;
    const event: RawEvent = {
      seq,
      timestamp,
      type: (raw.type as string) || "unknown",
      raw,
    };
    set((state) => ({
      events: [...state.events, event],
    }));
  },

  clearEvents: () => {
    seq = 0;
    set({ events: [] });
  },

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setFilter: (filter) => set({ filter }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
}));
