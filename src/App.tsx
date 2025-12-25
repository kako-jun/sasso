import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import {
  type GameMode,
  type Operator as GameOperator,
  type Prediction,
  processElimination,
  checkOverflow,
  generateInitialState,
  generatePrediction,
  shouldTriggerAttack
} from './gameLogic';

type CalcOperator = '+' | '-' | '*' | '/' | null;

const calculate = (left: number, right: number, op: Exclude<CalcOperator, null>): number => {
  switch (op) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return right === 0 ? NaN : left / right;
  }
};

const formatDisplay = (value: number): string => {
  if (!Number.isFinite(value)) return 'E';
  const str = parseFloat(value.toPrecision(10)).toString();
  return str.length > 10 ? value.toExponential(4) : str;
};

const COUNTDOWN_TIME = 4200; // 4.2秒

function App() {
  // 電卓の状態
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastOperator, setLastOperator] = useState<CalcOperator>(null);
  const [lastOperand, setLastOperand] = useState<number | null>(null);

  // ゲームの状態
  const [gameMode, setGameMode] = useState<GameMode>('calculator');
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [justPressedEqual, setJustPressedEqual] = useState(false);

  // 予告システム
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  // スコア
  const [score, setScore] = useState(0);
  const [chains, setChains] = useState(0);

  // 計算式表示用
  const [calculationHistory, setCalculationHistory] = useState<string>('');

  const countdownRef = useRef<number | null>(null);

  // ゲームをリセット
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
    setCalculationHistory('');

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // ゲームモード変更
  const changeGameMode = useCallback((mode: GameMode) => {
    resetGame();
    setGameMode(mode);
  }, [resetGame]);

  // ゲーム開始
  const startGame = useCallback(() => {
    const initialState = generateInitialState();
    setDisplay(initialState);
    setGameStarted(true);
    setGameStartTime(Date.now());

    if (gameMode === 'endless') {
      // 最初の予告を生成
      const pred = generatePrediction(0);
      setPrediction(pred);
      setCountdown(COUNTDOWN_TIME);
    }
  }, [gameMode]);

  // 降伏処理
  const surrender = useCallback(() => {
    setIsSurrender(true);
    setIsGameOver(true);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // 桁溢れチェック
  const checkGameOver = useCallback((displayStr: string) => {
    if (checkOverflow(displayStr)) {
      setIsGameOver(true);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, []);

  // 消去処理を実行
  const applyElimination = useCallback((displayStr: string) => {
    const result = processElimination(displayStr);

    if (result.eliminated > 0) {
      setDisplay(result.result);
      setChains(result.chains);

      // スコア計算
      let points = result.eliminated * 10;
      if (result.chains > 1) {
        points *= result.chains; // 連鎖ボーナス
      }
      setScore(prev => prev + points);

      // 攻撃判定（将来の2人対戦用）
      if (shouldTriggerAttack(result)) {
        // TODO: 攻撃処理
      }

      return result.result;
    }

    return displayStr;
  }, []);

  // 現在の状態を保持するref（タイマーから参照用）
  const displayRef = useRef(display);
  const predictionRef = useRef(prediction);
  const gameStartTimeRef = useRef(gameStartTime);

  useEffect(() => { displayRef.current = display; }, [display]);
  useEffect(() => { predictionRef.current = prediction; }, [prediction]);
  useEffect(() => { gameStartTimeRef.current = gameStartTime; }, [gameStartTime]);

  // 予告された演算を実行
  const applyPrediction = useCallback(() => {
    const currentPrediction = predictionRef.current;
    const currentDisplay = displayRef.current;
    const startTime = gameStartTimeRef.current;

    if (!currentPrediction) return;

    const currentValue = parseFloat(currentDisplay);
    const result = calculate(currentValue, currentPrediction.operand, currentPrediction.operator);
    const newDisplay = formatDisplay(result);

    setCalculationHistory(`${currentDisplay} ${currentPrediction.operator} ${currentPrediction.operand} = ${newDisplay}`);

    // 消去処理
    const eliminationResult = processElimination(newDisplay);
    const finalDisplay = eliminationResult.eliminated > 0 ? eliminationResult.result : newDisplay;

    setDisplay(finalDisplay);

    if (eliminationResult.eliminated > 0) {
      setChains(eliminationResult.chains);
      let points = eliminationResult.eliminated * 10;
      if (eliminationResult.chains > 1) {
        points *= eliminationResult.chains;
      }
      setScore(prev => prev + points);
    }

    // 桁溢れチェック
    if (checkOverflow(finalDisplay)) {
      setIsGameOver(true);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    // 次の予告を生成
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const nextPred = generatePrediction(elapsed);
      setPrediction(nextPred);
    }
  }, []);

  // カウントダウンタイマー
  useEffect(() => {
    if (gameMode !== 'endless' || !gameStarted || isGameOver) {
      return;
    }

    countdownRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 100) {
          // カウントダウン終了、予告を実行
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

  // 電卓操作
  const clearAll = useCallback(() => {
    if (gameMode !== 'calculator' && gameStarted) {
      // ゲーム中は降伏
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
      // ゲーム中は降伏
      surrender();
      return;
    }
    setDisplay('0');
  }, [gameMode, gameStarted, surrender]);

  const inputDigit = useCallback((digit: string) => {
    // =の後に数字を押したら降伏
    if (gameMode !== 'calculator' && gameStarted && justPressedEqual) {
      surrender();
      return;
    }

    setJustPressedEqual(false);

    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === '0' ? digit : prev + digit;
    });
  }, [gameMode, gameStarted, justPressedEqual, waitingForOperand, surrender]);

  const inputDecimal = useCallback(() => {
    setJustPressedEqual(false);

    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return prev.includes('.') ? prev : prev + '.';
    });
  }, [waitingForOperand]);

  const performOperation = useCallback((nextOp: Exclude<CalcOperator, null>) => {
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
      const result = calculate(accumulator, inputValue, operator);
      const newDisplay = formatDisplay(result);
      setDisplay(newDisplay);
      setAccumulator(Number.isFinite(result) ? result : null);

      if (!Number.isFinite(result)) {
        setOperator(null);
        setWaitingForOperand(false);
        return;
      }

      // 練習モードでは計算後に消去処理
      if (gameMode === 'practice' && gameStarted) {
        const afterElimination = applyElimination(newDisplay);
        checkGameOver(afterElimination);
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOp);
  }, [accumulator, display, operator, waitingForOperand, clearAll, gameMode, gameStarted, applyElimination, checkGameOver]);

  const handleEqual = useCallback(() => {
    const currentValue = parseFloat(display);

    // 連続=押し: 直前の演算を繰り返す
    if (operator === null && lastOperator !== null && lastOperand !== null) {
      const result = calculate(currentValue, lastOperand, lastOperator);
      const newDisplay = formatDisplay(result);
      setDisplay(newDisplay);
      setJustPressedEqual(true);

      // 練習モードでは消去処理
      if (gameMode === 'practice' && gameStarted) {
        const afterElimination = applyElimination(newDisplay);
        checkGameOver(afterElimination);
      }
      return;
    }

    if (operator === null || accumulator === null) return;

    const result = calculate(accumulator, currentValue, operator);
    const newDisplay = formatDisplay(result);

    // 直前の演算を記憶（連続=用）
    setLastOperator(operator);
    setLastOperand(currentValue);

    setCalculationHistory(`${accumulator} ${operator} ${currentValue} = ${newDisplay}`);
    setDisplay(newDisplay);
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustPressedEqual(true);

    // 練習モードでは消去処理
    if (gameMode === 'practice' && gameStarted) {
      const afterElimination = applyElimination(newDisplay);
      checkGameOver(afterElimination);
    }
  }, [accumulator, display, operator, lastOperator, lastOperand, gameMode, gameStarted, applyElimination, checkGameOver]);

  const handleKey = useCallback((key: string) => {
    // ゲームオーバー時は何もしない
    if (isGameOver) return;

    // ゲーム開始前の最初のボタン押下
    if (gameMode !== 'calculator' && !gameStarted) {
      startGame();
      // 押したボタンの効果も適用
    }

    if (/^\d$/.test(key)) {
      inputDigit(key);
      return;
    }

    switch (key) {
      case 'C': clearAll(); break;
      case 'E': clearEntry(); break;
      case '.': inputDecimal(); break;
      case '=': handleEqual(); break;
      case '+':
      case '-':
      case '*':
      case '/':
        performOperation(key);
        break;
    }
  }, [isGameOver, gameMode, gameStarted, startGame, inputDigit, clearAll, clearEntry, inputDecimal, handleEqual, performOperation]);

  // キーボード操作
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

  // カウントダウンの進捗率（アナログ時計表示用）
  const countdownProgress = countdown / COUNTDOWN_TIME;

  return (
    <div className="desktop">
      <header className="menu-bar">
        <span className="github-logo"></span>
        <span
          className={`menu-item ${gameMode === 'calculator' ? 'active' : ''}`}
          onClick={() => changeGameMode('calculator')}
        >
          Calculator
        </span>
        <span
          className={`menu-item ${gameMode === 'practice' ? 'active' : ''}`}
          onClick={() => changeGameMode('practice')}
        >
          Practice
        </span>
        <span
          className={`menu-item ${gameMode === 'endless' ? 'active' : ''}`}
          onClick={() => changeGameMode('endless')}
        >
          Endless
        </span>
        <div className="menu-spacer" />
        {gameMode !== 'calculator' && (
          <>
            <span className="status-item">Score: {score}</span>
            <span className="status-item">Chains: {chains}</span>
          </>
        )}
      </header>

      {/* 予告表示エリア */}
      {gameMode === 'endless' && gameStarted && !isGameOver && prediction && (
        <div className="prediction-area">
          <div className="prediction-clock">
            <svg viewBox="0 0 40 40" className="countdown-clock">
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeDasharray={`${countdownProgress * 113} 113`}
                transform="rotate(-90 20 20)"
              />
            </svg>
          </div>
          <div className="prediction-operation">
            {prediction.operator}{prediction.operand}
          </div>
        </div>
      )}

      <main className="window">
        <div className="title-bar">
          <div className="close-box" onClick={() => changeGameMode('calculator')} />
          <span className="title">Sasso</span>
        </div>

        <div className="window-content">
          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-message">
                {isSurrender ? 'SURRENDER' : 'GAME OVER'}
              </div>
              <button className="retry-button" onClick={resetGame}>
                Retry
              </button>
            </div>
          )}

          <div className="display">{display}</div>

          <div className="keypad">
            <button className="key" onClick={() => handleKey('C')} type="button">C</button>
            <button className="key" onClick={() => handleKey('E')} type="button">E</button>
            <button className="key" onClick={() => handleKey('=')} type="button">=</button>
            <button className="key" onClick={() => handleKey('*')} type="button">*</button>

            <button className="key" onClick={() => handleKey('7')} type="button">7</button>
            <button className="key" onClick={() => handleKey('8')} type="button">8</button>
            <button className="key" onClick={() => handleKey('9')} type="button">9</button>
            <button className="key" onClick={() => handleKey('/')} type="button">/</button>

            <button className="key" onClick={() => handleKey('4')} type="button">4</button>
            <button className="key" onClick={() => handleKey('5')} type="button">5</button>
            <button className="key" onClick={() => handleKey('6')} type="button">6</button>
            <button className="key" onClick={() => handleKey('-')} type="button">-</button>

            <button className="key" onClick={() => handleKey('1')} type="button">1</button>
            <button className="key" onClick={() => handleKey('2')} type="button">2</button>
            <button className="key" onClick={() => handleKey('3')} type="button">3</button>
            <button className="key key--tall" onClick={() => handleKey('+')} type="button">+</button>

            <button className="key key--wide" onClick={() => handleKey('0')} type="button">0</button>
            <button className="key" onClick={() => handleKey('.')} type="button">.</button>
          </div>
        </div>
      </main>

      {/* 計算式表示エリア */}
      {gameMode !== 'calculator' && calculationHistory && (
        <div className="calculation-history">
          {calculationHistory}
        </div>
      )}

      {/* ゲーム開始待ち表示 */}
      {gameMode !== 'calculator' && !gameStarted && (
        <div className="start-prompt">
          Press any button to start
        </div>
      )}
    </div>
  );
}

export default App;
