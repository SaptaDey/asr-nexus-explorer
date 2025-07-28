import { describe, it, expect } from 'vitest';

// Simple utility functions to test
const add = (a: number, b: number): number => a + b;
const multiply = (a: number, b: number): number => a * b;
const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
const isEven = (num: number): boolean => num % 2 === 0;
const filterPositive = (numbers: number[]): number[] => numbers.filter(n => n > 0);

describe('Simple Utility Functions', () => {
  describe('Math Functions', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(-1, 1)).toBe(0);
      expect(add(0, 0)).toBe(0);
    });

    it('should multiply two numbers correctly', () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(-2, 3)).toBe(-6);
      expect(multiply(0, 5)).toBe(0);
    });

    it('should check if number is even', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(3)).toBe(false);
      expect(isEven(0)).toBe(true);
      expect(isEven(-2)).toBe(true);
    });
  });

  describe('String Functions', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
      expect(capitalize('a')).toBe('A');
      expect(capitalize('')).toBe('');
    });

    it('should handle uppercase strings', () => {
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('Array Functions', () => {
    it('should filter positive numbers', () => {
      expect(filterPositive([1, -2, 3, -4, 5])).toEqual([1, 3, 5]);
      expect(filterPositive([-1, -2, -3])).toEqual([]);
      expect(filterPositive([1, 2, 3])).toEqual([1, 2, 3]);
      expect(filterPositive([])).toEqual([]);
    });

    it('should handle zero correctly', () => {
      expect(filterPositive([0, 1, -1])).toEqual([1]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large numbers', () => {
      expect(add(999999, 1)).toBe(1000000);
      expect(multiply(1000, 1000)).toBe(1000000);
    });

    it('should handle decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
      expect(multiply(0.5, 0.5)).toBe(0.25);
    });

    it('should handle special string cases', () => {
      expect(capitalize('123')).toBe('123');
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i - 5000);
      const result = filterPositive(largeArray);
      expect(result.length).toBe(4999);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(4999);
    });

    it('should perform many calculations quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        add(i, i + 1);
        multiply(i, 2);
        isEven(i);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});