interface KeypadProps {
  onKey: (key: string) => void;
}

export function Keypad({ onKey }: KeypadProps) {
  return (
    <div className="keypad">
      <button className="key key--op" onClick={() => onKey('C')} type="button">
        C
      </button>
      <button className="key key--op" onClick={() => onKey('E')} type="button">
        E
      </button>
      <button className="key key--op" onClick={() => onKey('=')} type="button">
        =
      </button>
      <button className="key key--op" onClick={() => onKey('*')} type="button">
        ×
      </button>

      <button className="key" onClick={() => onKey('7')} type="button">
        7
      </button>
      <button className="key" onClick={() => onKey('8')} type="button">
        8
      </button>
      <button className="key" onClick={() => onKey('9')} type="button">
        9
      </button>
      <button className="key key--op" onClick={() => onKey('/')} type="button">
        ÷
      </button>

      <button className="key" onClick={() => onKey('4')} type="button">
        4
      </button>
      <button className="key" onClick={() => onKey('5')} type="button">
        5
      </button>
      <button className="key" onClick={() => onKey('6')} type="button">
        6
      </button>
      <button className="key key--op" onClick={() => onKey('-')} type="button">
        −
      </button>

      <button className="key" onClick={() => onKey('1')} type="button">
        1
      </button>
      <button className="key" onClick={() => onKey('2')} type="button">
        2
      </button>
      <button className="key" onClick={() => onKey('3')} type="button">
        3
      </button>
      <button className="key key--tall key--op" onClick={() => onKey('+')} type="button">
        +
      </button>

      <button className="key key--wide" onClick={() => onKey('0')} type="button">
        0
      </button>
      <button className="key" onClick={() => onKey('.')} type="button">
        .
      </button>
    </div>
  );
}
