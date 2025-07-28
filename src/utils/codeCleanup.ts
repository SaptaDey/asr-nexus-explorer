/**
 * Code Cleanup Utilities
 * Provides tools for removing technical debt and standardizing patterns
 */

import { config } from '@/config/environment';

// Common patterns that should be standardized
export const STANDARD_PATTERNS = {
  // Error handling pattern
  errorHandling: `
try {
  // Operation code
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error(\`Operation failed: \${error.message}\`);
}`,

  // Async function pattern
  asyncFunction: `
export const functionName = async (param: Type): Promise<ReturnType> => {
  try {
    const result = await operation(param);
    return result;
  } catch (error) {
    throw new Error(\`Function failed: \${error.message}\`);
  }
};`,

  // Component prop validation
  componentProps: `
interface ComponentProps {
  required: string;
  optional?: number;
  callback: (value: string) => void;
}

export const Component: React.FC<ComponentProps> = ({
  required,
  optional = 0,
  callback
}) => {
  // Component implementation
};`,

  // Service class pattern
  serviceClass: `
class ServiceName {
  private readonly config: ConfigType;

  constructor(config: ConfigType) {
    this.config = config;
  }

  public async method(param: ParamType): Promise<ReturnType> {
    // Implementation
  }
}`,
};

// Code quality metrics
export interface CodeQualityMetrics {
  totalFiles: number;
  linesOfCode: number;
  duplicatedLines: number;
  complexityScore: number;
  testCoverage: number;
  typeScriptCoverage: number;
  technicalDebtRatio: number;
}

// Code smell detection
export const CODE_SMELLS = {
  // Long parameter lists
  longParameterList: /\([^)]{100,}\)/g,
  
  // TODO comments
  todoComments: /\/\/\s*(TODO|FIXME|HACK|BUG)[\s:]*(.*)/gi,
  
  // Console.log statements
  consoleStatements: /console\.(log|warn|error|info|debug)\(/g,
  
  // Any types
  anyTypes: /:\s*any\b/g,
  
  // Unused imports (simplified pattern)
  unusedImports: /^import\s+.*from\s+['"][^'"]*['"];\s*$/gm,
  
  // Magic numbers
  magicNumbers: /\b\d{2,}\b/g,
  
  // Long functions (approximate)
  longFunctions: /function\s+\w+\([^)]*\)\s*\{[\s\S]{1000,}?\}/g,
  
  // Nested ternary operators
  nestedTernary: /\?[^:]*\?[^:]*:/g,
};

// Code standardization utilities
export class CodeStandardizer {
  private static readonly MAX_LINE_LENGTH = 100;
  private static readonly MAX_FUNCTION_LENGTH = 50;
  private static readonly MAX_PARAMETER_COUNT = 5;

  // Analyze code quality
  static analyzeCodeQuality(code: string): CodeQualityMetrics {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    return {
      totalFiles: 1, // Single file analysis
      linesOfCode: nonEmptyLines.length,
      duplicatedLines: this.findDuplicatedLines(lines),
      complexityScore: this.calculateComplexity(code),
      testCoverage: 0, // Would need test file analysis
      typeScriptCoverage: this.calculateTypeScriptCoverage(code),
      technicalDebtRatio: this.calculateTechnicalDebt(code),
    };
  }

