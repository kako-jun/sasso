/**
 * Convert internal operator to display symbol
 */
export function operatorToSymbol(op: string): string {
  switch (op) {
    case '*':
      return '×';
    case '/':
      return '÷';
    case '-':
      return '−';
    default:
      return op;
  }
}
