import { describe, it, expect } from 'vitest';

// Validation utility functions to test
const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const isURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isStrongPassword = (password: string): boolean => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

const isInteger = (value: string): boolean => {
  if (value.trim() === '') return false;
  return Number.isInteger(Number(value));
};

const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const isAlphaNumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

const isHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

describe('Validation Utility Functions', () => {
  describe('isEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
      expect(isEmail('test@')).toBe(false);
      expect(isEmail('test@.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isEmail('')).toBe(false);
      expect(isEmail(' ')).toBe(false);
      expect(isEmail('test@example')).toBe(false);
    });
  });

  describe('isPhone', () => {
    it('should validate phone numbers', () => {
      expect(isPhone('1234567890')).toBe(true);
      expect(isPhone('+1 234 567 8900')).toBe(true);
      expect(isPhone('(123) 456-7890')).toBe(true);
      expect(isPhone('+44-20-7946-0958')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isPhone('123')).toBe(false);
      expect(isPhone('abcdefghij')).toBe(false);
      expect(isPhone('')).toBe(false);
    });
  });

  describe('isURL', () => {
    it('should validate correct URLs', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://localhost:3000')).toBe(true);
      expect(isURL('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isURL('not-a-url')).toBe(false);
      expect(isURL('http://')).toBe(false);
      expect(isURL('')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('StrongPass123!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
      expect(isStrongPassword('C0mpl3x!Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('weak')).toBe(false);
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('PASSWORD')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('StrongPass')).toBe(false); // Missing number and special
    });
  });

  describe('isNumeric', () => {
    it('should validate numeric strings', () => {
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('123.45')).toBe(true);
      expect(isNumeric('-123')).toBe(true);
      expect(isNumeric('0')).toBe(true);
    });

    it('should reject non-numeric strings', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('12a')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric(' ')).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should validate integers', () => {
      expect(isInteger('123')).toBe(true);
      expect(isInteger('-456')).toBe(true);
      expect(isInteger('0')).toBe(true);
    });

    it('should reject non-integers', () => {
      expect(isInteger('123.45')).toBe(false);
      expect(isInteger('abc')).toBe(false);
      expect(isInteger('')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should validate numbers in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-5, 1, 10)).toBe(false);
    });
  });

  describe('isValidJSON', () => {
    it('should validate correct JSON', () => {
      expect(isValidJSON('{"name": "test"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJSON('{name: "test"}')).toBe(false);
      expect(isValidJSON('[1, 2, 3,]')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('isAlphaNumeric', () => {
    it('should validate alphanumeric strings', () => {
      expect(isAlphaNumeric('abc123')).toBe(true);
      expect(isAlphaNumeric('ABC')).toBe(true);
      expect(isAlphaNumeric('123')).toBe(true);
    });

    it('should reject non-alphanumeric strings', () => {
      expect(isAlphaNumeric('abc-123')).toBe(false);
      expect(isAlphaNumeric('abc 123')).toBe(false);
      expect(isAlphaNumeric('abc@123')).toBe(false);
      expect(isAlphaNumeric('')).toBe(false);
    });
  });

  describe('isHexColor', () => {
    it('should validate hex colors', () => {
      expect(isHexColor('#FF0000')).toBe(true);
      expect(isHexColor('#00ff00')).toBe(true);
      expect(isHexColor('#F0F')).toBe(true);
      expect(isHexColor('#000')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isHexColor('FF0000')).toBe(false);
      expect(isHexColor('#GG0000')).toBe(false);
      expect(isHexColor('#12345')).toBe(false);
      expect(isHexColor('')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex validation scenarios', () => {
      const userData = {
        email: 'user@example.com',
        phone: '+1-234-567-8900',
        website: 'https://example.com',
        password: 'SecureP@ss123'
      };

      expect(isEmail(userData.email)).toBe(true);
      expect(isPhone(userData.phone)).toBe(true);
      expect(isURL(userData.website)).toBe(true);
      expect(isStrongPassword(userData.password)).toBe(true);
    });

    it('should validate form data', () => {
      const formData = {
        age: '25',
        zipCode: '12345',
        color: '#FF5733',
        settings: '{"theme": "dark"}'
      };

      expect(isInteger(formData.age)).toBe(true);
      expect(isInRange(parseInt(formData.age), 18, 100)).toBe(true);
      expect(isAlphaNumeric(formData.zipCode)).toBe(true);
      expect(isHexColor(formData.color)).toBe(true);
      expect(isValidJSON(formData.settings)).toBe(true);
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = ['', ' ', null, undefined];
      
      edgeCases.forEach(testCase => {
        if (typeof testCase === 'string') {
          expect(isEmail(testCase)).toBe(false);
          expect(isPhone(testCase)).toBe(false);
          expect(isAlphaNumeric(testCase)).toBe(false);
        }
      });
    });
  });
});