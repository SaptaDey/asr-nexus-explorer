import { describe, it, expect } from 'vitest';

// Data processing utility functions to test
const parseCSV = (csvString: string): string[][] => {
  if (!csvString.trim()) return [];
  
  const lines = csvString.trim().split('\n');
  return lines.map(line => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    return fields;
  });
};

const convertToJSON = (data: string[][], headers?: string[]): Record<string, any>[] => {
  if (data.length === 0) return [];
  
  const headerRow = headers || data[0];
  const dataRows = headers ? data : data.slice(1);
  
  return dataRows.map(row => {
    const obj: Record<string, any> = {};
    headerRow.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
};

const aggregateData = (data: Record<string, any>[], groupBy: string, aggregateField: string, operation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'): Record<string, number> => {
  const groups: Record<string, any[]> = {};
  
  // Group data
  data.forEach(item => {
    const key = item[groupBy];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  
  // Aggregate
  const result: Record<string, number> = {};
  for (const [key, items] of Object.entries(groups)) {
    const values = items.map(item => Number(item[aggregateField])).filter(v => !isNaN(v));
    
    switch (operation) {
      case 'sum':
        result[key] = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result[key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case 'count':
        result[key] = items.length;
        break;
      case 'min':
        result[key] = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        result[key] = values.length > 0 ? Math.max(...values) : 0;
        break;
    }
  }
  
  return result;
};

const normalizeData = (data: number[]): number[] => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  if (range === 0) return data.map(() => 0);
  
  return data.map(value => (value - min) / range);
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

const detectOutliers = (data: number[], threshold: number = 1.5): number[] => {
  const sorted = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - threshold * iqr;
  const upperBound = q3 + threshold * iqr;
  
  return data.filter(value => value < lowerBound || value > upperBound);
};

const binData = (data: number[], numBins: number): { bin: string; count: number; range: [number, number] }[] => {
  if (data.length === 0 || numBins <= 0) return [];
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / numBins;
  
  const bins = Array.from({ length: numBins }, (_, i) => {
    const start = min + i * binSize;
    const end = i === numBins - 1 ? max : start + binSize;
    return {
      bin: `${start.toFixed(2)}-${end.toFixed(2)}`,
      count: 0,
      range: [start, end] as [number, number]
    };
  });
  
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), numBins - 1);
    bins[binIndex].count++;
  });
  
  return bins;
};

const interpolateValue = (x: number, x1: number, y1: number, x2: number, y2: number): number => {
  if (x1 === x2) return y1;
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
};

const smoothData = (data: number[], windowSize: number = 3): number[] => {
  if (windowSize <= 1 || data.length < windowSize) return [...data];
  
  const halfWindow = Math.floor(windowSize / 2);
  const smoothed: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    const window = data.slice(start, end + 1);
    const average = window.reduce((a, b) => a + b, 0) / window.length;
    smoothed.push(average);
  }
  
  return smoothed;
};

const generateSummaryStats = (data: number[]): { mean: number; median: number; std: number; min: number; max: number } => {
  if (data.length === 0) return { mean: 0, median: 0, std: 0, min: 0, max: 0 };
  
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  const std = Math.sqrt(variance);
  
  return {
    mean: Math.round(mean * 100) / 100,
    median,
    std: Math.round(std * 100) / 100,
    min: Math.min(...data),
    max: Math.max(...data)
  };
};