  // Find code smells
  static findCodeSmells(code: string): Array<{
    type: string;
    line: number;
    message: string;
    suggestion?: string;
  }> {
    const smells: Array<{ type: string; line: number; message: string; suggestion?: string }> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for TODO comments
      const todoMatch = line.match(CODE_SMELLS.todoComments);
      if (todoMatch) {
        smells.push({
          type: 'todo_comment',
          line: index + 1,
          message: `TODO comment found: ${todoMatch[2] || ''}`,
          suggestion: 'Consider creating a proper issue or removing the comment'
        });
      }

      // Check for console statements
      if (CODE_SMELLS.consoleStatements.test(line)) {
        smells.push({
          type: 'console_statement',
          line: index + 1,
          message: 'Console statement found',
          suggestion: 'Use proper logging service or remove in production'
        });
      }

      // Check for any types
      if (CODE_SMELLS.anyTypes.test(line)) {
        smells.push({
          type: 'any_type',
          line: index + 1,
          message: 'Any type usage found',
          suggestion: 'Replace with specific type definition'
        });
      }

      // Check line length
      if (line.length > this.MAX_LINE_LENGTH) {
        smells.push({
          type: 'long_line',
          line: index + 1,
          message: `Line too long (${line.length} chars)`,
          suggestion: 'Break line into multiple lines or extract variables'
        });
      }
    });

    return smells;
  }

  // Generate improvement suggestions
  static generateImprovements(code: string): Array<{
    type: string;
    description: string;
    before: string;
    after: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const improvements: Array<{
      type: string;
      description: string;
      before: string;
      after: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    // Replace any types
    const anyMatches = code.match(CODE_SMELLS.anyTypes);
    if (anyMatches) {
      improvements.push({
        type: 'type_safety',
        description: 'Replace any types with specific type definitions',
        before: ': any',
        after: ': SpecificType',
        priority: 'high'
      });
    }

    // Replace console statements
    const consoleMatches = code.match(CODE_SMELLS.consoleStatements);
    if (consoleMatches) {
      improvements.push({
        type: 'logging',
        description: 'Replace console statements with proper logging',
        before: 'console.log(',
        after: 'logger.info(',
        priority: 'medium'
      });
    }

    return improvements;
  }

  // Standardize imports
  static standardizeImports(code: string): string {
    // Group imports: React first, then UI components, then utils/services
    const lines = code.split('\n');
    const importLines: string[] = [];
    const otherLines: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else {
        otherLines.push(line);
      }
    });

    // Sort imports by category
    const reactImports = importLines.filter(line => 
      line.includes('react') || line.includes('React'));
    const uiImports = importLines.filter(line => 
      line.includes('@/components/ui'));
    const componentImports = importLines.filter(line => 
      line.includes('@/components') && !line.includes('@/components/ui'));
    const serviceImports = importLines.filter(line => 
      line.includes('@/services') || line.includes('@/utils'));
    const otherImports = importLines.filter(line =>
      !reactImports.includes(line) && 
      !uiImports.includes(line) && 
      !componentImports.includes(line) && 
      !serviceImports.includes(line));

    const sortedImports = [
      ...reactImports.sort(),
      ...uiImports.sort(),
      ...componentImports.sort(),
      ...serviceImports.sort(),
      ...otherImports.sort()
    ];

    return [...sortedImports, '', ...otherLines].join('\n');
  }

  // Private helper methods
  private static findDuplicatedLines(lines: string[]): number {
    const lineMap = new Map<string, number>();
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        lineMap.set(trimmed, (lineMap.get(trimmed) || 0) + 1);
      }
    });

    let duplicated = 0;
    lineMap.forEach(count => {
      if (count > 1) duplicated += count - 1;
    });

    return duplicated;
  }

  private static calculateComplexity(code: string): number {
    // Simplified cyclomatic complexity
    const conditionals = (code.match(/if|else|while|for|switch|case|\?/g) || []).length;
    const functions = (code.match(/function|=>/g) || []).length;
    return conditionals + functions;
  }

  private static calculateTypeScriptCoverage(code: string): number {
    const totalDeclarations = (code.match(/:\s*\w+/g) || []).length;
    const anyDeclarations = (code.match(/:\s*any\b/g) || []).length;
    return totalDeclarations > 0 ? ((totalDeclarations - anyDeclarations) / totalDeclarations) * 100 : 100;
  }

  private static calculateTechnicalDebt(code: string): number {
    const todoCount = (code.match(CODE_SMELLS.todoComments) || []).length;
    const consoleCount = (code.match(CODE_SMELLS.consoleStatements) || []).length;
    const anyCount = (code.match(CODE_SMELLS.anyTypes) || []).length;
    const lines = code.split('\n').length;
    
    const debtItems = todoCount + consoleCount + anyCount;
    return lines > 0 ? (debtItems / lines) * 100 : 0;
  }
}

// Pattern standardization utilities
export const standardizeCodePatterns = (code: string): string => {
  let standardized = code;

  // Standardize error handling
  standardized = standardized.replace(
    /catch\s*\(\s*\w+\s*\)\s*\{\s*console\.(log|error)\([^}]+\}/g,
    `catch (error) {
  console.error('Operation failed:', error);
  throw new Error(\`Operation failed: \${error.message}\`);
}`
  );

  // Standardize imports
  standardized = CodeStandardizer.standardizeImports(standardized);

  return standardized;
};

// Development mode helpers
export const developmentHelpers = {
  // Log cleanup suggestions
  logCleanupSuggestions: (filePath: string, code: string) => {
    if (!config.ENABLE_DEBUG) return;
    
    const smells = CodeStandardizer.findCodeSmells(code);
    if (smells.length > 0) {
      console.group(`🧹 Code cleanup suggestions for ${filePath}:`);
      smells.forEach(smell => {
        console.warn(`Line ${smell.line}: ${smell.message}`);
        if (smell.suggestion) {
          console.info(`💡 Suggestion: ${smell.suggestion}`);
        }
      });
      console.groupEnd();
    }
  },

  // Performance analysis
  analyzePerformance: (componentName: string, renderTime: number) => {
    if (!config.ENABLE_DEBUG) return;
    
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`⚡ Performance: ${componentName} took ${renderTime}ms to render`);
    }
  }
};

export default CodeStandardizer;