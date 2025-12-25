interface DisplayProps {
  value: string;
  eliminatingIndices: number[];
}

export function Display({ value, eliminatingIndices }: DisplayProps) {
  return (
    <div className="display">
      {value.split('').map((char, idx) => (
        <span
          key={idx}
          className={eliminatingIndices.includes(idx) ? 'digit eliminating' : 'digit'}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
