// Constants
const ANGLE_TAN = 0.577; // tan(30°) for 30-degree lines from horizontal
const GROUP_GAP = 20;
const MARGIN = 15;
const LINE_PADDING = 40;

// Types
interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TwoDigitNumber {
  tens: number;
  ones: number;
  value: number;
}

interface MultiplicationHelperProps {
  displayValue: string;
  multiplier: number;
}

// Helper functions
function extractLastTwoDigits(displayValue: string): TwoDigitNumber {
  const digits = displayValue.replace(/[^0-9]/g, '');
  const tens = digits.length >= 2 ? parseInt(digits[digits.length - 2], 10) : 0;
  const ones = digits.length >= 1 ? parseInt(digits[digits.length - 1], 10) : 0;
  return { tens, ones, value: tens * 10 + ones };
}

function splitIntoDigits(num: number): TwoDigitNumber {
  return {
    tens: Math.floor(num / 10),
    ones: num % 10,
    value: num,
  };
}

function calculateLineSpacing(maxDigit: number): number {
  // Minimum spacing of 5px to prevent overlap with strokeWidth 2
  return maxDigit > 5 ? 5 : 7;
}

function generateLineGroup(
  count: number,
  startX: number,
  lineSpacing: number,
  lineLength: number,
  deltaY: number,
  direction: 'right' | 'left'
): Line[] {
  const lines: Line[] = [];
  for (let i = 0; i < count; i++) {
    const x1 = startX + (direction === 'right' ? i : -i) * lineSpacing;
    const x2 = x1 + (direction === 'right' ? lineLength : -lineLength);
    lines.push({ x1, y1: MARGIN, x2, y2: MARGIN + deltaY });
  }
  return lines;
}

// Component
export function MultiplicationHelper({ displayValue, multiplier }: MultiplicationHelperProps) {
  const display = extractLastTwoDigits(displayValue);
  const mult = splitIntoDigits(multiplier);

  // Calculate dimensions
  const maxDigit = Math.max(display.tens, display.ones, mult.tens, mult.ones, 1);
  const lineSpacing = calculateLineSpacing(maxDigit);
  const groupWidth = maxDigit * lineSpacing;
  const lineLength = groupWidth * 2 + GROUP_GAP + LINE_PADDING;
  const deltaY = lineLength * ANGLE_TAN;
  const width = MARGIN * 2 + groupWidth * 2 + GROUP_GAP + lineLength;
  const height = MARGIN * 2 + deltaY;

  // Generate lines
  // Top lines (right-down): multiplier (かける数)
  const multTensLines = generateLineGroup(
    mult.tens,
    MARGIN,
    lineSpacing,
    lineLength,
    deltaY,
    'right'
  );
  const multOnesLines = generateLineGroup(
    mult.ones,
    MARGIN + groupWidth + GROUP_GAP,
    lineSpacing,
    lineLength,
    deltaY,
    'right'
  );
  // Bottom lines (left-down): display (かけられる数)
  const displayTensLines = generateLineGroup(
    display.tens,
    width - MARGIN - groupWidth - GROUP_GAP,
    lineSpacing,
    lineLength,
    deltaY,
    'left'
  );
  const displayOnesLines = generateLineGroup(
    display.ones,
    width - MARGIN,
    lineSpacing,
    lineLength,
    deltaY,
    'left'
  );

  const topLines = [...multTensLines, ...multOnesLines];
  const bottomLines = [...displayTensLines, ...displayOnesLines];

  // Three intersection zones (hundreds, tens, ones)
  const centerX = width / 2;
  const zoneSpacing = groupWidth + GROUP_GAP / 2;
  const zoneW = groupWidth;

  return (
    <div className="multiplication-helper">
      <div
        className="mult-zone-bg"
        style={{ left: centerX - zoneSpacing - zoneW / 2 + 8, width: zoneW }}
      />
      <div className="mult-zone-bg" style={{ left: centerX - zoneW / 2 + 8, width: zoneW }} />
      <div
        className="mult-zone-bg"
        style={{ left: centerX + zoneSpacing - zoneW / 2 + 8, width: zoneW }}
      />
      <svg width={width} height={height} className="mult-svg">
        {topLines.map((line, i) => (
          <line key={`top-${i}`} {...line} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        ))}
        {bottomLines.map((line, i) => (
          <line key={`bottom-${i}`} {...line} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        ))}
      </svg>
      <div className="mult-digits">
        <span>{display.tens}</span>
        <span>{display.ones}</span>
        <span>{mult.tens}</span>
        <span>{mult.ones}</span>
      </div>
    </div>
  );
}
