import { useCallback, useEffect, useRef, useState } from 'react';
import type { Prediction, ScoreResult, AttackParams } from '../types';
import type { RoomState, OpponentState } from '../types/battle';
import { useNostr } from './useNostr';
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
import { calculate, formatDisplay, operatorToSymbol } from '../utils';
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
  incomingAttack: AttackParams | null;
  isUnderAttack: boolean;

  // Actions
  handleKey: (key: string) => void;
  startGame: () => void;
  surrender: () => void;
}

export function useBattleMode(): UseBattleModeReturn {
  // Core hooks
  const nostr = useNostr();
  const room = useBattleRoom(nostr);
  const calculator = useCalculator();
  const prediction = useSeededPrediction();
  const elimination = useElimination();

  // Battle-specific state
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [justPressedEqual, setJustPressedEqual] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');
  const [incomingAttack] = useState<AttackParams | null>(null);
  const [isUnderAttack, setIsUnderAttack] = useState(false);
  const [pendingAttackPower, setPendingAttackPower] = useState(0);

  // Game started state (triggers timer)
  const [gameStarted, setGameStarted] = useState(false);

  // Refs
  const displayRef = useRef(calculator.display);

  // Sync display ref
  useEffect(() => {
    displayRef.current = calculator.display;
  }, [calculator.display]);

  // Listen for attack events from room
  useEffect(() => {
    const handleAttack = (e: CustomEvent<{ power: number; timestamp: number }>) => {
      setPendingAttackPower(e.detail.power);
      setIsUnderAttack(true);
    };

    const handleOpponentGameOver = () => {
      // Opponent lost, we won!
      setIsGameOver(true);
      setIsWinner(true);
      prediction.clearCountdown();
    };

    window.addEventListener('sasso-attack', handleAttack as EventListener);
    window.addEventListener('sasso-opponent-gameover', handleOpponentGameOver as EventListener);
    return () => {
      window.removeEventListener('sasso-attack', handleAttack as EventListener);
      window.removeEventListener(
        'sasso-opponent-gameover',
        handleOpponentGameOver as EventListener
      );
    };
  }, [prediction]);

  // Send state updates when display/score changes
  useEffect(() => {
    if (room.status === 'playing' || room.status === 'ready') {
      room.sendState(calculator.display, elimination.score, elimination.chains, calculationHistory);
    }
  }, [calculator.display, elimination.score, elimination.chains, calculationHistory, room]);

  // Ref to hold latest applyPrediction to avoid stale closure
  const applyPredictionRef = useRef<() => void>(() => {});

  // Prediction timer - starts when game is started
  useEffect(() => {
    if (!gameStarted || isGameOver) {
      return;
    }

    prediction.countdownRef.current = window.setInterval(() => {
      prediction.setCountdown((prev) => {
        if (prev <= 100) {
          applyPredictionRef.current();
          return COUNTDOWN_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      prediction.clearCountdown();
    };
  }, [gameStarted, isGameOver, prediction]);

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

    // Check for elimination
    const indices = findEliminationIndices(newDisplay);
    if (indices.length > 0) {
      const digitCountBeforeElimination = getDigitCount(newDisplay);
      const currentCalcCount = elimination.calculationCountRef.current;

      elimination.setEliminatingIndices(indices);

      setTimeout(() => {
        const eliminationResult = processElimination(newDisplay);
        const finalDisplay = eliminationResult.result;

        calculator.setDisplay(finalDisplay);
        displayRef.current = finalDisplay;
        elimination.setEliminatingIndices([]);
        elimination.setChains(eliminationResult.chains);

        const scoreResult = calculateScore({
          eliminated: eliminationResult.eliminated,
          chains: eliminationResult.chains,
          calculationsSinceLastElimination: currentCalcCount,
          digitCountBeforeElimination,
        });
        elimination.setScore((prev) => prev + scoreResult.totalScore);
        elimination.setLastScoreBreakdown(scoreResult);
        elimination.setCalculationCount(0);
        elimination.calculationCountRef.current = 0;

        // Check for attack trigger
        if (shouldTriggerAttack(eliminationResult)) {
          room.sendAttack(scoreResult.attackPower);
        }

        // Check overflow
        if (checkOverflow(finalDisplay)) {
          handleGameOver('overflow');
          return;
        }

        // Check for chain
        setTimeout(() => {
          const nextIndices = findEliminationIndices(finalDisplay);
          if (nextIndices.length > 0) {
            elimination.applyEliminationWithAnimation(
              finalDisplay,
              eliminationResult.chains,
              digitCountBeforeElimination,
              currentCalcCount,
              (newDisp) => {
                calculator.setDisplay(newDisp);
                displayRef.current = newDisp;
              }
            );
          }
        }, CHAIN_CHECK_DELAY_MS);
      }, ELIMINATION_ANIMATION_MS);
    } else {
      if (checkOverflow(newDisplay)) {
        handleGameOver('overflow');
        return;
      }
    }

    // Generate next prediction (with attack power if under attack)
    prediction.generateNextPrediction(pendingAttackPower);
    if (pendingAttackPower > 0) {
      setPendingAttackPower(0);
      setIsUnderAttack(false);
    }
  }, [prediction, calculator, elimination, room, pendingAttackPower]);

  // Keep ref updated with latest applyPrediction
  useEffect(() => {
    applyPredictionRef.current = applyPrediction;
  }, [applyPrediction]);

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

  // Leave room (wraps room.leaveRoom to also reset local state)
  const leaveRoom = useCallback(() => {
    room.leaveRoom();
    setGameStarted(false);
    setIsGameOver(false);
    setIsSurrender(false);
    setIsWinner(null);
    prediction.resetPrediction();
    calculator.resetCalculator();
    elimination.resetElimination();
  }, [room, prediction, calculator, elimination]);

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
    // Room
    roomState: {
      roomId: room.roomId,
      status: room.status,
      isHost: room.isHost,
      seed: room.seed,
    },
    opponent: room.opponent,
    createRoom: room.createRoom,
    joinRoom: room.joinRoom,
    leaveRoom,

    // Game state
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

    // Attack
    incomingAttack,
    isUnderAttack,

    // Actions
    handleKey,
    startGame,
    surrender,
  };
}
