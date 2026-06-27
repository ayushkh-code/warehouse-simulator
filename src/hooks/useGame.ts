import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buyEquipment,
  buyInventory,
  buyTraining,
  createInitialState,
  dismissNotification,
  fireLabor,
  hireLabor,
  payRepair,
  setWage,
  tick,
} from '../game/engine';
import type { Difficulty, GameState, InventorySource } from '../game/types';

const BASE_TICK_MS = 4000;

export function useGame() {
  const [state, setState] = useState<GameState>(() => createInitialState('normal'));
  const [showDifficulty, setShowDifficulty] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectDifficulty = useCallback((difficulty: Difficulty) => {
    setState(createInitialState(difficulty));
    setShowDifficulty(false);
  }, []);

  const beginGame = useCallback(() => {
    setState((s) => ({ ...s, gameStarted: true, paused: false }));
  }, []);

  const resetGame = useCallback(() => {
    setShowDifficulty(true);
    setState(createInitialState('normal'));
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => (s.gameStarted && !s.gameOver ? { ...s, paused: !s.paused } : s));
  }, []);

  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    setState((s) => ({ ...s, speed }));
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!state.gameStarted || state.paused || state.gameOver || showDifficulty) return;

    const ms = BASE_TICK_MS / state.speed;
    intervalRef.current = setInterval(() => {
      setState((s) => tick(s));
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.gameStarted, state.paused, state.gameOver, state.speed, showDifficulty]);

  const actions = {
    buyInventory: (qty: number, source: InventorySource) =>
      setState((s) => buyInventory(s, qty, source)),
    hireLabor: (count: number) => setState((s) => hireLabor(s, count)),
    fireLabor: (count: number) => setState((s) => fireLabor(s, count)),
    setWage: (wage: number) => setState((s) => setWage(s, wage)),
    buyTraining: (amount: number) => setState((s) => buyTraining(s, amount)),
    buyEquipment: (amount: number) => setState((s) => buyEquipment(s, amount)),
    payRepair: () => setState((s) => payRepair(s)),
    dismissNotification: (id: string) =>
      setState((s) => dismissNotification(s, id)),
  };

  return {
    state,
    showDifficulty,
    selectDifficulty,
    beginGame,
    resetGame,
    togglePause,
    setSpeed,
    actions,
  };
}
