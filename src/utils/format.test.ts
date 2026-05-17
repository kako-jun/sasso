import { describe, it, expect } from 'vitest';
import { operatorToSymbol } from './format';

describe('operatorToSymbol', () => {
  it('converts multiplication to ×', () => {
    expect(operatorToSymbol('*')).toBe('×');
  });

  it('converts division to ÷', () => {
    expect(operatorToSymbol('/')).toBe('÷');
  });

  it('converts subtraction to a real minus sign', () => {
    expect(operatorToSymbol('-')).toBe('−');
  });

  it('passes through addition and other characters', () => {
    expect(operatorToSymbol('+')).toBe('+');
    expect(operatorToSymbol('=')).toBe('=');
    expect(operatorToSymbol('')).toBe('');
  });
});
