import { useCallback, useEffect, useState } from 'react';
import { BATTLE_EVENTS } from '../utils';
import type { UseArenaReturn } from './useArena';
import type { UseSeededPredictionReturn } from './useSeededPrediction';
import type { UseCalculatorReturn } from './useCalculator';
import type { UseEliminationReturn } from './useElimination';
import type { UseBattleAttackReturn } from './useBattleAttack';

interface UseBattleLifecycleOptions {
  room: UseArenaReturn;
  prediction: UseSeededPredictionReturn;
  calculator: UseCalculatorReturn;
  elimination: UseEliminationReturn;
  attack: UseBattleAttackReturn;
  // Clears all useBattleMode-owned display state (calculationHistory, lastKey, ...)
  // Used by resetGameState.
  onResetDisplay: () => void;
  // Clears the display state that startGame clears (calculationHistory only,
  // matching original behavior where startGame did not reset lastKey).
  onStartDisplay: () => void;
}

export interface UseBattleLifecycleReturn {
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  isWinner: boolean | null;
  isDisconnectEnd: boolean;

  startGame: () => void;
  surrender: () => void;
  handleGameOver: (reason: 'overflow' | 'surrender' | 'disconnect') => void;
  resetGameState: (seed?: number) => void;
}

/**
 * Battle lifecycle FSM: game start / surrender / game over / reset, plus
 * opponent lifecycle events (game over, disconnect, rematch).
 *
 * Pure extraction from useBattleMode: behavior, including the timing of
 * `prediction.initWithSeed(seed)` (startGame and rematch), is unchanged.
 */
export function useBattleLifecycle({
  room,
  prediction,
  calculator,
  elimination,
  attack,
  onResetDisplay,
  onStartDisplay,
}: UseBattleLifecycleOptions): UseBattleLifecycleReturn {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [isDisconnectEnd, setIsDisconnectEnd] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Reset all game state (shared by leaveRoom and rematch)
  const resetGameState = useCallback(
    (seed?: number) => {
      if (seed !== undefined) {
        prediction.initWithSeed(seed);
      } else {
        prediction.resetPrediction();
      }
      calculator.resetCalculator();
      elimination.resetElimination();
      setIsGameOver(false);
      setIsSurrender(false);
      setIsWinner(null);
      setIsDisconnectEnd(false);
      setGameStarted(false);
      attack.reset();
      onResetDisplay();
    },
    [prediction, calculator, elimination, attack, onResetDisplay]
  );

  // Handle game over
  const handleGameOver = useCallback(
    (reason: 'overflow' | 'surrender' | 'disconnect') => {
      setIsGameOver(true);
      setIsWinner(false);
      prediction.clearCountdown();
      room.sendGameOver(reason, elimination.score);
    },
    [prediction, room, elimination.score]
  );

  // Listen for opponent lifecycle events from room
  useEffect(() => {
    const handleOpponentGameOver = (e: CustomEvent<{ reason?: string; finalScore?: number }>) => {
      if (isGameOver) return; // first finalization wins; ignore late/duplicate opponent end events
      setIsGameOver(true);
      prediction.clearCountdown();
      if (e.detail?.reason === 'disconnect') {
        // The opponent detected MY disconnect and claimed the win → I lost.
        setIsWinner(false);
        setIsDisconnectEnd(true);
      } else {
        setIsWinner(true);
      }
    };

    const handleOpponentDisconnect = () => {
      if (gameStarted && !isGameOver) {
        setIsGameOver(true);
        setIsWinner(true);
        setIsDisconnectEnd(true);
        prediction.clearCountdown();
        // Authoritative: tell the (possibly-returning) opponent they lost by disconnect,
        // so the two clients agree instead of both believing they won. Ephemeral event,
        // so a fully-departed client may miss it — best effort.
        room.sendGameOver('disconnect', elimination.score);
      }
    };

    const handleRematchStart = (e: CustomEvent<{ seed: number }>) => {
      resetGameState(e.detail.seed);
    };

    window.addEventListener(
      BATTLE_EVENTS.OPPONENT_GAMEOVER,
      handleOpponentGameOver as EventListener
    );
    window.addEventListener(
      BATTLE_EVENTS.OPPONENT_DISCONNECT,
      handleOpponentDisconnect as EventListener
    );
    window.addEventListener(BATTLE_EVENTS.REMATCH_START, handleRematchStart as EventListener);

    return () => {
      window.removeEventListener(
        BATTLE_EVENTS.OPPONENT_GAMEOVER,
        handleOpponentGameOver as EventListener
      );
      window.removeEventListener(
        BATTLE_EVENTS.OPPONENT_DISCONNECT,
        handleOpponentDisconnect as EventListener
      );
      window.removeEventListener(BATTLE_EVENTS.REMATCH_START, handleRematchStart as EventListener);
    };
  }, [prediction, gameStarted, isGameOver, resetGameState, room, elimination.score]);

  // Start the game
  const startGame = useCallback(() => {
    if (room.seed && !gameStarted) {
      prediction.initWithSeed(room.seed);
      calculator.resetCalculator();
      elimination.resetElimination();
      setIsGameOver(false);
      setIsSurrender(false);
      setIsWinner(null);
      setIsDisconnectEnd(false);
      onStartDisplay();
      setGameStarted(true);
    }
  }, [room.seed, gameStarted, prediction, calculator, elimination, onStartDisplay]);

  // Surrender - only works if game has actually started
  const surrender = useCallback(() => {
    if (!gameStarted) return; // Safety check: can't surrender before game starts
    setIsSurrender(true);
    handleGameOver('surrender');
  }, [gameStarted, handleGameOver]);

  return {
    gameStarted,
    isGameOver,
    isSurrender,
    isWinner,
    isDisconnectEnd,
    startGame,
    surrender,
    handleGameOver,
    resetGameState,
  };
}
