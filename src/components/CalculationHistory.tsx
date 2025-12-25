interface CalculationHistoryProps {
  text: string;
}

function FormatHistory({ text }: { text: string }) {
  const parts = text.split(/([+\-×÷*/=])/g);
  return (
    <>
      {parts.map((part, i) =>
        /[+\-×÷*/=]/.test(part) ? (
          <span key={i} className="op-bold">
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
    <div className="calculation-history">
      <FormatHistory text={text} />
    </div>
  );
}
