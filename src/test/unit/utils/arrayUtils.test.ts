import { describe, it, expect } from 'vitest';

// Array utility functions to test
const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((acc, item) => {
    return acc.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};

const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

const sortBy = <T>(array: T[], key: keyof T): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
};

const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const intersection = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => array2.includes(item));
};

const difference = <T>(array1: T[], array2: T[]): T[] => {
  return array1.filter(item => !array2.includes(item));
};

const sum = (array: number[]): number => {
  return array.reduce((acc, num) => acc + num, 0);
};

const average = (array: number[]): number => {
  return array.length === 0 ? 0 : sum(array) / array.length;
};

const median = (array: number[]): number => {
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
};

const mode = (array: number[]): number[] => {
  const counts: Record<number, number> = {};
  let maxCount = 0;
  
  array.forEach(num => {
    counts[num] = (counts[num] || 0) + 1;
    maxCount = Math.max(maxCount, counts[num]);
  });
  
  return Object.keys(counts)
    .filter(key => counts[Number(key)] === maxCount)
    .map(Number);
};

describe('Array Utility Functions', () => {
  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk(['a', 'b', 'c', 'd'], 2)).toEqual([['a', 'b'], ['c', 'd']]);
    });

    it('should handle edge cases', () => {
      expect(chunk([], 2)).toEqual([]);
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
      expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should preserve order', () => {
      expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      expect(flatten([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
      expect(flatten(['a', ['b', 'c'], 'd'])).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle empty arrays', () => {
      expect(flatten([])).toEqual([]);
      expect(flatten([[], []])).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group objects by key', () => {
      const people = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 30 }
      ];
      
      const grouped = groupBy(people, 'age');
      expect(grouped['25']).toHaveLength(2);
      expect(grouped['30']).toHaveLength(1);
    });

    it('should handle empty array', () => {
      expect(groupBy([], 'id')).toEqual({});
    });
  });

  describe('sortBy', () => {
    it('should sort objects by key', () => {
      const items = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ];
      
      const sorted = sortBy(items, 'age');
      expect(sorted[0].age).toBe(25);
      expect(sorted[2].age).toBe(35);
    });

    it('should not modify original array', () => {
      const original = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const sorted = sortBy(original, 'value');
      
      expect(original[0].value).toBe(3);
      expect(sorted[0].value).toBe(1);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      expect(original).toEqual([1, 2, 3, 4, 5]); // Original unchanged
    });

    it('should handle small arrays', () => {
      expect(shuffle([])).toEqual([]);
      expect(shuffle([1])).toEqual([1]);
    });
  });

  describe('intersection', () => {
    it('should find common elements', () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
      expect(intersection(['a', 'b'], ['b', 'c'])).toEqual(['b']);
    });

    it('should handle no intersection', () => {
      expect(intersection([1, 2], [3, 4])).toEqual([]);
    });

    it('should handle empty arrays', () => {
      expect(intersection([], [1, 2])).toEqual([]);
      expect(intersection([1, 2], [])).toEqual([]);
    });
  });

  describe('difference', () => {
    it('should find elements in first array but not second', () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
      expect(difference(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
    });

    it('should handle no difference', () => {
      expect(difference([1, 2], [1, 2, 3])).toEqual([]);
    });
  });

  describe('sum', () => {
    it('should calculate sum of numbers', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
      expect(sum([-1, 1, -2, 2])).toBe(0);
    });

    it('should handle empty array', () => {
      expect(sum([])).toBe(0);
    });

    it('should handle decimals', () => {
      expect(sum([1.5, 2.5])).toBe(4);
    });
  });

  describe('average', () => {
    it('should calculate average', () => {
      expect(average([1, 2, 3, 4])).toBe(2.5);
      expect(average([10])).toBe(10);
    });

    it('should handle empty array', () => {
      expect(average([])).toBe(0);
    });
  });

  describe('median', () => {
    it('should calculate median for odd length', () => {
      expect(median([1, 3, 5])).toBe(3);
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should calculate median for even length', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
      expect(median([10, 20])).toBe(15);
    });

    it('should handle unsorted arrays', () => {
      expect(median([3, 1, 5, 2, 4])).toBe(3);
    });
  });

  describe('mode', () => {
    it('should find most frequent values', () => {
      expect(mode([1, 2, 2, 3])).toEqual([2]);
      expect(mode([1, 1, 2, 2, 3])).toEqual([1, 2]);
    });

    it('should handle all unique values', () => {
      expect(mode([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(mode([])).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should chain utility functions', () => {
      const data = [1, 2, 2, 3, 4, 4, 5];
      const uniqueData = unique(data);
      const chunks = chunk(uniqueData, 2);
      
      expect(uniqueData).toEqual([1, 2, 3, 4, 5]);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should work with complex data', () => {
      const users = [
        { id: 1, name: 'Alice', department: 'Engineering', salary: 80000 },
        { id: 2, name: 'Bob', department: 'Engineering', salary: 85000 },
        { id: 3, name: 'Charlie', department: 'Sales', salary: 60000 },
        { id: 4, name: 'Diana', department: 'Sales', salary: 65000 }
      ];

      const grouped = groupBy(users, 'department');
      const engineeringSalaries = grouped.Engineering.map(u => u.salary);
      const avgEngSalary = average(engineeringSalaries);

      expect(grouped.Engineering).toHaveLength(2);
      expect(avgEngSalary).toBe(82500);
    });

    it('should handle statistical analysis', () => {
      const scores = [85, 92, 78, 96, 88, 92, 85, 90];
      
      expect(sum(scores)).toBe(706);
      expect(average(scores)).toBe(88.25);
      expect(median(scores)).toBe(89); // Sorted: [78,85,85,88,90,92,92,96], median is (88+90)/2 = 89
      expect(mode(scores)).toEqual([85, 92]);
    });
  });
});