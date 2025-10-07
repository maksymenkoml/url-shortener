import { describe, it, expect } from 'vitest';

describe('Helper Functions', () => {
  describe('String utilities', () => {
    it('should handle empty strings', () => {
      expect(''.length).toBe(0);
    });

    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });
  });

  describe('Number utilities', () => {
    it('should add numbers correctly', () => {
      expect(1 + 1).toBe(2);
    });

    it('should multiply numbers correctly', () => {
      expect(2 * 3).toBe(6);
    });
  });

  describe('Array utilities', () => {
    it('should filter arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(x => x > 2);
      expect(filtered).toEqual([3, 4, 5]);
    });

    it('should map arrays', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });
  });
});
