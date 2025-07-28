import { describe, it, expect } from 'vitest';

// Format utility functions to test
const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const formatPhoneNumber = (phone: string, format: 'US' | 'international' = 'US'): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (format === 'international') {
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return `+${cleaned}`;
  }
  
  return cleaned;
};

const formatDate = (date: Date, format: 'short' | 'long' | 'iso' | 'custom' = 'short', customFormat?: string): string => {
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'iso':
      return date.toISOString().split('T')[0];
    case 'custom':
      if (!customFormat) return date.toLocaleDateString();
      // Simple custom format implementation
      return customFormat
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'));
    default:
      return date.toLocaleDateString();
  }
};

const formatTime = (date: Date, format: '12h' | '24h' = '12h'): string => {
  if (format === '24h') {
    return date.toLocaleTimeString('en-GB', { hour12: false });
  }
  return date.toLocaleTimeString('en-US', { hour12: true });
};

const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

const formatFileSize = (bytes: number): string => {
  return formatBytes(bytes, 1);
};

const formatAddress = (address: { street: string, city: string, state: string, zip: string, country?: string }): string => {
  const { street, city, state, zip, country } = address;
  let formatted = `${street}, ${city}, ${state} ${zip}`;
  if (country && country !== 'US') {
    formatted += `, ${country}`;
  }
  return formatted;
};

const formatName = (firstName: string, lastName: string, format: 'first-last' | 'last-first' | 'initials' = 'first-last'): string => {
  switch (format) {
    case 'first-last':
      return `${firstName} ${lastName}`;
    case 'last-first':
      return `${lastName}, ${firstName}`;
    case 'initials':
      return `${firstName.charAt(0).toUpperCase()}.${lastName.charAt(0).toUpperCase()}.`;
    default:
      return `${firstName} ${lastName}`;
  }
};

const formatCreditCard = (cardNumber: string, maskDigits: boolean = true): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length !== 16) return cardNumber;
  
  if (maskDigits) {
    return `**** **** **** ${cleaned.slice(-4)}`;
  }
  
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

const formatSSN = (ssn: string, masked: boolean = true): string => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return ssn;
  
  if (masked) {
    return `***-**-${cleaned.slice(-4)}`;
  }
  
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
};

const formatUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const formatJSON = (obj: any, indent: number = 2): string => {
  return JSON.stringify(obj, null, indent);
};

const formatCSV = (data: any[][], delimiter: string = ','): string => {
  return data.map(row => 
    row.map(cell => {
      const str = String(cell);
      return str.includes(delimiter) || str.includes('\n') || str.includes('"') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    }).join(delimiter)
  ).join('\n');
};

const formatMarkdown = (text: string, format: 'bold' | 'italic' | 'code' | 'link', url?: string): string => {
  switch (format) {
    case 'bold':
      return `**${text}**`;
    case 'italic':
      return `*${text}*`;
    case 'code':
      return `\`${text}\``;
    case 'link':
      return url ? `[${text}](${url})` : `[${text}](#)`;
    default:
      return text;
  }
};

const formatHTML = (text: string, tag: string, attributes?: Record<string, string>): string => {
  const attrs = attributes 
    ? ' ' + Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')
    : '';
  return `<${tag}${attrs}>${text}</${tag}>`;
};

