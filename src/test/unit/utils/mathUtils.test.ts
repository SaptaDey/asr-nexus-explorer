import { describe, it, expect } from 'vitest';

// Mathematical utility functions to test
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
};

const fibonacci = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0) return 0;
  if (n === 1) return 1;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

const lcm = (a: number, b: number): number => {
  return Math.abs(a * b) / gcd(a, b);
};

const degreeToRadian = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

const radianToDegree = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

const distance2D = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const distance3D = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
};

const circleArea = (radius: number): number => {
  return Math.PI * radius * radius;
};

const circleCircumference = (radius: number): number => {
  return 2 * Math.PI * radius;
};

const sphereVolume = (radius: number): number => {
  return (4 / 3) * Math.PI * Math.pow(radius, 3);
};

const sphereSurfaceArea = (radius: number): number => {
  return 4 * Math.PI * radius * radius;
};

const quadraticRoots = (a: number, b: number, c: number): number[] | null => {
  if (a === 0) return null; // Not a quadratic equation
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null; // No real roots
  
  if (discriminant === 0) {
    return [-b / (2 * a)];
  }
  
  const sqrtDiscriminant = Math.sqrt(discriminant);
  return [
    (-b + sqrtDiscriminant) / (2 * a),
    (-b - sqrtDiscriminant) / (2 * a)
  ];
};

