import styles from './CalculationHistory.module.css';

interface CalculationHistoryProps {
  text: string;
}

function FormatHistory({ text }: { text: string }) {
  const parts = text.split(/([+\-×÷*/=])/g);
  return (
    <>
      {parts.map((part, i) =>
        /[+\-×÷*/=]/.test(part) ? (
          <span key={i} className={styles.opBold}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function CalculationHistory({ text }: CalculationHistoryProps) {
  if (!text) return null;

  return (
    <div className={styles.calculationHistory}>
      <FormatHistory text={text} />
    </div>
  );
}
