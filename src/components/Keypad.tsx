interface KeypadProps {
  onKey: (key: string) => void;
}

interface KeyConfig {
  key: string;
  label: string;
  className: string;
}

const KEYPAD_LAYOUT: KeyConfig[][] = [
  [
    { key: 'C', label: 'C', className: 'key key--op' },
    { key: 'E', label: 'E', className: 'key key--op' },
    { key: '=', label: '=', className: 'key key--op' },
    { key: '*', label: '×', className: 'key key--op' },
  ],
  [
    { key: '7', label: '7', className: 'key' },
    { key: '8', label: '8', className: 'key' },
    { key: '9', label: '9', className: 'key' },
    { key: '/', label: '÷', className: 'key key--op' },
  ],
  [
    { key: '4', label: '4', className: 'key' },
    { key: '5', label: '5', className: 'key' },
    { key: '6', label: '6', className: 'key' },
    { key: '-', label: '−', className: 'key key--op' },
  ],
  [
    { key: '1', label: '1', className: 'key' },
    { key: '2', label: '2', className: 'key' },
    { key: '3', label: '3', className: 'key' },
    { key: '+', label: '+', className: 'key key--tall key--op' },
  ],
  [
    { key: '0', label: '0', className: 'key key--wide' },
    { key: '.', label: '.', className: 'key' },
  ],
];

export function Keypad({ onKey }: KeypadProps) {
  return (
    <div className="keypad">
      {KEYPAD_LAYOUT.flat().map(({ key, label, className }) => (
        <button key={key} className={className} onClick={() => onKey(key)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}
