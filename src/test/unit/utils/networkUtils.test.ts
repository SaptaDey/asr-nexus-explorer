import { describe, it, expect } from 'vitest';

// Network and file system utility functions to test
const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

const isValidIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6ShortRegex = /^::1$|^::$/;
  return ipv6Regex.test(ip) || ipv6ShortRegex.test(ip);
};

const parseURL = (url: string): { protocol: string; hostname: string; port: string; pathname: string; search: string } => {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search
    };
  } catch {
    return {
      protocol: '',
      hostname: '',
      port: '',
      pathname: '',
      search: ''
    };
  }
};

const buildURL = (base: string, params: Record<string, string | number>): string => {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const extractDomain = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // Try to extract domain from string without protocol
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)/i);
    return match ? match[1] : '';
  }
};

const isLocalHost = (url: string): boolean => {
  const domain = extractDomain(url);
  return ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(domain);
};

const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
};

const getFileName = (path: string): string => {
  return path.split('/').pop() || path.split('\\').pop() || '';
};

const getFileNameWithoutExt = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? filename : filename.slice(0, lastDot);
};

const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
};

const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'ogv'];
  const ext = getFileExtension(filename);
  return videoExtensions.includes(ext);
};

const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
  const ext = getFileExtension(filename);
  return audioExtensions.includes(ext);
};

const isDocumentFile = (filename: string): boolean => {
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
  const ext = getFileExtension(filename);
  return docExtensions.includes(ext);
};

const isSpreadsheetFile = (filename: string): boolean => {
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods', 'numbers'];
  const ext = getFileExtension(filename);
  return spreadsheetExtensions.includes(ext);
};

const isPresentationFile = (filename: string): boolean => {
  const presentationExtensions = ['ppt', 'pptx', 'odp', 'key'];
  const ext = getFileExtension(filename);
  return presentationExtensions.includes(ext);
};

const isArchiveFile = (filename: string): boolean => {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  const ext = getFileExtension(filename);
  return archiveExtensions.includes(ext);
};

const isExecutableFile = (filename: string): boolean => {
  const executableExtensions = ['exe', 'msi', 'dmg', 'app', 'deb', 'rpm'];
  const ext = getFileExtension(filename);
  return executableExtensions.includes(ext);
};

const getMimeType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    
    // Spreadsheets
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    
    // Web
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

