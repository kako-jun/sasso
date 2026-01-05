import styles from './Keypad.module.css';

interface KeypadProps {
  onKey: (key: string) => void;
}

interface KeyConfig {
  key: string;
  label: string;
  modifiers: ('wide' | 'tall' | 'op')[];
}

const KEYPAD_LAYOUT: KeyConfig[][] = [
  [
    { key: 'C', label: 'C', modifiers: ['op'] },
    { key: 'E', label: 'E', modifiers: ['op'] },
    { key: '=', label: '=', modifiers: ['op'] },
    { key: '*', label: '×', modifiers: ['op'] },
  ],
  [
    { key: '7', label: '7', modifiers: [] },
    { key: '8', label: '8', modifiers: [] },
    { key: '9', label: '9', modifiers: [] },
    { key: '/', label: '÷', modifiers: ['op'] },
  ],
  [
    { key: '4', label: '4', modifiers: [] },
    { key: '5', label: '5', modifiers: [] },
    { key: '6', label: '6', modifiers: [] },
    { key: '-', label: '−', modifiers: ['op'] },
  ],
  [
    { key: '1', label: '1', modifiers: [] },
    { key: '2', label: '2', modifiers: [] },
    { key: '3', label: '3', modifiers: [] },
    { key: '+', label: '+', modifiers: ['tall', 'op'] },
  ],
  [
    { key: '0', label: '0', modifiers: ['wide'] },
    { key: '.', label: '.', modifiers: [] },
  ],
];

function getKeyClassName(modifiers: KeyConfig['modifiers']): string {
  const classes = [styles.key];
  if (modifiers.includes('wide')) classes.push(styles.wide);
  if (modifiers.includes('tall')) classes.push(styles.tall);
  if (modifiers.includes('op')) classes.push(styles.op);
  return classes.join(' ');
}

export function Keypad({ onKey }: KeypadProps) {
  return (
    <div className={styles.keypad}>
      {KEYPAD_LAYOUT.flat().map(({ key, label, modifiers }) => (
        <button
          key={key}
          className={getKeyClassName(modifiers)}
          onClick={() => onKey(key)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
