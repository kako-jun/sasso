// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBattleLifecycle } from './useBattleLifecycle';
import { BATTLE_EVENTS } from '../utils';
import type { UseArenaReturn } from './useArena';
import type { UseSeededPredictionReturn } from './useSeededPrediction';
import type { UseCalculatorReturn } from './useCalculator';
import type { UseEliminationReturn } from './useElimination';
import type { UseBattleAttackReturn } from './useBattleAttack';

// Minimal fakes: only the members useBattleLifecycle touches are real fns,
// the rest are cast through unknown so we exercise the FSM in isolation.
function makeFakes() {
  const prediction = {
    initWithSeed: vi.fn(),
    resetPrediction: vi.fn(),
    clearCountdown: vi.fn(),
  } as unknown as UseSeededPredictionReturn;

  const room = {
    seed: 777,
    sendGameOver: vi.fn(),
  } as unknown as UseArenaReturn;

  const calculator = {
    resetCalculator: vi.fn(),
  } as unknown as UseCalculatorReturn;

  const elimination = {
    score: 42,
    resetElimination: vi.fn(),
  } as unknown as UseEliminationReturn;

  const attack = {
    reset: vi.fn(),
  } as unknown as UseBattleAttackReturn;

  const onResetDisplay = vi.fn();
  const onStartDisplay = vi.fn();

  return { room, prediction, calculator, elimination, attack, onResetDisplay, onStartDisplay };
}

function render(fakes = makeFakes()) {
  const hook = renderHook(() => useBattleLifecycle(fakes));
  return { ...hook, fakes };
}

describe('useBattleLifecycle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('startGame seeds prediction with room.seed and flips gameStarted', () => {
    const { result, fakes } = render();
    expect(result.current.gameStarted).toBe(false);

    act(() => result.current.startGame());

    expect(fakes.prediction.initWithSeed).toHaveBeenCalledTimes(1);
    expect(fakes.prediction.initWithSeed).toHaveBeenCalledWith(777);
    expect(fakes.calculator.resetCalculator).toHaveBeenCalled();
    expect(fakes.elimination.resetElimination).toHaveBeenCalled();
    expect(fakes.onStartDisplay).toHaveBeenCalled();
    expect(result.current.gameStarted).toBe(true);
  });

  it('startGame is a no-op when there is no seed', () => {
    const fakes = makeFakes();
    (fakes.room as { seed: number }).seed = 0;
    const { result } = render(fakes);

    act(() => result.current.startGame());
    expect(fakes.prediction.initWithSeed).not.toHaveBeenCalled();
    expect(result.current.gameStarted).toBe(false);
  });

  it('handleGameOver marks loss and notifies the room', () => {
    const { result, fakes } = render();

    act(() => result.current.handleGameOver('overflow'));

    expect(result.current.isGameOver).toBe(true);
    expect(result.current.isWinner).toBe(false);
    expect(fakes.prediction.clearCountdown).toHaveBeenCalled();
    expect(fakes.room.sendGameOver).toHaveBeenCalledWith('overflow', 42);
  });

  it('surrender only fires after the game started', () => {
    const { result, fakes } = render();

    // Before start: nothing happens
    act(() => result.current.surrender());
    expect(result.current.isSurrender).toBe(false);
    expect(fakes.room.sendGameOver).not.toHaveBeenCalled();

    act(() => result.current.startGame());
    act(() => result.current.surrender());

    expect(result.current.isSurrender).toBe(true);
    expect(result.current.isGameOver).toBe(true);
    expect(fakes.room.sendGameOver).toHaveBeenCalledWith('surrender', 42);
  });

  it('resetGameState(seed) re-seeds; resetGameState() resets prediction', () => {
    const { result, fakes } = render();

    act(() => result.current.resetGameState(999));
    expect(fakes.prediction.initWithSeed).toHaveBeenCalledWith(999);
    expect(fakes.prediction.resetPrediction).not.toHaveBeenCalled();

    vi.clearAllMocks();

    act(() => result.current.resetGameState());
    expect(fakes.prediction.resetPrediction).toHaveBeenCalled();
    expect(fakes.prediction.initWithSeed).not.toHaveBeenCalled();
    expect(fakes.attack.reset).toHaveBeenCalled();
    expect(fakes.onResetDisplay).toHaveBeenCalled();
  });

  it('OPPONENT_GAMEOVER event marks a win', () => {
    const { result, fakes } = render();

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.OPPONENT_GAMEOVER));
    });

    expect(result.current.isGameOver).toBe(true);
    expect(result.current.isWinner).toBe(true);
    expect(fakes.prediction.clearCountdown).toHaveBeenCalled();
  });

  it('OPPONENT_DISCONNECT is ignored before the game starts', () => {
    const { result } = render();

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.OPPONENT_DISCONNECT));
    });

    expect(result.current.isGameOver).toBe(false);
    expect(result.current.isWinner).toBeNull();
  });

  it('OPPONENT_DISCONNECT marks a win once the game is running', () => {
    const { result } = render();
    act(() => result.current.startGame());

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.OPPONENT_DISCONNECT));
    });

    expect(result.current.isGameOver).toBe(true);
    expect(result.current.isWinner).toBe(true);
  });

  it('OPPONENT_DISCONNECT is ignored after the game is already over', () => {
    const { result } = render();
    act(() => result.current.startGame());
    act(() => result.current.handleGameOver('overflow')); // isWinner=false
    expect(result.current.isWinner).toBe(false);

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.OPPONENT_DISCONNECT));
    });
    // guard (!isGameOver) blocks the flip to winner=true
    expect(result.current.isWinner).toBe(false);
  });

  it('REMATCH_START re-seeds via resetGameState', () => {
    const { result, fakes } = render();

    act(() => {
      window.dispatchEvent(
        new CustomEvent(BATTLE_EVENTS.REMATCH_START, { detail: { seed: 555 } })
      );
    });

    expect(fakes.prediction.initWithSeed).toHaveBeenCalledWith(555);
    expect(result.current.gameStarted).toBe(false);
    expect(result.current.isGameOver).toBe(false);
  });
});