const linearInterpolation = (x0: number, y0: number, x1: number, y1: number, x: number): number => {
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const roundToPrecision = (value: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const percentage = (part: number, whole: number): number => {
  if (whole === 0) return 0;
  return (part / whole) * 100;
};

const percentageIncrease = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

const compoundInterest = (principal: number, rate: number, time: number, compound: number = 1): number => {
  return principal * Math.pow(1 + rate / compound, compound * time);
};

const simpleInterest = (principal: number, rate: number, time: number): number => {
  return principal * (1 + rate * time);
};

describe('Mathematical Utility Functions', () => {
  describe('factorial', () => {
    it('should calculate factorials correctly', () => {
      expect(factorial(0)).toBe(1);
      expect(factorial(1)).toBe(1);
      expect(factorial(5)).toBe(120);
      expect(factorial(10)).toBe(3628800);
    });

    it('should handle edge cases', () => {
      expect(factorial(-1)).toBe(0);
      expect(factorial(2)).toBe(2); // Test with simple positive integer
    });
  });

  describe('fibonacci', () => {
    it('should calculate fibonacci numbers', () => {
      expect(fibonacci(0)).toBe(0);
      expect(fibonacci(1)).toBe(1);
      expect(fibonacci(2)).toBe(1);
      expect(fibonacci(5)).toBe(5);
      expect(fibonacci(10)).toBe(55);
    });

    it('should handle negative numbers', () => {
      expect(fibonacci(-1)).toBe(0);
      expect(fibonacci(-5)).toBe(0);
    });
  });

  describe('isPrime', () => {
    it('should identify prime numbers', () => {
      expect(isPrime(2)).toBe(true);
      expect(isPrime(3)).toBe(true);
      expect(isPrime(5)).toBe(true);
      expect(isPrime(7)).toBe(true);
      expect(isPrime(11)).toBe(true);
      expect(isPrime(17)).toBe(true);
    });

    it('should identify non-prime numbers', () => {
      expect(isPrime(1)).toBe(false);
      expect(isPrime(4)).toBe(false);
      expect(isPrime(6)).toBe(false);
      expect(isPrime(8)).toBe(false);
      expect(isPrime(9)).toBe(false);
      expect(isPrime(15)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isPrime(0)).toBe(false);
      expect(isPrime(-5)).toBe(false);
    });
  });

  describe('gcd', () => {
    it('should calculate greatest common divisor', () => {
      expect(gcd(12, 8)).toBe(4);
      expect(gcd(48, 18)).toBe(6);
      expect(gcd(7, 5)).toBe(1);
      expect(gcd(0, 5)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(gcd(-12, 8)).toBe(4);
      expect(gcd(12, -8)).toBe(4);
      expect(gcd(-12, -8)).toBe(4);
    });
  });

  describe('lcm', () => {
    it('should calculate least common multiple', () => {
      expect(lcm(4, 6)).toBe(12);
      expect(lcm(3, 5)).toBe(15);
      expect(lcm(12, 8)).toBe(24);
    });

    it('should handle edge cases', () => {
      expect(lcm(0, 5)).toBe(0);
      expect(lcm(1, 5)).toBe(5);
    });
  });

  describe('angle conversions', () => {
    it('should convert degrees to radians', () => {
      expect(degreeToRadian(0)).toBeCloseTo(0, 5);
      expect(degreeToRadian(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(degreeToRadian(180)).toBeCloseTo(Math.PI, 5);
      expect(degreeToRadian(360)).toBeCloseTo(2 * Math.PI, 5);
    });

    it('should convert radians to degrees', () => {
      expect(radianToDegree(0)).toBeCloseTo(0, 5);
      expect(radianToDegree(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(radianToDegree(Math.PI)).toBeCloseTo(180, 5);
      expect(radianToDegree(2 * Math.PI)).toBeCloseTo(360, 5);
    });
  });

  describe('distance calculations', () => {
    it('should calculate 2D distances', () => {
      expect(distance2D(0, 0, 3, 4)).toBe(5);
      expect(distance2D(1, 1, 4, 5)).toBe(5);
      expect(distance2D(0, 0, 0, 0)).toBe(0);
    });

    it('should calculate 3D distances', () => {
      expect(distance3D(0, 0, 0, 1, 1, 1)).toBeCloseTo(Math.sqrt(3), 5);
      expect(distance3D(0, 0, 0, 3, 4, 0)).toBe(5);
      expect(distance3D(1, 2, 3, 1, 2, 3)).toBe(0);
    });
  });

  describe('circle calculations', () => {
    it('should calculate circle area', () => {
      expect(circleArea(1)).toBeCloseTo(Math.PI, 5);
      expect(circleArea(2)).toBeCloseTo(4 * Math.PI, 5);
      expect(circleArea(0)).toBe(0);
    });

    it('should calculate circle circumference', () => {
      expect(circleCircumference(1)).toBeCloseTo(2 * Math.PI, 5);
      expect(circleCircumference(2)).toBeCloseTo(4 * Math.PI, 5);
      expect(circleCircumference(0)).toBe(0);
    });
  });

  describe('sphere calculations', () => {
    it('should calculate sphere volume', () => {
      expect(sphereVolume(1)).toBeCloseTo((4 / 3) * Math.PI, 5);
      expect(sphereVolume(2)).toBeCloseTo((4 / 3) * Math.PI * 8, 5);
      expect(sphereVolume(0)).toBe(0);
    });

    it('should calculate sphere surface area', () => {
      expect(sphereSurfaceArea(1)).toBeCloseTo(4 * Math.PI, 5);
      expect(sphereSurfaceArea(2)).toBeCloseTo(16 * Math.PI, 5);
      expect(sphereSurfaceArea(0)).toBe(0);
    });
  });

  describe('quadraticRoots', () => {
    it('should find real roots', () => {
      const roots = quadraticRoots(1, -5, 6); // x^2 - 5x + 6 = 0
      expect(roots).toHaveLength(2);
      expect(roots).toContain(2);
      expect(roots).toContain(3);
    });

    it('should find single root', () => {
      const roots = quadraticRoots(1, -2, 1); // x^2 - 2x + 1 = 0
      expect(roots).toHaveLength(1);
      expect(roots![0]).toBe(1);
    });

    it('should handle no real roots', () => {
      const roots = quadraticRoots(1, 0, 1); // x^2 + 1 = 0
      expect(roots).toBeNull();
    });

    it('should handle non-quadratic equations', () => {
      const roots = quadraticRoots(0, 2, 1);
      expect(roots).toBeNull();
    });
  });

  describe('linearInterpolation', () => {
    it('should interpolate between points', () => {
      expect(linearInterpolation(0, 0, 10, 100, 5)).toBe(50);
      expect(linearInterpolation(1, 2, 3, 6, 2)).toBe(4);
      expect(linearInterpolation(0, 10, 1, 20, 0.5)).toBe(15);
    });

    it('should handle edge cases', () => {
      expect(linearInterpolation(0, 5, 1, 10, 0.5)).toBe(7.5); // Simple interpolation
      expect(linearInterpolation(0, 0, 10, 10, 5)).toBe(5); // Same y values
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe('roundToPrecision', () => {
    it('should round to specified precision', () => {
      expect(roundToPrecision(3.14159, 2)).toBe(3.14);
      expect(roundToPrecision(3.14159, 4)).toBe(3.1416);
      expect(roundToPrecision(123.456, 1)).toBe(123.5);
    });

    it('should handle zero precision', () => {
      expect(roundToPrecision(3.7, 0)).toBe(4);
      expect(roundToPrecision(3.2, 0)).toBe(3);
    });
  });

  describe('percentage calculations', () => {
    it('should calculate percentages', () => {
      expect(percentage(25, 100)).toBe(25);
      expect(percentage(1, 4)).toBe(25);
      expect(percentage(3, 8)).toBe(37.5);
    });

    it('should handle edge cases', () => {
      expect(percentage(5, 0)).toBe(0);
      expect(percentage(0, 100)).toBe(0);
    });

    it('should calculate percentage increase', () => {
      expect(percentageIncrease(100, 150)).toBe(50);
      expect(percentageIncrease(50, 100)).toBe(100);
      expect(percentageIncrease(100, 75)).toBe(-25);
    });

    it('should handle zero old value', () => {
      expect(percentageIncrease(0, 50)).toBe(0);
    });
  });

  describe('interest calculations', () => {
    it('should calculate compound interest', () => {
      expect(compoundInterest(1000, 0.05, 1)).toBeCloseTo(1050, 2);
      expect(compoundInterest(1000, 0.05, 2, 1)).toBeCloseTo(1102.5, 2);
      expect(compoundInterest(1000, 0.05, 1, 12)).toBeCloseTo(1051.16, 2);
    });

    it('should calculate simple interest', () => {
      expect(simpleInterest(1000, 0.05, 1)).toBe(1050);
      expect(simpleInterest(1000, 0.05, 2)).toBe(1100);
      expect(simpleInterest(500, 0.1, 0.5)).toBe(525);
    });
  });

  describe('Integration Tests', () => {
    it('should solve complex mathematical problems', () => {
      // Calculate the area of a circle with radius from quadratic equation
      const roots = quadraticRoots(1, -4, 3); // x^2 - 4x + 3 = 0, roots: 1, 3
      expect(roots).toHaveLength(2);
      
      const radius = Math.max(...roots!);
      const area = circleArea(radius);
      expect(area).toBeCloseTo(9 * Math.PI, 5);
      
      // Convert the radius to degrees (just for fun)
      const radiusInDegrees = radianToDegree(radius);
      expect(radiusInDegrees).toBeCloseTo(171.89, 2);
    });

    it('should perform financial calculations', () => {
      const principal = 1000;
      const rate = 0.05;
      const time = 2;
      
      const simple = simpleInterest(principal, rate, time);
      const compound = compoundInterest(principal, rate, time);
      
      expect(compound).toBeGreaterThan(simple);
      
      const difference = compound - simple;
      const percentageDiff = percentage(difference, simple);
      expect(percentageDiff).toBeCloseTo(0.23, 2);
    });

    it('should work with geometric calculations', () => {
      // Calculate distance between two points
      const distance = distance2D(0, 0, 3, 4);
      expect(distance).toBe(5);
      
      // Use that distance as radius for circle
      const area = circleArea(distance);
      const circumference = circleCircumference(distance);
      
      expect(area).toBeCloseTo(25 * Math.PI, 5);
      expect(circumference).toBeCloseTo(10 * Math.PI, 5);
      
      // Calculate sphere with same radius
      const volume = sphereVolume(distance);
      expect(volume).toBeCloseTo((4 / 3) * Math.PI * 125, 5);
    });

    it('should handle number theory calculations', () => {
      // Find GCD and LCM of factorial numbers
      const fact4 = factorial(4); // 24
      const fact5 = factorial(5); // 120
      
      expect(fact4).toBe(24);
      expect(fact5).toBe(120);
      
      const gcdResult = gcd(fact4, fact5);
      const lcmResult = lcm(fact4, fact5);
      
      expect(gcdResult).toBe(24);
      expect(lcmResult).toBe(120);
      
      // Check if factorial numbers are prime
      expect(isPrime(fact4)).toBe(false);
      expect(isPrime(fact5)).toBe(false);
    });
  });
});