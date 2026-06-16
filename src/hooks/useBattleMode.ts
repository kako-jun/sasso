import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Prediction, ScoreResult } from '../types';
import type { RoomState, OpponentState } from '../types/battle';
import { useArena } from './useArena';
import { useSeededPrediction } from './useSeededPrediction';
import { useCalculator } from './useCalculator';
import { useElimination } from './useElimination';
import { usePredictionTimer } from './usePredictionTimer';
import { useBattleAttack } from './useBattleAttack';
import { useBattleLifecycle } from './useBattleLifecycle';
import { checkOverflow } from '../game';
import { operatorToSymbol } from '../utils';

export interface UseBattleModeReturn {
  // Room state
  roomState: RoomState;
  opponent: OpponentState | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  reconnect: () => Promise<boolean>;

  // Game state (self)
  display: string;
  score: number;
  chains: number;
  prediction: Prediction | null;
  countdown: number;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  isWinner: boolean | null;
  isDisconnectEnd: boolean;
  eliminatingIndices: number[];
  calculationHistory: string;
  lastScoreBreakdown: ScoreResult | null;

  // Attack state
  isUnderAttack: boolean;

  // Rematch state
  rematchRequested: boolean;
  opponentRematchRequested: boolean;

  // Actions
  handleKey: (key: string) => void;
  startGame: () => void;
  surrender: () => void;
  requestRematch: () => void;
}

