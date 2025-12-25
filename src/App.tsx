import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import {
  type GameMode,
  type Prediction,
  type ScoreResult,
  processElimination,
  checkOverflow,
  generateInitialState,
  generatePrediction,
  shouldTriggerAttack,
  findEliminationIndices,
  calculateScore,
  getDigitCount,
} from './gameLogic';
import { COUNTDOWN_TIME } from './constants';
import { calculate, formatDisplay } from './utils';
import type { CalcOperator } from './types';
import {
  MenuBar,
  Display,
  Keypad,
  ScoreArea,
  PredictionArea,
  CalculationHistory,
  GameOverOverlay,
  StartPrompt,
} from './components';

function App() {
  // Calculator state
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastOperator, setLastOperator] = useState<CalcOperator>(null);
  const [lastOperand, setLastOperand] = useState<number | null>(null);

  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('calculator');
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [justPressedEqual, setJustPressedEqual] = useState(false);

  // Prediction system
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  // Score
  const [score, setScore] = useState(0);
  const [chains, setChains] = useState(0);
  const [calculationCount, setCalculationCount] = useState(0);
  const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreResult | null>(null);

  // Calculation history
  const [calculationHistory, setCalculationHistory] = useState<string>('');

  // Elimination animation
  const [eliminatingIndices, setEliminatingIndices] = useState<number[]>([]);

  const countdownRef = useRef<number | null>(null);

  // Refs for timer access
  const displayRef = useRef(display);
  const predictionRef = useRef(prediction);
  const gameStartTimeRef = useRef(gameStartTime);
  const calculationCountRef = useRef(calculationCount);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);
  useEffect(() => {
    predictionRef.current = prediction;
  }, [prediction]);
  useEffect(() => {
    gameStartTimeRef.current = gameStartTime;
  }, [gameStartTime]);
  useEffect(() => {
    calculationCountRef.current = calculationCount;
  }, [calculationCount]);

  // Reset game
  const resetGame = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setLastOperator(null);
    setLastOperand(null);
    setGameStarted(false);
    setIsGameOver(false);
    setIsSurrender(false);
    setJustPressedEqual(false);
    setPrediction(null);
    setCountdown(0);
    setGameStartTime(null);
    setScore(0);
    setChains(0);
    setCalculationCount(0);
    setLastScoreBreakdown(null);
    setCalculationHistory('');
    setEliminatingIndices([]);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Change game mode
  const changeGameMode = useCallback(
    (mode: GameMode) => {
      resetGame();
      setGameMode(mode);
    },
    [resetGame]
  );

  // Start game
  const startGame = useCallback(() => {
    const initialState = generateInitialState();
    setDisplay(initialState);
    setGameStarted(true);
    setGameStartTime(Date.now());

    if (gameMode === 'endless') {
      const pred = generatePrediction(0);
      setPrediction(pred);
      setCountdown(COUNTDOWN_TIME);
    }
  }, [gameMode]);

  // Surrender
  const surrender = useCallback(() => {
    setIsSurrender(true);
    setIsGameOver(true);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Check game over
  const checkGameOverState = useCallback((displayStr: string) => {
    if (checkOverflow(displayStr)) {
      setIsGameOver(true);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, []);

  // Apply elimination with animation
  const applyEliminationWithAnimation = useCallback(
    (displayStr: string, chainCount = 0, initialDigitCount?: number, initialCalcCount?: number) => {
      const indices = findEliminationIndices(displayStr);

      if (indices.length > 0) {
        const digitCountBeforeElimination = initialDigitCount ?? getDigitCount(displayStr);
        const calcCount = initialCalcCount ?? calculationCountRef.current;

        setEliminatingIndices(indices);

        setTimeout(() => {
          const result = processElimination(displayStr);
          setDisplay(result.result);
          setEliminatingIndices([]);

          const newChainCount = chainCount + 1;
          setChains(newChainCount);

          const scoreResult = calculateScore({
            eliminated: result.eliminated,
            chains: newChainCount,
            calculationsSinceLastElimination: calcCount,
            digitCountBeforeElimination,
          });

          setScore((prev) => prev + scoreResult.totalScore);
          setLastScoreBreakdown(scoreResult);
          setCalculationCount(0);

          if (shouldTriggerAttack(result)) {
            console.log('Attack triggered! Power:', scoreResult.attackPower);
          }

          setTimeout(() => {
            const nextIndices = findEliminationIndices(result.result);
            if (nextIndices.length > 0) {
              applyEliminationWithAnimation(
                result.result,
                newChainCount,
                digitCountBeforeElimination,
                calcCount
              );
            }
          }, 100);
        }, 400);

        return displayStr;
      }

      return displayStr;
    },
    []
  );

  // Apply elimination (compatibility wrapper)
  const applyElimination = useCallback(
    (displayStr: string) => {
      const result = processElimination(displayStr);

      if (result.eliminated > 0) {
        applyEliminationWithAnimation(displayStr);
        return result.result;
      }

      return displayStr;
    },
    [applyEliminationWithAnimation]
  );

  // Apply prediction
  const applyPrediction = useCallback(() => {
    const currentPrediction = predictionRef.current;
    const currentDisplay = displayRef.current;
    const startTime = gameStartTimeRef.current;
    const currentCalcCount = calculationCountRef.current;

    if (!currentPrediction) return;

    setCalculationCount((prev) => prev + 1);

    const currentValue = parseFloat(currentDisplay);
    const result = calculate(currentValue, currentPrediction.operand, currentPrediction.operator);
    const newDisplay = formatDisplay(result);

    setCalculationHistory(
      `${currentDisplay} ${currentPrediction.operator} ${currentPrediction.operand} = ${newDisplay}`
    );

    setDisplay(newDisplay);

    const indices = findEliminationIndices(newDisplay);
    if (indices.length > 0) {
      const digitCountBeforeElimination = getDigitCount(newDisplay);

      setEliminatingIndices(indices);

      setTimeout(() => {
        const eliminationResult = processElimination(newDisplay);
        const finalDisplay = eliminationResult.result;

        setDisplay(finalDisplay);
        setEliminatingIndices([]);

        setChains(eliminationResult.chains);

        const scoreResult = calculateScore({
          eliminated: eliminationResult.eliminated,
          chains: eliminationResult.chains,
          calculationsSinceLastElimination: currentCalcCount + 1,
          digitCountBeforeElimination,
        });
        setScore((prev) => prev + scoreResult.totalScore);
        setLastScoreBreakdown(scoreResult);
        setCalculationCount(0);

        if (checkOverflow(finalDisplay)) {
          setIsGameOver(true);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return;
        }

        setTimeout(() => {
          const nextIndices = findEliminationIndices(finalDisplay);
          if (nextIndices.length > 0) {
            applyEliminationWithAnimation(
              finalDisplay,
              eliminationResult.chains,
              digitCountBeforeElimination,
              currentCalcCount + 1
            );
          }
        }, 100);
      }, 400);
    } else {
      if (checkOverflow(newDisplay)) {
        setIsGameOver(true);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }
    }

    if (startTime) {
      const elapsed = Date.now() - startTime;
      const nextPred = generatePrediction(elapsed);
      setPrediction(nextPred);
    }
  }, [applyEliminationWithAnimation]);

  // Countdown timer
  useEffect(() => {
    if (gameMode !== 'endless' || !gameStarted || isGameOver) {
      return;
    }

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 100) {
          applyPrediction();
          return COUNTDOWN_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [gameMode, gameStarted, isGameOver, applyPrediction]);

  // Calculator operations
  const clearAll = useCallback(() => {
    if (gameMode !== 'calculator' && gameStarted) {
      surrender();
      return;
    }
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setLastOperator(null);
    setLastOperand(null);
  }, [gameMode, gameStarted, surrender]);

  const clearEntry = useCallback(() => {
    if (gameMode !== 'calculator' && gameStarted) {
      surrender();
      return;
    }
    setDisplay('0');
  }, [gameMode, gameStarted, surrender]);

  const inputDigit = useCallback(
    (digit: string) => {
      if (gameMode !== 'calculator' && gameStarted && justPressedEqual) {
        surrender();
        return;
      }

      setJustPressedEqual(false);

      setDisplay((prev) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }
        return prev === '0' ? digit : prev + digit;
      });
    },
    [gameMode, gameStarted, justPressedEqual, waitingForOperand, surrender]
  );

  const inputDecimal = useCallback(() => {
    setJustPressedEqual(false);

    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return prev.includes('.') ? prev : prev + '.';
    });
  }, [waitingForOperand]);

  const performOperation = useCallback(
    (nextOp: Exclude<CalcOperator, null>) => {
      setJustPressedEqual(false);

      if (waitingForOperand && operator) {
        setOperator(nextOp);
        return;
      }

      const inputValue = parseFloat(display);
      if (Number.isNaN(inputValue)) {
        clearAll();
        return;
      }

      if (accumulator === null) {
        setAccumulator(inputValue);
      } else if (operator) {
        setCalculationCount((prev) => prev + 1);

        const result = calculate(accumulator, inputValue, operator);
        const newDisplay = formatDisplay(result);
        setDisplay(newDisplay);
        setAccumulator(Number.isFinite(result) ? result : null);

        if (!Number.isFinite(result)) {
          setOperator(null);
          setWaitingForOperand(false);
          return;
        }

        if (gameMode === 'practice' && gameStarted) {
          const afterElimination = applyElimination(newDisplay);
          checkGameOverState(afterElimination);
        }
      }

      setWaitingForOperand(true);
      setOperator(nextOp);
    },
    [
      accumulator,
      display,
      operator,
      waitingForOperand,
      clearAll,
      gameMode,
      gameStarted,
      applyElimination,
      checkGameOverState,
    ]
  );

  const handleEqual = useCallback(() => {
    const currentValue = parseFloat(display);

    if (operator === null && lastOperator !== null && lastOperand !== null) {
      setCalculationCount((prev) => prev + 1);

      const result = calculate(currentValue, lastOperand, lastOperator);
      const newDisplay = formatDisplay(result);
      setDisplay(newDisplay);
      setJustPressedEqual(true);

      if (gameMode === 'practice' && gameStarted) {
        const afterElimination = applyElimination(newDisplay);
        checkGameOverState(afterElimination);
      }
      return;
    }

    if (operator === null || accumulator === null) return;

    setCalculationCount((prev) => prev + 1);

    const result = calculate(accumulator, currentValue, operator);
    const newDisplay = formatDisplay(result);

    setLastOperator(operator);
    setLastOperand(currentValue);

    setCalculationHistory(`${accumulator} ${operator} ${currentValue} = ${newDisplay}`);
    setDisplay(newDisplay);
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustPressedEqual(true);

    if (gameMode === 'practice' && gameStarted) {
      const afterElimination = applyElimination(newDisplay);
      checkGameOverState(afterElimination);
    }
  }, [
    accumulator,
    display,
    operator,
    lastOperator,
    lastOperand,
    gameMode,
    gameStarted,
    applyElimination,
    checkGameOverState,
  ]);

  const handleKey = useCallback(
    (key: string) => {
      if (isGameOver) return;

      if (gameMode !== 'calculator' && !gameStarted) {
        startGame();
      }

      if (/^\d$/.test(key)) {
        inputDigit(key);
        return;
      }

      switch (key) {
        case 'C':
          clearAll();
          break;
        case 'E':
          clearEntry();
          break;
        case '.':
          inputDecimal();
          break;
        case '=':
          handleEqual();
          break;
        case '+':
        case '-':
        case '*':
        case '/':
          performOperation(key);
          break;
      }
    },
    [
      isGameOver,
      gameMode,
      gameStarted,
      startGame,
      inputDigit,
      clearAll,
      clearEntry,
      inputDecimal,
      handleEqual,
      performOperation,
    ]
  );

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKey(e.key);
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        handleKey(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        handleKey('=');
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleKey('C');
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'e' || e.key === 'E') {
        handleKey('E');
      } else if (e.key === '.') {
        handleKey('.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKey]);

  return (
    <div className="desktop">
      <MenuBar gameMode={gameMode} onChangeMode={changeGameMode} />

      {gameMode === 'endless' && gameStarted && !isGameOver && prediction && (
        <PredictionArea prediction={prediction} countdown={countdown} />
      )}

      {gameMode !== 'calculator' && (
        <ScoreArea score={score} chains={chains} lastScoreBreakdown={lastScoreBreakdown} />
      )}

      <main className="window">
        <div className="title-bar">
          <div className="close-box" onClick={() => changeGameMode('calculator')} />
          <span className="title">Sasso</span>
        </div>

        <div className="window-content">
          {isGameOver && <GameOverOverlay isSurrender={isSurrender} onRetry={resetGame} />}

          <Display value={display} eliminatingIndices={eliminatingIndices} />
          <Keypad onKey={handleKey} />
        </div>
      </main>

      {gameMode !== 'calculator' && <CalculationHistory text={calculationHistory} />}

      {gameMode !== 'calculator' && !gameStarted && <StartPrompt />}
    </div>
  );
}

export default App;
