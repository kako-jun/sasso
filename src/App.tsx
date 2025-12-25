import { useState, useCallback, useEffect } from 'react';
import './App.css';

type Operator = '+' | '-' | '*' | '/' | null;

const calculate = (left: number, right: number, op: Exclude<Operator, null>): number => {
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

function App() {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
  }, []);

  const inputDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      return prev === '0' ? digit : prev + digit;
    });
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return prev.includes('.') ? prev : prev + '.';
    });
  }, [waitingForOperand]);

  const performOperation = useCallback((nextOp: Exclude<Operator, null>) => {
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
      setDisplay(formatDisplay(result));
      setAccumulator(Number.isFinite(result) ? result : null);
      if (!Number.isFinite(result)) {
        setOperator(null);
        setWaitingForOperand(false);
        return;
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOp);
  }, [accumulator, display, operator, waitingForOperand, clearAll]);

  const handleEqual = useCallback(() => {
    if (operator === null || accumulator === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(accumulator, inputValue, operator);

    setDisplay(formatDisplay(result));
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, [accumulator, display, operator]);

  const handleKey = useCallback((key: string) => {
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
  }, [inputDigit, clearAll, clearEntry, inputDecimal, handleEqual, performOperation]);

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
      <header className="menu-bar">
        <span className="apple-logo"></span>
        <span className="menu-item">File</span>
        <span className="menu-item">Edit</span>
        <span className="menu-item">View</span>
        <span className="menu-item">Special</span>
      </header>

      <main className="window">
        <div className="title-bar">
          <div className="close-box" />
          <span className="title">Sasso</span>
        </div>

        <div className="window-content">
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
    </div>
  );
}

export default App;