export function useBattleMode(): UseBattleModeReturn {
  // Core hooks
  const room = useArena();
  const calculator = useCalculator();
  const prediction = useSeededPrediction();
  const elimination = useElimination();
  const attack = useBattleAttack();

  // Display / input state owned by the orchestrator
  const [justPressedEqual, setJustPressedEqual] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Refs
  const displayRef = useRef(calculator.display);
  const handleGameOverRef = useRef<(reason: 'overflow' | 'surrender' | 'disconnect') => void>(
    () => {}
  );

  // Sync display ref
  useEffect(() => {
    displayRef.current = calculator.display;
  }, [calculator.display]);

  // Clear orchestrator-owned display state (used by lifecycle reset)
  const resetDisplay = useCallback(() => {
    setCalculationHistory('');
    setLastKey(null);
  }, []);

  // Clear the display state that startGame clears (history only, not lastKey)
  const startDisplay = useCallback(() => {
    setCalculationHistory('');
  }, []);

  // Battle lifecycle FSM (game start / surrender / game over / reset)
  const lifecycle = useBattleLifecycle({
    room,
    prediction,
    calculator,
    elimination,
    attack,
    onResetDisplay: resetDisplay,
    onStartDisplay: startDisplay,
  });
  const {
    gameStarted,
    isGameOver,
    isSurrender,
    isWinner,
    isDisconnectEnd,
    startGame,
    surrender,
    resetGameState,
  } = lifecycle;

  // Keep handleGameOver ref updated (avoids stale closure in applyPrediction / handleKey)
  useEffect(() => {
    handleGameOverRef.current = lifecycle.handleGameOver;
  }, [lifecycle.handleGameOver]);

  // Send state updates when display/score changes.
  // Driven by our own gameStarted/isGameOver, NOT room.status: nostr-arena never
  // sets 'playing' (the old `=== 'playing'` branch was dead) — during play the room
  // stays in 'ready' (it only moves to 'finished' on gameover), so sync must follow
  // the local game lifecycle instead.
  useEffect(() => {
    // Gated on `gameStarted && !isGameOver`: when the losing move sets isGameOver=true,
    // that final render is not sent, so the opponent's displayed score can be one
    // elimination stale at game end. The game is over; the match outcome is unaffected.
    if (gameStarted && !isGameOver) {
      const state = {
        display: calculator.display,
        score: elimination.score,
        chains: elimination.chains,
        calculationHistory,
        prediction: prediction.prediction,
        countdown: prediction.countdown,
        lastScoreBreakdown: elimination.lastScoreBreakdown,
        isUnderAttack: attack.isUnderAttack,
        lastKey,
        attack: attack.outgoingAttack ?? undefined,
      };
      room.sendState(state);
      // Clear attack after sending
      if (attack.outgoingAttack) {
        attack.clearOutgoingAttack();
      }
    }
  }, [
    calculator.display,
    elimination.score,
    elimination.chains,
    calculationHistory,
    prediction.prediction,
    prediction.countdown,
    elimination.lastScoreBreakdown,
    attack.isUnderAttack,
    lastKey,
    attack.outgoingAttack,
    attack,
    room,
    gameStarted,
    isGameOver,
  ]);

  // Prediction timer callbacks
  const predictionCallbacks = useMemo(
    () => ({
      onDisplayUpdate: (display: string) => {
        calculator.setDisplay(display);
      },
      onOverflow: () => handleGameOverRef.current('overflow'),
      onAttack: (power: number) => attack.queueOutgoingAttack(power),
      onCalculationHistory: setCalculationHistory,
      generateNextPrediction: (attackPower?: number) =>
        prediction.generateNextPrediction(attackPower),
      finalizePendingCalculation: (): string | null => {
        // If there's a pending operation (e.g., 100 + or 100 + 1), discard it
        // and revert to the accumulator value (the value before operator was pressed)
        if (calculator.operator !== null && calculator.accumulator !== null) {
          const originalValue = String(calculator.accumulator);
          calculator.resetCalculator();
          calculator.setDisplay(originalValue);
          displayRef.current = originalValue;
          return originalValue;
        }
        return null;
      },
    }),
    [calculator, prediction, attack]
  );

  // Use shared prediction timer
  usePredictionTimer({
    predictionHook: prediction,
    eliminationHook: elimination,
    displayRef,
    isActive: gameStarted && !isGameOver,
    callbacks: predictionCallbacks,
    pendingAttackPower: attack.pendingAttackPower,
    onAttackApplied: attack.onIncomingAttackApplied,
  });

  // Leave room
  const leaveRoom = useCallback(() => {
    room.leaveRoom();
    resetGameState();
  }, [room, resetGameState]);

  // Handle key input
  const handleKey = useCallback(
    (key: string) => {
      if (isGameOver) return;

      // Track last key for opponent display (brief animation)
      setLastKey(key);
      setTimeout(() => setLastKey(null), 150);

      // Start game on first key press
      if (room.status === 'ready' && !gameStarted) {
        startGame();
      }

      // Surrender on digit after = (only during gameplay)
      if (gameStarted && justPressedEqual && /^\d$/.test(key)) {
        surrender();
        return;
      }

      setJustPressedEqual(false);

      // Digit input
      if (/^\d$/.test(key)) {
        calculator.inputDigit(key);
        return;
      }

      // Special keys - C/E only surrenders during gameplay
      if (key === 'C' || key === 'E') {
        if (gameStarted) {
          surrender();
        }
        return;
      }

      if (key === '.') {
        calculator.inputDecimal();
        return;
      }

      // Equal key
      if (key === '=') {
        const result = calculator.handleEqual();
        if (result) {
          elimination.incrementCalculationCount();
          setCalculationHistory(
            `${result.left} ${operatorToSymbol(result.op ?? '')} ${result.right} = ${result.newDisplay}`
          );
          setJustPressedEqual(true);

          // Check overflow immediately after calculation
          if (checkOverflow(result.newDisplay)) {
            handleGameOverRef.current('overflow');
            return;
          }
        }
        return;
      }

      // Operator keys
      if (['+', '-', '*', '/'].includes(key)) {
        const result = calculator.performOperation(key as '+' | '-' | '*' | '/');
        if (result) {
          elimination.incrementCalculationCount();

          // Check overflow immediately after calculation
          if (checkOverflow(result.newDisplay)) {
            handleGameOverRef.current('overflow');
            return;
          }
        }
      }
    },
    [
      isGameOver,
      room.status,
      gameStarted,
      justPressedEqual,
      calculator,
      elimination,
      startGame,
      surrender,
    ]
  );

  return {
    roomState: {
      roomId: room.roomId,
      status: room.status,
      isHost: room.isHost,
      seed: room.seed,
      createdAt: room.createdAt,
      rematchRequested: room.rematchRequested,
    },
    opponent: room.opponent,
    createRoom: room.createRoom,
    joinRoom: room.joinRoom,
    leaveRoom,
    reconnect: room.reconnect,

    display: calculator.display,
    score: elimination.score,
    chains: elimination.chains,
    prediction: prediction.prediction,
    countdown: prediction.countdown,
    gameStarted,
    isGameOver,
    isSurrender,
    isWinner,
    isDisconnectEnd,
    eliminatingIndices: elimination.eliminatingIndices,
    calculationHistory,
    lastScoreBreakdown: elimination.lastScoreBreakdown,

    isUnderAttack: attack.isUnderAttack,

    rematchRequested: room.rematchRequested || false,
    opponentRematchRequested: room.opponent?.rematchRequested || false,

    handleKey,
    startGame,
    surrender,
    requestRematch: room.requestRematch,
  };
}
