import { useCallback, useEffect, useRef, useState } from 'react';
import type { Prediction, ScoreResult } from '../types';
import type { RoomState, OpponentState } from '../types/battle';
import { useBattleRoom } from './useBattleRoom';
import { useSeededPrediction } from './useSeededPrediction';
import { useCalculator } from './useCalculator';
import { useElimination } from './useElimination';
import {
  processElimination,
  checkOverflow,
  findEliminationIndices,
  calculateScore,
  shouldTriggerAttack,
  getDigitCount,
} from '../game';
import { calculate, formatDisplay, operatorToSymbol, BATTLE_EVENTS } from '../utils';
import { COUNTDOWN_TIME, ELIMINATION_ANIMATION_MS, CHAIN_CHECK_DELAY_MS } from '../constants';

export interface UseBattleModeReturn {
  // Room state
  roomState: RoomState;
  opponent: OpponentState | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;

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
  const room = useBattleRoom();
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

  // Refs
  const displayRef = useRef(calculator.display);
  const applyPredictionRef = useRef<() => void>(() => {});
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
      });
    }
  }, [calculator.display, elimination.score, elimination.chains, calculationHistory, room]);

  // Prediction timer - starts when game is started
  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    prediction.countdownRef.current = window.setInterval(() => {
      prediction.setCountdown((prev) => {
        if (prev <= 100) {
          applyPredictionRef.current();
          return COUNTDOWN_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => prediction.clearCountdown();
  }, [gameStarted, isGameOver, prediction]);

  // Process elimination result and handle scoring/attack
  const processEliminationResult = useCallback(
    (newDisplay: string, digitCountBefore: number, calcCount: number) => {
      const eliminationResult = processElimination(newDisplay);
      const finalDisplay = eliminationResult.result;

      calculator.setDisplay(finalDisplay);
      displayRef.current = finalDisplay;
      elimination.setEliminatingIndices([]);
      elimination.setChains(eliminationResult.chains);

      const scoreResult = calculateScore({
        eliminated: eliminationResult.eliminated,
        chains: eliminationResult.chains,
        calculationsSinceLastElimination: calcCount,
        digitCountBeforeElimination: digitCountBefore,
      });

      elimination.setScore((prev) => prev + scoreResult.totalScore);
      elimination.setLastScoreBreakdown(scoreResult);
      elimination.setCalculationCount(0);
      elimination.calculationCountRef.current = 0;

      if (shouldTriggerAttack(eliminationResult)) {
        room.sendAttack(scoreResult.attackPower);
      }

      if (checkOverflow(finalDisplay)) {
        handleGameOverRef.current('overflow');
        return;
      }

      // Check for chain
      setTimeout(() => {
        const nextIndices = findEliminationIndices(finalDisplay);
        if (nextIndices.length > 0) {
          elimination.applyEliminationWithAnimation(
            finalDisplay,
            eliminationResult.chains,
            digitCountBefore,
            calcCount,
            (newDisp) => {
              calculator.setDisplay(newDisp);
              displayRef.current = newDisp;
            }
          );
        }
      }, CHAIN_CHECK_DELAY_MS);
    },
    [calculator, elimination, room]
  );

  // Apply prediction (auto-execute when countdown reaches 0)
  const applyPrediction = useCallback(() => {
    if (!prediction.prediction) return;

    const currentValue = parseFloat(displayRef.current);
    const result = calculate(
      currentValue,
      prediction.prediction.operand,
      prediction.prediction.operator
    );
    const newDisplay = formatDisplay(result);

    setCalculationHistory(
      `${displayRef.current} ${operatorToSymbol(prediction.prediction.operator)} ${prediction.prediction.operand} = ${newDisplay}`
    );

    calculator.setDisplay(newDisplay);
    displayRef.current = newDisplay;

    const indices = findEliminationIndices(newDisplay);
    if (indices.length > 0) {
      const digitCountBefore = getDigitCount(newDisplay);
      const calcCount = elimination.calculationCountRef.current;

      elimination.setEliminatingIndices(indices);
      setTimeout(
        () => processEliminationResult(newDisplay, digitCountBefore, calcCount),
        ELIMINATION_ANIMATION_MS
      );
    } else if (checkOverflow(newDisplay)) {
      handleGameOverRef.current('overflow');
      return;
    }

    // Generate next prediction (with attack power if under attack)
    prediction.generateNextPrediction(pendingAttackPower);
    if (pendingAttackPower > 0) {
      setPendingAttackPower(0);
      setIsUnderAttack(false);
    }
  }, [prediction, calculator, elimination, pendingAttackPower, processEliminationResult]);

  // Keep ref updated with latest applyPrediction
  useEffect(() => {
    applyPredictionRef.current = applyPrediction;
  }, [applyPrediction]);

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

  // Surrender
  const surrender = useCallback(() => {
    setIsSurrender(true);
    handleGameOver('surrender');
  }, [handleGameOver]);

  // Leave room
  const leaveRoom = useCallback(() => {
    room.leaveRoom();
    resetGameState();
  }, [room, resetGameState]);

  // Handle key input
  const handleKey = useCallback(
    (key: string) => {
      if (isGameOver) return;

      // Start game on first key press
      if (room.status === 'ready' && !gameStarted) {
        startGame();
      }

      // Surrender on digit after =
      if (justPressedEqual && /^\d$/.test(key)) {
        surrender();
        return;
      }

      setJustPressedEqual(false);

      // Digit input
      if (/^\d$/.test(key)) {
        calculator.inputDigit(key);
        return;
      }

      // Special keys
      if (key === 'C' || key === 'E') {
        surrender();
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
        }
        return;
      }

      // Operator keys
      if (['+', '-', '*', '/'].includes(key)) {
        const result = calculator.performOperation(key as '+' | '-' | '*' | '/');
        if (result) {
          elimination.incrementCalculationCount();
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
