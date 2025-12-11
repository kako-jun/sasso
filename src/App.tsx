import { useMemo, useState } from 'react';
import './App.css';

const keys = [
  ['AC', '+/-', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

type Operator = '+' | '-' | '×' | '÷' | null;

const calculate = (left: number, right: number, operator: Exclude<Operator, null>): number => {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return right === 0 ? NaN : left / right;
  }
};

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = parseFloat(value.toFixed(10));
  return rounded.toString();
};

function App() {
  const [display, setDisplay] = useState('0');
  const [operator, setOperator] = useState<Operator>(null);
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const equation = useMemo(() => {
    if (accumulator === null) return '';
    return `${formatNumber(accumulator)} ${operator ?? ''}`.trim();
  }, [accumulator, operator]);

  const clearAll = () => {
    setDisplay('0');
    setOperator(null);
    setAccumulator(null);
    setWaitingForOperand(false);
  };

  const inputDigit = (digit: string) => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const inputDecimal = () => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return `${prev}.`;
    });
  };

  const toggleSign = () => {
    setDisplay((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
  };

  const inputPercent = () => {
    const current = parseFloat(display);
    if (!Number.isNaN(current)) {
      const nextValue = current / 100;
      setDisplay(formatNumber(nextValue));
      if (waitingForOperand && accumulator !== null) {
        setAccumulator(nextValue);
      }
    }
  };

  const performOperation = (nextOperator: Exclude<Operator, null>) => {
    const inputValue = parseFloat(display);

    if (Number.isNaN(inputValue)) {
      clearAll();
      return;
    }

    if (accumulator === null) {
      setAccumulator(inputValue);
    } else if (operator) {
      const result = calculate(accumulator, inputValue, operator);
      if (Number.isNaN(result)) {
        setDisplay('Error');
        setAccumulator(null);
        setOperator(null);
        setWaitingForOperand(false);
        return;
      }
      const formatted = formatNumber(result);
      setAccumulator(result);
      setDisplay(formatted);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEqual = () => {
    if (operator === null || accumulator === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(accumulator, inputValue, operator);
    if (Number.isNaN(result)) {
      setDisplay('Error');
      setAccumulator(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }
    const formatted = formatNumber(result);
    setDisplay(formatted);
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handlePress = (key: string) => {
    if (/^\d$/.test(key)) {
      inputDigit(key);
      return;
    }

    switch (key) {
      case '.':
        inputDecimal();
        break;
      case 'AC':
        clearAll();
        break;
      case '+/-':
        toggleSign();
        break;
      case '%':
        inputPercent();
        break;
      case '+':
      case '-':
      case '×':
      case '÷':
        performOperation(key);
        break;
      case '=':
        handleEqual();
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-shell">
      <main className="calculator" role="application" aria-label="ピクセル電卓">
        <header className="calculator__header">
          <span className="brand">PIXEL CALC</span>
          <span className="helper-text">モダンReact / 1pxデザイン</span>
        </header>
        <section className="display" aria-live="polite">
          <div className="display__equation">{equation}</div>
          <div className="display__value">{display}</div>
        </section>
        <section className="panel">
          <div className="keypad" role="grid">
            {keys.flat().map((label, index) => {
              const isWide = label === '0';
              const isAccent = ['AC', '+/-', '%', '÷', '×', '-', '+', '='].includes(label);
              return (
                <button
                  type="button"
                  className={`key${isWide ? ' key--wide' : ''}${isAccent ? ' key--accent' : ''}`}
                  key={`${label}-${index}`}
                  onClick={() => handlePress(label)}
                  role="gridcell"
                  aria-label={`キー ${label}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
