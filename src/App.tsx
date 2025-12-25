import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import {
  type GameMode,
  type Operator as GameOperator,
  type Prediction,
  type ScoreResult,
  processElimination,
  checkOverflow,
  generateInitialState,
  generatePrediction,
  shouldTriggerAttack,
  findEliminationIndices,
  calculateScore,
  getDigitCount
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

// 計算履歴の演算子を太字にする
const FormatHistory = ({ text }: { text: string }) => {
  const parts = text.split(/([+\-×÷*/=])/g);
  return (
    <>
      {parts.map((part, i) =>
        /[+\-×÷*/=]/.test(part) ? (
          <span key={i} className="op-bold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
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
  const [calculationCount, setCalculationCount] = useState(0); // 準備ボーナス用
  const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreResult | null>(null);

  // 計算式表示用
  const [calculationHistory, setCalculationHistory] = useState<string>('');

  // 消去アニメーション用
  const [eliminatingIndices, setEliminatingIndices] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

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
    setCalculationCount(0);
    setLastScoreBreakdown(null);
    setCalculationHistory('');
    setEliminatingIndices([]);
    setIsAnimating(false);

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

  // アニメーション付き消去処理を実行
  const applyEliminationWithAnimation = useCallback((
    displayStr: string,
    chainCount = 0,
    initialDigitCount?: number,
    initialCalcCount?: number
  ) => {
    const indices = findEliminationIndices(displayStr);

    if (indices.length > 0) {
      // 最初の消去時の桁数と計算回数を記録
      const digitCountBeforeElimination = initialDigitCount ?? getDigitCount(displayStr);
      const calcCount = initialCalcCount ?? calculationCountRef.current;

      // 消去アニメーション開始
      setEliminatingIndices(indices);
      setIsAnimating(true);

      // アニメーション後に実際に消去
      setTimeout(() => {
        const result = processElimination(displayStr);
        setDisplay(result.result);
        setEliminatingIndices([]);
        setIsAnimating(false);

        const newChainCount = chainCount + 1;
        setChains(newChainCount);

        // 新しいスコア計算システム
        const scoreResult = calculateScore({
          eliminated: result.eliminated,
          chains: newChainCount,
          calculationsSinceLastElimination: calcCount,
          digitCountBeforeElimination
        });

        setScore(prev => prev + scoreResult.totalScore);
        setLastScoreBreakdown(scoreResult);

        // 準備ボーナスカウンターをリセット
        setCalculationCount(0);

        // 攻撃判定（将来の2人対戦用）
        if (shouldTriggerAttack(result)) {
          // TODO: 攻撃処理 (attackPower = scoreResult.attackPower)
          console.log('Attack triggered! Power:', scoreResult.attackPower);
        }

        // 連鎖チェック（少し遅延を入れて次の消去をチェック）
        setTimeout(() => {
          const nextIndices = findEliminationIndices(result.result);
          if (nextIndices.length > 0) {
            // 連鎖では最初の桁数と計算回数を引き継ぐ
            applyEliminationWithAnimation(result.result, newChainCount, digitCountBeforeElimination, calcCount);
          }
        }, 100);
      }, 400); // 400ms のアニメーション時間

      return displayStr; // アニメーション中なので元の値を返す
    }

    return displayStr;
  }, []);

  // 消去処理を実行（アニメーションなし版 - 互換性用）
  const applyElimination = useCallback((displayStr: string) => {
    const result = processElimination(displayStr);

    if (result.eliminated > 0) {
      // アニメーション付きで処理
      applyEliminationWithAnimation(displayStr);
      return result.result;
    }

    return displayStr;
  }, [applyEliminationWithAnimation]);

  // 現在の状態を保持するref（タイマーから参照用）
  const displayRef = useRef(display);
  const predictionRef = useRef(prediction);
  const gameStartTimeRef = useRef(gameStartTime);
  const calculationCountRef = useRef(calculationCount);

  useEffect(() => { displayRef.current = display; }, [display]);
  useEffect(() => { predictionRef.current = prediction; }, [prediction]);
  useEffect(() => { gameStartTimeRef.current = gameStartTime; }, [gameStartTime]);
  useEffect(() => { calculationCountRef.current = calculationCount; }, [calculationCount]);

  // 予告された演算を実行
  const applyPrediction = useCallback(() => {
    const currentPrediction = predictionRef.current;
    const currentDisplay = displayRef.current;
    const startTime = gameStartTimeRef.current;
    const currentCalcCount = calculationCountRef.current;

    if (!currentPrediction) return;

    // 予告計算も計算回数としてカウント
    setCalculationCount(prev => prev + 1);

    const digitCountBeforeCalc = getDigitCount(currentDisplay);
    const currentValue = parseFloat(currentDisplay);
    const result = calculate(currentValue, currentPrediction.operand, currentPrediction.operator);
    const newDisplay = formatDisplay(result);

    setCalculationHistory(`${currentDisplay} ${currentPrediction.operator} ${currentPrediction.operand} = ${newDisplay}`);

    // まず計算結果を表示
    setDisplay(newDisplay);

    // 消去があれば、アニメーション付きで処理
    const indices = findEliminationIndices(newDisplay);
    if (indices.length > 0) {
      const digitCountBeforeElimination = getDigitCount(newDisplay);

      // アニメーション開始
      setEliminatingIndices(indices);
      setIsAnimating(true);

      setTimeout(() => {
        const eliminationResult = processElimination(newDisplay);
        const finalDisplay = eliminationResult.result;

        setDisplay(finalDisplay);
        setEliminatingIndices([]);
        setIsAnimating(false);

        setChains(eliminationResult.chains);

        // 新しいスコア計算
        const scoreResult = calculateScore({
          eliminated: eliminationResult.eliminated,
          chains: eliminationResult.chains,
          calculationsSinceLastElimination: currentCalcCount + 1,
          digitCountBeforeElimination
        });
        setScore(prev => prev + scoreResult.totalScore);
        setLastScoreBreakdown(scoreResult);
        setCalculationCount(0); // リセット

        // 桁溢れチェック
        if (checkOverflow(finalDisplay)) {
          setIsGameOver(true);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return;
        }

        // 連鎖チェック
        setTimeout(() => {
          const nextIndices = findEliminationIndices(finalDisplay);
          if (nextIndices.length > 0) {
            applyEliminationWithAnimation(finalDisplay, eliminationResult.chains, digitCountBeforeElimination, currentCalcCount + 1);
          }
        }, 100);
      }, 400);
    } else {
      // 桁溢れチェック
      if (checkOverflow(newDisplay)) {
        setIsGameOver(true);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }
    }

    // 次の予告を生成
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const nextPred = generatePrediction(elapsed);
      setPrediction(nextPred);
    }
  }, [applyEliminationWithAnimation]);

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
      // 計算回数をインクリメント（準備ボーナス用）
      setCalculationCount(prev => prev + 1);

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
      // 計算回数をインクリメント（準備ボーナス用）
      setCalculationCount(prev => prev + 1);

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

    // 計算回数をインクリメント（準備ボーナス用）
    setCalculationCount(prev => prev + 1);

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

      {/* スコア表示エリア（電卓の上） */}
      {gameMode !== 'calculator' && (
        <div className="player-score-area">
          <div className="score-display">
            <span className="score-value">Score: {score}</span>
            <span className="chain-value">Chains: {chains}</span>
          </div>
          {lastScoreBreakdown && (
            <div className="score-breakdown">
              <div className="score-formula">
                +{lastScoreBreakdown.totalScore} = {lastScoreBreakdown.baseScore}
                ×{lastScoreBreakdown.chainMultiplier}
                ×{lastScoreBreakdown.prepBonus.toFixed(1)}
                ×{lastScoreBreakdown.riskBonus.toFixed(1)}
              </div>
              <div className="score-labels">
                (Base×Chain×Prep×Risk)
              </div>
            </div>
          )}
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

          <div className="display">
            {display.split('').map((char, idx) => (
              <span
                key={idx}
                className={eliminatingIndices.includes(idx) ? 'digit eliminating' : 'digit'}
              >
                {char}
              </span>
            ))}
          </div>

          <div className="keypad">
            <button className="key key--op" onClick={() => handleKey('C')} type="button">C</button>
            <button className="key key--op" onClick={() => handleKey('E')} type="button">E</button>
            <button className="key key--op" onClick={() => handleKey('=')} type="button">=</button>
            <button className="key key--op" onClick={() => handleKey('*')} type="button">×</button>

            <button className="key" onClick={() => handleKey('7')} type="button">7</button>
            <button className="key" onClick={() => handleKey('8')} type="button">8</button>
            <button className="key" onClick={() => handleKey('9')} type="button">9</button>
            <button className="key key--op" onClick={() => handleKey('/')} type="button">÷</button>

            <button className="key" onClick={() => handleKey('4')} type="button">4</button>
            <button className="key" onClick={() => handleKey('5')} type="button">5</button>
            <button className="key" onClick={() => handleKey('6')} type="button">6</button>
            <button className="key key--op" onClick={() => handleKey('-')} type="button">−</button>

            <button className="key" onClick={() => handleKey('1')} type="button">1</button>
            <button className="key" onClick={() => handleKey('2')} type="button">2</button>
            <button className="key" onClick={() => handleKey('3')} type="button">3</button>
            <button className="key key--tall key--op" onClick={() => handleKey('+')} type="button">+</button>

            <button className="key key--wide" onClick={() => handleKey('0')} type="button">0</button>
            <button className="key" onClick={() => handleKey('.')} type="button">.</button>
          </div>
        </div>
      </main>

      {/* 計算式表示エリア */}
      {gameMode !== 'calculator' && calculationHistory && (
        <div className="calculation-history">
          <FormatHistory text={calculationHistory} />
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
