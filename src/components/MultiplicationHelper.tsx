interface MultiplicationHelperProps {
  displayValue: string;
  multiplier: number;
}

export function MultiplicationHelper({ displayValue, multiplier }: MultiplicationHelperProps) {
  // Extract last 2 digits from display (10s and 1s place)
  const digits = displayValue.replace(/[^0-9]/g, '');
  const tensDigit = digits.length >= 2 ? parseInt(digits[digits.length - 2], 10) : 0;
  const onesDigit = digits.length >= 1 ? parseInt(digits[digits.length - 1], 10) : 0;

  // Split multiplier into 10s and 1s
  const multTens = Math.floor(multiplier / 10);
  const multOnes = multiplier % 10;

  const displayNum = tensDigit * 10 + onesDigit;

  // SVG dimensions
  const width = 200;
  const height = 140;
  const margin = 20;
  const lineSpacing = 8;

  // Calculate intersection counts for each zone
  // Zone 1 (left): tensDigit × multTens
  // Zone 2 (middle): tensDigit × multOnes + onesDigit × multTens
  // Zone 3 (right): onesDigit × multOnes
  const zone1 = tensDigit * multTens;
  const zone2 = tensDigit * multOnes + onesDigit * multTens;
  const zone3 = onesDigit * multOnes;

  // Generate lines for top number (displayNum)
  const topLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  // Tens digit lines (left group, going down-right)
  for (let i = 0; i < tensDigit; i++) {
    const startX = margin + 20 + i * lineSpacing;
    const startY = margin;
    const endX = startX + 60;
    const endY = height - margin;
    topLines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
  }
  // Ones digit lines (right group, going down-right)
  for (let i = 0; i < onesDigit; i++) {
    const startX = margin + 80 + i * lineSpacing;
    const startY = margin;
    const endX = startX + 60;
    const endY = height - margin;
    topLines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
  }

  // Generate lines for bottom number (multiplier)
  const bottomLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  // Tens digit lines (left group, going down-left)
  for (let i = 0; i < multTens; i++) {
    const startX = width - margin - 20 - i * lineSpacing;
    const startY = margin;
    const endX = startX - 60;
    const endY = height - margin;
    bottomLines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
  }
  // Ones digit lines (right group, going down-left)
  for (let i = 0; i < multOnes; i++) {
    const startX = width - margin + 10 - i * lineSpacing;
    const startY = margin;
    const endX = startX - 60;
    const endY = height - margin;
    bottomLines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
  }

  return (
    <div className="multiplication-helper">
      <div className="mult-header">
        {displayNum} × {multiplier}
      </div>
      <svg width={width} height={height} className="mult-svg">
        {/* Top number lines (going down-right) */}
        {topLines.map((line, i) => (
          <line
            key={`top-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#000"
            strokeWidth="2"
          />
        ))}
        {/* Bottom number lines (going down-left) */}
        {bottomLines.map((line, i) => (
          <line
            key={`bottom-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#666"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mult-zones">
        <span className="zone">{zone1 > 0 ? zone1 : ''}</span>
        <span className="zone">{zone2}</span>
        <span className="zone">{zone3}</span>
      </div>
      <div className="mult-result">= {displayNum * multiplier}</div>
    </div>
  );
}
