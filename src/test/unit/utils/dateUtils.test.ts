import { describe, it, expect } from 'vitest';

// Date utility functions to test
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || 'Invalid Month';
};

describe('Date Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should handle edge cases', () => {
      const newYear = new Date('2024-01-01T00:00:00Z');
      expect(formatDate(newYear)).toBe('2024-01-01');
      
      const endOfYear = new Date('2024-12-31T23:59:59Z');
      expect(formatDate(endOfYear)).toBe('2024-12-31');
    });
  });

  describe('isWeekend', () => {
    it('should identify weekends correctly', () => {
      const saturday = new Date('2024-01-20'); // Saturday
      const sunday = new Date('2024-01-21'); // Sunday
      const monday = new Date('2024-01-22'); // Monday
      
      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });

    it('should identify weekdays correctly', () => {
      const tuesday = new Date('2024-01-23');
      const wednesday = new Date('2024-01-24');
      const thursday = new Date('2024-01-25');
      const friday = new Date('2024-01-26');
      
      expect(isWeekend(tuesday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
      expect(isWeekend(thursday)).toBe(false);
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-10');
      
      expect(daysBetween(date1, date2)).toBe(9);
      expect(daysBetween(date2, date1)).toBe(9); // Should be same regardless of order
    });

    it('should handle same date', () => {
      const date = new Date('2024-01-01');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle cross-month calculations', () => {
      const jan31 = new Date('2024-01-31');
      const feb01 = new Date('2024-02-01');
      
      expect(daysBetween(jan31, feb01)).toBe(1);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const startDate = new Date('2024-01-15');
      const result = addDays(startDate, 5);
      
      expect(formatDate(result)).toBe('2024-01-20');
    });

    it('should handle negative days', () => {
      const startDate = new Date('2024-01-15');
      const result = addDays(startDate, -5);
      
      expect(formatDate(result)).toBe('2024-01-10');
    });

    it('should handle month overflow', () => {
      const endOfMonth = new Date('2024-01-31');
      const result = addDays(endOfMonth, 1);
      
      expect(formatDate(result)).toBe('2024-02-01');
    });

    it('should not modify original date', () => {
      const originalDate = new Date('2024-01-15');
      const originalTime = originalDate.getTime();
      
      addDays(originalDate, 5);
      
      expect(originalDate.getTime()).toBe(originalTime);
    });
  });

  describe('getMonthName', () => {
    it('should return correct month names', () => {
      expect(getMonthName(0)).toBe('January');
      expect(getMonthName(5)).toBe('June');
      expect(getMonthName(11)).toBe('December');
    });

    it('should handle invalid indices', () => {
      expect(getMonthName(-1)).toBe('Invalid Month');
      expect(getMonthName(12)).toBe('Invalid Month');
      expect(getMonthName(100)).toBe('Invalid Month');
    });
  });

  describe('Date Integration Tests', () => {
    it('should work with current date', () => {
      const now = new Date();
      const formatted = formatDate(now);
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof isWeekend(now)).toBe('boolean');
    });

    it('should handle leap year calculations', () => {
      const feb28_2024 = new Date('2024-02-28'); // 2024 is a leap year
      const feb29_2024 = new Date('2024-02-29');
      const mar01_2024 = new Date('2024-03-01');
      
      expect(daysBetween(feb28_2024, feb29_2024)).toBe(1);
      expect(daysBetween(feb29_2024, mar01_2024)).toBe(1);
      
      const nextDay = addDays(feb28_2024, 1);
      expect(formatDate(nextDay)).toBe('2024-02-29');
    });

    it('should handle year transitions', () => {
      const dec31 = new Date('2023-12-31');
      const jan01 = new Date('2024-01-01');
      
      expect(daysBetween(dec31, jan01)).toBe(1);
      
      const nextYear = addDays(dec31, 1);
      expect(formatDate(nextYear)).toBe('2024-01-01');
    });
  });
});