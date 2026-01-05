import styles from './Display.module.css';

interface DisplayProps {
  value: string;
  eliminatingIndices: number[];
}

export function Display({ value, eliminatingIndices }: DisplayProps) {
  return (
    <div className={styles.display}>
      {value.split('').map((char, idx) => (
        <span
          key={idx}
          className={`${styles.digit} ${eliminatingIndices.includes(idx) ? styles.eliminating : ''}`}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