const sanitizeFilename = (filename: string): string => {
  // Remove or replace characters that are invalid in file names
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const joinPath = (...parts: string[]): string => {
  return parts
    .map(part => part.replace(/^\/+|\/+$/g, ''))
    .filter(part => part.length > 0)
    .join('/');
};

const normalizePath = (path: string): string => {
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/\./g, '/')
    .replace(/\/[^\/]+\/\.\.\//g, '/');
};

const isAbsolutePath = (path: string): boolean => {
  return path.startsWith('/') || /^[a-zA-Z]:/.test(path);
};

const getPathDirectory = (path: string): string => {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return lastSlash === -1 ? '' : path.slice(0, lastSlash);
};

const calculateChecksum = (text: string): string => {
  // Simple hash function for testing purposes
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

const generateRandomId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const isValidPort = (port: string | number): boolean => {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
};

const parseUserAgent = (userAgent: string): { browser: string; os: string; mobile: boolean } => {
  const result = { browser: 'Unknown', os: 'Unknown', mobile: false };
  
  // Browser detection
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  
  // OS detection
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';
  
  // Mobile detection
  result.mobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  return result;
};

describe('Network and File System Utility Functions', () => {
  describe('IP address validation', () => {
    it('should validate IPv4 addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('127.0.0.1')).toBe(true);
      expect(isValidIP('255.255.255.255')).toBe(true);
      expect(isValidIP('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('192.168.1.1.1')).toBe(false);
      expect(isValidIP('abc.def.ghi.jkl')).toBe(false);
    });

    it('should validate IPv6 addresses', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIPv6('::1')).toBe(true);
      expect(isValidIPv6('::')).toBe(true);
    });

    it('should reject invalid IPv6 addresses', () => {
      expect(isValidIPv6('invalid:ipv6')).toBe(false);
      expect(isValidIPv6('192.168.1.1')).toBe(false);
    });
  });

  describe('URL utilities', () => {
    it('should parse URLs correctly', () => {
      const parsed = parseURL('https://example.com:8080/path?query=value');
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('example.com');
      expect(parsed.port).toBe('8080');
      expect(parsed.pathname).toBe('/path');
      expect(parsed.search).toBe('?query=value');
    });

    it('should handle invalid URLs', () => {
      const parsed = parseURL('invalid-url');
      expect(parsed.protocol).toBe('');
      expect(parsed.hostname).toBe('');
    });

    it('should build URLs with parameters', () => {
      const url = buildURL('https://api.example.com', { 
        key: 'value', 
        page: 1,
        limit: 10 
      });
      expect(url).toContain('key=value');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });

    it('should extract domain from URLs', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
      expect(extractDomain('http://subdomain.example.org')).toBe('subdomain.example.org');
      expect(extractDomain('example.com')).toBe('example.com');
    });

    it('should identify localhost URLs', () => {
      expect(isLocalHost('http://localhost:3000')).toBe(true);
      expect(isLocalHost('https://127.0.0.1')).toBe(true);
      expect(isLocalHost('http://example.com')).toBe(false);
    });
  });

  describe('file extension utilities', () => {
    it('should get file extensions correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.JPEG')).toBe('jpeg');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should get filenames from paths', () => {
      expect(getFileName('/path/to/file.txt')).toBe('file.txt');
      expect(getFileName('C:/Users/file.doc')).toBe('file.doc');
      expect(getFileName('justfilename.pdf')).toBe('justfilename.pdf');
    });

    it('should get filename without extension', () => {
      expect(getFileNameWithoutExt('document.pdf')).toBe('document');
      expect(getFileNameWithoutExt('image.jpeg')).toBe('image');
      expect(getFileNameWithoutExt('noextension')).toBe('noextension');
    });
  });

  describe('file type detection', () => {
    it('should identify image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('image.png')).toBe(true);
      expect(isImageFile('vector.svg')).toBe(true);
      expect(isImageFile('document.pdf')).toBe(false);
    });

    it('should identify video files', () => {
      expect(isVideoFile('movie.mp4')).toBe(true);
      expect(isVideoFile('clip.avi')).toBe(true);
      expect(isVideoFile('video.webm')).toBe(true);
      expect(isVideoFile('audio.mp3')).toBe(false);
    });

    it('should identify audio files', () => {
      expect(isAudioFile('song.mp3')).toBe(true);
      expect(isAudioFile('audio.wav')).toBe(true);
      expect(isAudioFile('music.flac')).toBe(true);
      expect(isAudioFile('video.mp4')).toBe(false);
    });

    it('should identify document files', () => {
      expect(isDocumentFile('report.pdf')).toBe(true);
      expect(isDocumentFile('letter.doc')).toBe(true);
      expect(isDocumentFile('notes.txt')).toBe(true);
      expect(isDocumentFile('image.jpg')).toBe(false);
    });

    it('should identify spreadsheet files', () => {
      expect(isSpreadsheetFile('data.xlsx')).toBe(true);
      expect(isSpreadsheetFile('budget.csv')).toBe(true);
      expect(isSpreadsheetFile('sheet.ods')).toBe(true);
      expect(isSpreadsheetFile('document.pdf')).toBe(false);
    });

    it('should identify presentation files', () => {
      expect(isPresentationFile('slides.pptx')).toBe(true);
      expect(isPresentationFile('presentation.odp')).toBe(true);
      expect(isPresentationFile('keynote.key')).toBe(true);
      expect(isPresentationFile('document.doc')).toBe(false);
    });

    it('should identify archive files', () => {
      expect(isArchiveFile('backup.zip')).toBe(true);
      expect(isArchiveFile('archive.tar.gz')).toBe(true); // Gets 'gz' extension
      expect(isArchiveFile('compressed.7z')).toBe(true);
      expect(isArchiveFile('document.pdf')).toBe(false);
    });

    it('should identify executable files', () => {
      expect(isExecutableFile('program.exe')).toBe(true);
      expect(isExecutableFile('installer.msi')).toBe(true);
      expect(isExecutableFile('app.dmg')).toBe(true);
      expect(isExecutableFile('document.pdf')).toBe(false);
    });
  });

  describe('MIME type detection', () => {
    it('should get correct MIME types', () => {
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('document.pdf')).toBe('application/pdf');
      expect(getMimeType('data.csv')).toBe('text/csv');
      expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    });
  });

  describe('filename utilities', () => {
    it('should sanitize filenames', () => {
      expect(sanitizeFilename('file name.txt')).toBe('file_name.txt');
      expect(sanitizeFilename('file<>:\"/\\\\|?*.txt')).toBe('file_.txt');
      expect(sanitizeFilename('  multiple   spaces  ')).toBe('multiple_spaces');
    });
  });

  describe('path utilities', () => {
    it('should join paths correctly', () => {
      expect(joinPath('path', 'to', 'file.txt')).toBe('path/to/file.txt');
      expect(joinPath('/path/', '/to/', '/file.txt')).toBe('path/to/file.txt');
      expect(joinPath('', 'path', '', 'file.txt')).toBe('path/file.txt');
    });

    it('should normalize paths', () => {
      expect(normalizePath('path//to///file.txt')).toBe('path/to/file.txt');
      expect(normalizePath('path\\\\to\\\\file.txt')).toBe('path/to/file.txt');
      expect(normalizePath('path/to/file.txt')).toBe('path/to/file.txt');
    });

    it('should identify absolute paths', () => {
      expect(isAbsolutePath('/absolute/path')).toBe(true);
      expect(isAbsolutePath('C:\\\\absolute\\\\path')).toBe(true);
      expect(isAbsolutePath('relative/path')).toBe(false);
      expect(isAbsolutePath('./relative/path')).toBe(false);
    });

    it('should get path directory', () => {
      expect(getPathDirectory('/path/to/file.txt')).toBe('/path/to');
      expect(getPathDirectory('C:\\Users\\file.doc')).toBe('C:\\Users');
      expect(getPathDirectory('file.txt')).toBe('');
    });
  });

  describe('utility functions', () => {
    it('should calculate checksums', () => {
      const checksum1 = calculateChecksum('hello world');
      const checksum2 = calculateChecksum('hello world');
      const checksum3 = calculateChecksum('different text');
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
      expect(typeof checksum1).toBe('string');
    });

    it('should generate random IDs', () => {
      const id1 = generateRandomId();
      const id2 = generateRandomId();
      const longId = generateRandomId(16);
      
      expect(id1).toHaveLength(8);
      expect(longId).toHaveLength(16);
      expect(id1).not.toBe(id2);
      expect(/^[A-Za-z0-9]+$/.test(id1)).toBe(true);
    });

    it('should validate port numbers', () => {
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort('3000')).toBe(true);
      expect(isValidPort(65535)).toBe(true);
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort('invalid')).toBe(false);
    });
  });

  describe('user agent parsing', () => {
    it('should parse Chrome user agent', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const parsed = parseUserAgent(ua);
      
      expect(parsed.browser).toBe('Chrome');
      expect(parsed.os).toBe('Windows');
      expect(parsed.mobile).toBe(false);
    });

    it('should parse mobile user agent', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(ua);
      
      expect(parsed.browser).toBe('Safari');
      expect(parsed.mobile).toBe(true);
    });

    it('should handle unknown user agent', () => {
      const parsed = parseUserAgent('UnknownBrowser/1.0');
      
      expect(parsed.browser).toBe('Unknown');
      expect(parsed.os).toBe('Unknown');
      expect(parsed.mobile).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should process file upload metadata', () => {
      const files = [
        { name: 'document.pdf', size: 1048576 },
        { name: 'image.jpg', size: 2097152 },
        { name: 'video.mp4', size: 52428800 }
      ];

      const processed = files.map(file => ({
        name: file.name,
        sanitizedName: sanitizeFilename(file.name),
        extension: getFileExtension(file.name),
        mimeType: getMimeType(file.name),
        isImage: isImageFile(file.name),
        isVideo: isVideoFile(file.name),
        isDocument: isDocumentFile(file.name),
        checksum: calculateChecksum(file.name)
      }));

      expect(processed[0].isDocument).toBe(true);
      expect(processed[1].isImage).toBe(true);
      expect(processed[2].isVideo).toBe(true);
      expect(processed[0].mimeType).toBe('application/pdf');
      expect(processed[1].mimeType).toBe('image/jpeg');
      expect(processed[2].mimeType).toBe('video/mp4');
    });

    it('should build API endpoint with validation', () => {
      const baseUrl = 'https://api.example.com';
      const endpoint = '/users';
      const params = { page: 1, limit: 10, sort: 'name' };
      
      const fullUrl = buildURL(baseUrl + endpoint, params);
      const parsed = parseURL(fullUrl);
      const domain = extractDomain(fullUrl);
      const isLocal = isLocalHost(fullUrl);
      
      expect(domain).toBe('api.example.com');
      expect(isLocal).toBe(false);
      expect(parsed.pathname).toBe('/users');
      expect(fullUrl).toContain('page=1');
    });

    it('should validate network configuration', () => {
      const config = {
        host: '192.168.1.100',
        port: 8080,
        protocol: 'https',
        path: '/api/v1/data'
      };

      const validations = {
        validIP: isValidIP(config.host),
        validPort: isValidPort(config.port),
        fullUrl: `${config.protocol}://${config.host}:${config.port}${config.path}`,
        isLocal: isLocalHost(config.host)
      };

      expect(validations.validIP).toBe(true);
      expect(validations.validPort).toBe(true);
      expect(validations.isLocal).toBe(false);
      expect(validations.fullUrl).toBe('https://192.168.1.100:8080/api/v1/data');
    });

    it('should organize file system structure', () => {
      const files = [
        '/project/src/utils/helpers.js',
        '/project/assets/images/logo.png',
        '/project/docs/readme.txt',
        'C:\\\\Project\\\\data\\\\export.csv'
      ];

      const organized = files.map(file => ({
        fullPath: file,
        normalizedPath: normalizePath(file),
        directory: getPathDirectory(file),
        filename: getFileName(file),
        nameWithoutExt: getFileNameWithoutExt(getFileName(file)),
        extension: getFileExtension(file),
        isAbsolute: isAbsolutePath(file),
        type: isImageFile(file) ? 'image' : 
              isDocumentFile(file) ? 'document' : 
              isSpreadsheetFile(file) ? 'spreadsheet' : 'other'
      }));

      expect(organized[0].type).toBe('other');
      expect(organized[1].type).toBe('image');
      expect(organized[2].type).toBe('document');
      expect(organized[3].type).toBe('spreadsheet');
      expect(organized[0].isAbsolute).toBe(true);
      expect(organized[1].extension).toBe('png');
    });
  });
});