describe('Data Processing Utility Functions', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      const result = parseCSV(csv);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(['name', 'age', 'city']);
      expect(result[1]).toEqual(['John', '25', 'NYC']);
    });

    it('should handle quoted fields', () => {
      const csv = 'name,description\nJohn,"Engineer, Software"\nJane,"Manager, Sales"';
      const result = parseCSV(csv);
      
      expect(result[1][1]).toBe('Engineer, Software');
    });

    it('should handle empty CSV', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('   ')).toEqual([]);
    });
  });

  describe('convertToJSON', () => {
    it('should convert CSV data to JSON', () => {
      const data = [
        ['name', 'age', 'city'],
        ['John', '25', 'NYC'],
        ['Jane', '30', 'LA']
      ];
      
      const result = convertToJSON(data);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'John', age: '25', city: 'NYC' });
    });

    it('should use provided headers', () => {
      const data = [['John', '25'], ['Jane', '30']];
      const headers = ['name', 'age'];
      
      const result = convertToJSON(data, headers);
      expect(result[0]).toEqual({ name: 'John', age: '25' });
    });

    it('should handle empty data', () => {
      expect(convertToJSON([])).toEqual([]);
    });
  });

  describe('aggregateData', () => {
    const sampleData = [
      { department: 'Engineering', salary: 80000, count: 1 },
      { department: 'Engineering', salary: 85000, count: 1 },
      { department: 'Sales', salary: 60000, count: 1 },
      { department: 'Sales', salary: 65000, count: 1 }
    ];

    it('should sum values by group', () => {
      const result = aggregateData(sampleData, 'department', 'salary', 'sum');
      expect(result.Engineering).toBe(165000);
      expect(result.Sales).toBe(125000);
    });

    it('should calculate average', () => {
      const result = aggregateData(sampleData, 'department', 'salary', 'avg');
      expect(result.Engineering).toBe(82500);
      expect(result.Sales).toBe(62500);
    });

    it('should count items', () => {
      const result = aggregateData(sampleData, 'department', 'salary', 'count');
      expect(result.Engineering).toBe(2);
      expect(result.Sales).toBe(2);
    });

    it('should find min and max', () => {
      const minResult = aggregateData(sampleData, 'department', 'salary', 'min');
      const maxResult = aggregateData(sampleData, 'department', 'salary', 'max');
      
      expect(minResult.Engineering).toBe(80000);
      expect(maxResult.Engineering).toBe(85000);
    });
  });

  describe('normalizeData', () => {
    it('should normalize data to 0-1 range', () => {
      const data = [10, 20, 30, 40, 50];
      const normalized = normalizeData(data);
      
      expect(normalized[0]).toBe(0);
      expect(normalized[4]).toBe(1);
      expect(normalized[2]).toBe(0.5);
    });

    it('should handle identical values', () => {
      const data = [5, 5, 5, 5];
      const normalized = normalizeData(data);
      expect(normalized.every(v => v === 0)).toBe(true);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const correlation = calculateCorrelation(x, y);
      
      expect(correlation).toBeCloseTo(1, 2);
    });

    it('should calculate negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const correlation = calculateCorrelation(x, y);
      
      expect(correlation).toBeCloseTo(-1, 2);
    });

    it('should handle mismatched arrays', () => {
      expect(calculateCorrelation([1, 2], [1, 2, 3])).toBe(0);
      expect(calculateCorrelation([], [])).toBe(0);
    });
  });

  describe('detectOutliers', () => {
    it('should detect outliers', () => {
      const data = [1, 2, 3, 4, 5, 100]; // 100 is outlier
      const outliers = detectOutliers(data);
      
      expect(outliers).toContain(100);
      expect(outliers).not.toContain(3);
    });

    it('should handle data without outliers', () => {
      const data = [1, 2, 3, 4, 5];
      const outliers = detectOutliers(data);
      
      expect(outliers).toHaveLength(0);
    });
  });

  describe('binData', () => {
    it('should create bins for data', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const bins = binData(data, 5);
      
      expect(bins).toHaveLength(5);
      expect(bins[0].count).toBeGreaterThan(0);
      expect(bins[0].range[0]).toBeLessThan(bins[0].range[1]);
    });

    it('should handle edge cases', () => {
      expect(binData([], 5)).toEqual([]);
      expect(binData([1, 2, 3], 0)).toEqual([]);
    });
  });

  describe('interpolateValue', () => {
    it('should interpolate between two points', () => {
      const result = interpolateValue(2.5, 2, 10, 3, 20);
      expect(result).toBe(15);
    });

    it('should handle edge cases', () => {
      expect(interpolateValue(2, 2, 10, 2, 20)).toBe(10); // Same x values
      expect(interpolateValue(2, 1, 10, 3, 30)).toBe(20); // Exact interpolation
    });
  });

  describe('smoothData', () => {
    it('should smooth noisy data', () => {
      const data = [1, 10, 2, 9, 3, 8, 4];
      const smoothed = smoothData(data, 3);
      
      expect(smoothed.length).toBe(data.length);
      expect(smoothed[1]).toBeLessThan(data[1]); // Peak should be reduced
    });

    it('should handle edge cases', () => {
      const data = [1, 2, 3];
      expect(smoothData(data, 1)).toEqual(data);
      expect(smoothData(data, 10)).toEqual(data);
    });
  });

  describe('generateSummaryStats', () => {
    it('should calculate summary statistics', () => {
      const data = [1, 2, 3, 4, 5];
      const stats = generateSummaryStats(data);
      
      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.std).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const stats = generateSummaryStats([]);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
    });

    it('should handle single value', () => {
      const stats = generateSummaryStats([42]);
      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
      expect(stats.std).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should process complete data pipeline', () => {
      // Simulate processing research data
      const csvData = 'experiment,temperature,yield\nA,20,85\nB,25,90\nC,30,78\nA,22,88';
      const parsedData = parseCSV(csvData);
      const jsonData = convertToJSON(parsedData);
      
      // Aggregate by experiment
      const avgYield = aggregateData(jsonData, 'experiment', 'yield', 'avg');
      expect(avgYield.A).toBeCloseTo(86.5, 1);
      
      // Extract temperature and yield for correlation
      const temperatures = jsonData.map(d => Number(d.temperature));
      const yields = jsonData.map(d => Number(d.yield));
      
      const stats = generateSummaryStats(yields);
      expect(stats.mean).toBeGreaterThan(80);
    });

    it('should handle data quality analysis', () => {
      const measurements = [95, 98, 102, 97, 99, 150, 96, 101]; // 150 is outlier
      
      // Detect outliers
      const outliers = detectOutliers(measurements);
      expect(outliers).toContain(150);
      
      // Clean data (remove outliers)
      const cleanData = measurements.filter(v => !outliers.includes(v));
      
      // Smooth the clean data
      const smoothed = smoothData(cleanData, 3);
      
      // Generate final stats
      const stats = generateSummaryStats(smoothed);
      expect(stats.mean).toBeLessThan(105); // Should be lower without outlier
    });

    it('should perform time series analysis', () => {
      const timePoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const values = [10, 12, 11, 15, 14, 18, 17, 20, 19, 22];
      
      // Calculate correlation with time (trend)
      const correlation = calculateCorrelation(timePoints, values);
      expect(correlation).toBeGreaterThan(0.8); // Strong positive trend
      
      // Smooth the values
      const smoothed = smoothData(values, 3);
      
      // Bin the data for distribution analysis
      const bins = binData(values, 4);
      expect(bins.length).toBe(4);
      
      // Normalize for comparison
      const normalized = normalizeData(values);
      expect(Math.min(...normalized)).toBe(0);
      expect(Math.max(...normalized)).toBe(1);
    });
  });
});