describe('Format Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      expect(formatCurrency(1234.56)).toMatch(/\$1,234\.56/);
      expect(formatCurrency(0)).toMatch(/\$0\.00/);
      expect(formatCurrency(-500)).toMatch(/-?\$500\.00/);
    });

    it('should format different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toMatch(/€1,000\.00/);
      expect(formatCurrency(1000, 'GBP')).toMatch(/£1,000\.00/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1000000)).toBe('1,000,000.00');
      expect(formatNumber(123)).toBe('123.00');
    });

    it('should handle decimal places', () => {
      expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
      expect(formatNumber(1234.5, 0)).toBe('1,235');
    });
  });

  describe('formatBytes', () => {
    it('should format byte sizes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(2560, 0)).toBe('3 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
      expect(formatDuration(90061000)).toBe('1d 1h 1m 1s');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(500)).toBe('0s');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should format international numbers', () => {
      expect(formatPhoneNumber('11234567890', 'international')).toBe('+1 (123) 456-7890');
      expect(formatPhoneNumber('4412345678', 'international')).toBe('+4412345678');
    });

    it('should handle invalid numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('12345678901')).toBe('12345678901');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00');

    it('should format dates in different styles', () => {
      expect(formatDate(testDate, 'iso')).toBe('2023-12-25');
      expect(formatDate(testDate, 'short')).toMatch(/12\/25\/2023|25\/12\/2023/);
      expect(formatDate(testDate, 'long')).toContain('December');
    });

    it('should handle custom format', () => {
      expect(formatDate(testDate, 'custom', 'YYYY-MM-DD')).toBe('2023-12-25');
      expect(formatDate(testDate, 'custom', 'DD/MM/YYYY')).toBe('25/12/2023');
    });
  });

  describe('formatTime', () => {
    const testDate = new Date('2023-12-25T14:30:00');

    it('should format time in 12h format', () => {
      expect(formatTime(testDate, '12h')).toMatch(/2:30:00 PM/);
    });

    it('should format time in 24h format', () => {
      expect(formatTime(testDate, '24h')).toMatch(/14:30:00/);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.25)).toBe('25.0%');
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
      expect(formatPercentage(1)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatAddress', () => {
    it('should format US addresses', () => {
      const address = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      };
      expect(formatAddress(address)).toBe('123 Main St, Anytown, CA 12345');
    });

    it('should include country for non-US addresses', () => {
      const address = {
        street: '10 Downing St',
        city: 'London',
        state: 'England',
        zip: 'SW1A 2AA',
        country: 'UK'
      };
      expect(formatAddress(address)).toBe('10 Downing St, London, England SW1A 2AA, UK');
    });
  });

  describe('formatName', () => {
    it('should format names in different styles', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe');
      expect(formatName('John', 'Doe', 'last-first')).toBe('Doe, John');
      expect(formatName('John', 'Doe', 'initials')).toBe('J.D.');
    });
  });

  describe('formatCreditCard', () => {
    it('should format and mask credit card numbers', () => {
      expect(formatCreditCard('1234567890123456')).toBe('**** **** **** 3456');
      expect(formatCreditCard('1234567890123456', false)).toBe('1234 5678 9012 3456');
    });

    it('should handle invalid card numbers', () => {
      expect(formatCreditCard('123')).toBe('123');
      expect(formatCreditCard('12345678901234567')).toBe('12345678901234567');
    });
  });

  describe('formatSSN', () => {
    it('should format and mask SSN', () => {
      expect(formatSSN('123456789')).toBe('***-**-6789');
      expect(formatSSN('123456789', false)).toBe('123-45-6789');
    });

    it('should handle invalid SSN', () => {
      expect(formatSSN('123')).toBe('123');
      expect(formatSSN('1234567890')).toBe('1234567890');
    });
  });

  describe('formatUrl', () => {
    it('should add https if missing', () => {
      expect(formatUrl('example.com')).toBe('https://example.com');
      expect(formatUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve existing protocol', () => {
      expect(formatUrl('http://example.com')).toBe('http://example.com');
      expect(formatUrl('https://example.com')).toBe('https://example.com');
    });
  });

  describe('formatJSON', () => {
    it('should format JSON with indentation', () => {
      const obj = { name: 'John', age: 30 };
      const formatted = formatJSON(obj);
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
    });

    it('should handle custom indentation', () => {
      const obj = { test: true };
      const formatted = formatJSON(obj, 4);
      expect(formatted).toContain('    ');
    });
  });

  describe('formatCSV', () => {
    it('should format data as CSV', () => {
      const data = [['Name', 'Age'], ['John', '30'], ['Jane', '25']];
      const csv = formatCSV(data);
      expect(csv).toBe('Name,Age\nJohn,30\nJane,25');
    });

    it('should handle quotes and commas', () => {
      const data = [['Name', 'Description'], ['John', 'Engineer, Software']];
      const csv = formatCSV(data);
      expect(csv).toBe('Name,Description\nJohn,\"Engineer, Software\"');
    });

    it('should handle custom delimiter', () => {
      const data = [['A', 'B'], ['1', '2']];
      const csv = formatCSV(data, ';');
      expect(csv).toBe('A;B\n1;2');
    });
  });

  describe('formatMarkdown', () => {
    it('should format markdown syntax', () => {
      expect(formatMarkdown('bold text', 'bold')).toBe('**bold text**');
      expect(formatMarkdown('italic text', 'italic')).toBe('*italic text*');
      expect(formatMarkdown('code', 'code')).toBe('`code`');
      expect(formatMarkdown('link', 'link', 'http://example.com')).toBe('[link](http://example.com)');
    });

    it('should handle link without URL', () => {
      expect(formatMarkdown('link', 'link')).toBe('[link](#)');
    });
  });

  describe('formatHTML', () => {
    it('should format HTML tags', () => {
      expect(formatHTML('Hello', 'p')).toBe('<p>Hello</p>');
      expect(formatHTML('Title', 'h1')).toBe('<h1>Title</h1>');
    });

    it('should include attributes', () => {
      const result = formatHTML('Link', 'a', { href: 'http://example.com', target: '_blank' });
      expect(result).toBe('<a href=\"http://example.com\" target=\"_blank\">Link</a>');
    });
  });

  describe('Integration Tests', () => {
    it('should format complete user profile', () => {
      const profile = {
        name: { first: 'John', last: 'Doe' },
        email: 'john.doe@example.com',
        phone: '1234567890',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345'
        },
        salary: 75000,
        startDate: new Date('2020-01-15'),
        performance: 0.92
      };

      const formatted = {
        name: formatName(profile.name.first, profile.name.last),
        phone: formatPhoneNumber(profile.phone),
        address: formatAddress(profile.address),
        salary: formatCurrency(profile.salary),
        startDate: formatDate(profile.startDate, 'long'),
        performance: formatPercentage(profile.performance)
      };

      expect(formatted.name).toBe('John Doe');
      expect(formatted.phone).toBe('(123) 456-7890');
      expect(formatted.address).toBe('123 Main St, Anytown, CA 12345');
      expect(formatted.salary).toBe('$75,000.00');
      expect(formatted.startDate).toContain('January');
      expect(formatted.performance).toBe('92.0%');
    });

    it('should format financial report', () => {
      const data = [
        ['Quarter', 'Revenue', 'Expenses', 'Profit'],
        ['Q1', 150000, 120000, 30000],
        ['Q2', 175000, 140000, 35000],
        ['Q3', 200000, 160000, 40000]
      ];

      const formattedData = data.map((row, index) => {
        if (index === 0) return row; // Header row
        return [
          row[0], // Quarter
          formatCurrency(row[1] as number),
          formatCurrency(row[2] as number),
          formatCurrency(row[3] as number)
        ];
      });

      expect(formattedData[1][1]).toBe('$150,000.00');
      expect(formattedData[2][2]).toBe('$140,000.00');
      expect(formattedData[3][3]).toBe('$40,000.00');
    });

    it('should format system information', () => {
      const systemInfo = {
        diskUsage: 1073741824, // 1 GB
        memoryUsage: 536870912, // 512 MB
        uptime: 7200000, // 2 hours
        cpuUsage: 0.75
      };

      const formatted = {
        diskUsage: formatBytes(systemInfo.diskUsage),
        memoryUsage: formatBytes(systemInfo.memoryUsage),
        uptime: formatDuration(systemInfo.uptime),
        cpuUsage: formatPercentage(systemInfo.cpuUsage)
      };

      expect(formatted.diskUsage).toBe('1 GB');
      expect(formatted.memoryUsage).toBe('512 MB');
      expect(formatted.uptime).toBe('2h 0m 0s');
      expect(formatted.cpuUsage).toBe('75.0%');
    });
  });
});