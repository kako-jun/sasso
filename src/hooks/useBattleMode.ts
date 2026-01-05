import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Prediction, ScoreResult } from '../types';
import type { RoomState, OpponentState } from '../types/battle';
import { useArena } from './useArena';
import { useSeededPrediction } from './useSeededPrediction';
import { useCalculator } from './useCalculator';
import { useElimination } from './useElimination';
import { usePredictionTimer } from './usePredictionTimer';
import { checkOverflow, findEliminationIndices } from '../game';
import { operatorToSymbol, BATTLE_EVENTS } from '../utils';

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

  // Battle-specific state
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [justPressedEqual, setJustPressedEqual] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');
  const [isUnderAttack, setIsUnderAttack] = useState(false);
  const [pendingAttackPower, setPendingAttackPower] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
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
      setCalculationHistory('');
      setGameStarted(false);
      setPendingAttackPower(0);
      setIsUnderAttack(false);
      setLastKey(null);
    },
    [prediction, calculator, elimination]
  );

  // Handle game over (defined early, uses ref to avoid stale closure in applyPrediction)
  const handleGameOver = useCallback(
    (reason: 'overflow' | 'surrender' | 'disconnect') => {
      setIsGameOver(true);
      setIsWinner(false);
      prediction.clearCountdown();
      room.sendGameOver(reason, elimination.score);
    },
    [prediction, room, elimination.score]
  );

  // Keep handleGameOver ref updated
  useEffect(() => {
    handleGameOverRef.current = handleGameOver;
  }, [handleGameOver]);

  // Listen for battle events from room
  useEffect(() => {
    const handleAttack = (e: CustomEvent<{ power: number }>) => {
      setPendingAttackPower(e.detail.power);
      setIsUnderAttack(true);
    };

    const handleOpponentGameOver = () => {
      setIsGameOver(true);
      setIsWinner(true);
      prediction.clearCountdown();
    };

    const handleOpponentDisconnect = () => {
      if (gameStarted && !isGameOver) {
        setIsGameOver(true);
        setIsWinner(true);
        prediction.clearCountdown();
      }
    };

    const handleRematchStart = (e: CustomEvent<{ seed: number }>) => {
      resetGameState(e.detail.seed);
    };

    window.addEventListener(BATTLE_EVENTS.ATTACK, handleAttack as EventListener);
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
      window.removeEventListener(BATTLE_EVENTS.ATTACK, handleAttack as EventListener);
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
  }, [prediction, gameStarted, isGameOver, resetGameState]);

  // Send state updates when display/score changes
  useEffect(() => {
    if (room.status === 'playing' || room.status === 'ready') {
      room.sendState({
        display: calculator.display,
        score: elimination.score,
        chains: elimination.chains,
        calculationHistory,
        prediction: prediction.prediction,
        countdown: prediction.countdown,
        lastScoreBreakdown: elimination.lastScoreBreakdown,
        isUnderAttack,
        lastKey,
      });
    }
  }, [
    calculator.display,
    elimination.score,
    elimination.chains,
    calculationHistory,
    prediction.prediction,
    prediction.countdown,
    elimination.lastScoreBreakdown,
    isUnderAttack,
    lastKey,
    room,
  ]);

  // Prediction timer callbacks
  const predictionCallbacks = useMemo(
    () => ({
      onDisplayUpdate: (display: string) => {
        calculator.setDisplay(display);
      },
      onOverflow: () => handleGameOverRef.current('overflow'),
      onAttack: (power: number) => room.sendAttack(power),
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
    [calculator, room, prediction]
  );

  // Use shared prediction timer
  usePredictionTimer({
    predictionHook: prediction,
    eliminationHook: elimination,
    displayRef,
    isActive: gameStarted && !isGameOver,
    callbacks: predictionCallbacks,
    pendingAttackPower,
    onAttackApplied: () => {
      setPendingAttackPower(0);
      setIsUnderAttack(false);
    },
  });

  // Start the game
  const startGame = useCallback(() => {
    if (room.seed && !gameStarted) {
      prediction.initWithSeed(room.seed);
      calculator.resetCalculator();
      elimination.resetElimination();
      setIsGameOver(false);
      setIsSurrender(false);
      setIsWinner(null);
      setCalculationHistory('');
      setGameStarted(true);
    }
  }, [room.seed, gameStarted, prediction, calculator, elimination]);

  // Surrender - only works if game has actually started
  const surrender = useCallback(() => {
    if (!gameStarted) return; // Safety check: can't surrender before game starts
    setIsSurrender(true);
    handleGameOver('surrender');
  }, [gameStarted, handleGameOver]);

  // Leave room
  const leaveRoom = useCallback(() => {
    room.leaveRoom();
    resetGameState();
  }, [room, resetGameState]);

  // Start elimination chain for manual calculations (= or operator)
  const startManualElimination = useCallback(
    (newDisplay: string) => {
      const indices = findEliminationIndices(newDisplay);
      if (indices.length > 0) {
        elimination.startEliminationChain(newDisplay, {
          onDisplayUpdate: (display) => {
            calculator.setDisplay(display);
            displayRef.current = display;
          },
          onOverflow: () => handleGameOverRef.current('overflow'),
          onAttack: (power) => room.sendAttack(power),
        });
      }
    },
    [elimination, calculator, room]
  );

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

          // Start elimination chain for manual calculation
          startManualElimination(result.newDisplay);
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

          // Start elimination chain for manual calculation
          startManualElimination(result.newDisplay);
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
      startManualElimination,
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
    eliminatingIndices: elimination.eliminatingIndices,
    calculationHistory,
    lastScoreBreakdown: elimination.lastScoreBreakdown,

    isUnderAttack,

    rematchRequested: room.rematchRequested || false,
    opponentRematchRequested: room.opponent?.rematchRequested || false,

    handleKey,
    startGame,
    surrender,
    requestRematch: room.requestRematch,
  };
}
