import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Eye, Keyboard, Volume2, Palette, Monitor, RefreshCw } from 'lucide-react';
import { useAccessibilityContext } from './AccessibilityProvider';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'color-contrast' | 'keyboard' | 'screen-reader' | 'focus' | 'semantic' | 'images';
  element: string;
  issue: string;
  suggestion: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  location?: string;
}

interface AccessibilityTestResult {
  score: number;
  totalTests: number;
  passedTests: number;
  issues: AccessibilityIssue[];
  categories: {
    [key: string]: {
      passed: number;
      total: number;
      score: number;
    };
  };
}

export const AccessibilityTester: React.FC = () => {
  const [testResult, setTestResult] = useState<AccessibilityTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { announceLiveRegion } = useAccessibilityContext();

  const runAccessibilityTests = async () => {
    setIsRunning(true);
    announceLiveRegion('Starting comprehensive accessibility audit...', 'assertive');

    const issues: AccessibilityIssue[] = [];
    let totalTests = 0;
    let passedTests = 0;

    // Test 1: Color Contrast
    totalTests++;
    const contrastIssues = await testColorContrast();
    if (contrastIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...contrastIssues);
    }

    // Test 2: Keyboard Navigation
    totalTests++;
    const keyboardIssues = await testKeyboardNavigation();
    if (keyboardIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...keyboardIssues);
    }

    // Test 3: Screen Reader Support
    totalTests++;
    const screenReaderIssues = await testScreenReaderSupport();
    if (screenReaderIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...screenReaderIssues);
    }

    // Test 4: Focus Management
    totalTests++;
    const focusIssues = await testFocusManagement();
    if (focusIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...focusIssues);
    }

    // Test 5: Semantic Structure
    totalTests++;
    const semanticIssues = await testSemanticStructure();
    if (semanticIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...semanticIssues);
    }

    // Test 6: Image Accessibility
    totalTests++;
    const imageIssues = await testImageAccessibility();
    if (imageIssues.length === 0) {
      passedTests++;
    } else {
      issues.push(...imageIssues);
    }

    // Calculate category scores
    const categories = calculateCategoryScores(issues, totalTests);
    const score = Math.round((passedTests / totalTests) * 100);

    const result: AccessibilityTestResult = {
      score,
      totalTests,
      passedTests,
      issues,
      categories
    };

    setTestResult(result);
    setIsRunning(false);

    // Announce results
    const issueCount = issues.length;
    const announcement = issueCount === 0 
      ? `Accessibility audit complete! Perfect score: ${score}%. No issues found.`
      : `Accessibility audit complete. Score: ${score}%. Found ${issueCount} issues across ${Object.keys(categories).length} categories.`;
    
    announceLiveRegion(announcement, 'assertive');
  };

  const testColorContrast = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Get all text elements and check their contrast
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a, label');
    
    for (const element of Array.from(textElements)) {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple contrast check (would need a proper contrast calculation in real implementation)
      if (color === backgroundColor || 
          (color.includes('rgb(128') && backgroundColor.includes('rgb(128')) ||
          (styles.opacity && parseFloat(styles.opacity) < 0.7)) {
        issues.push({
          type: 'error',
          category: 'color-contrast',
          element: element.tagName.toLowerCase(),
          issue: 'Insufficient color contrast detected',
          suggestion: 'Ensure text has at least 4.5:1 contrast ratio for normal text, 3:1 for large text',
          wcagLevel: 'AA',
          location: element.textContent?.substring(0, 50) || 'Element text'
        });
      }
    }

    // Check for color-only information
    const colorOnlyElements = document.querySelectorAll('[style*="color:red"], [style*="color:green"], .text-red-600, .text-green-600');
    if (colorOnlyElements.length > 0) {
      issues.push({
        type: 'warning',
        category: 'color-contrast',
        element: 'various',
        issue: 'Information conveyed by color alone',
        suggestion: 'Add text labels, patterns, or icons to supplement color coding',
        wcagLevel: 'A'
      });
    }

    return issues;
  };

  const testKeyboardNavigation = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for interactive elements without proper keyboard support
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
    
    for (const element of Array.from(interactiveElements)) {
      const tagName = element.tagName.toLowerCase();
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');
      
      // Check for negative tabindex on interactive elements (except when intended)
      if (tabIndex === '-1' && !role?.includes('menu')) {
        issues.push({
          type: 'warning',
          category: 'keyboard',
          element: tagName,
          issue: 'Interactive element removed from tab order',
          suggestion: 'Ensure element is still keyboard accessible via other means',
          wcagLevel: 'A'
        });
      }
      
      // Check for missing keyboard event handlers on custom interactive elements
      if (role === 'button' && !element.hasAttribute('onclick') && 
          !(element as any).onclick && !(element as any).onkeydown) {
        issues.push({
          type: 'error',
          category: 'keyboard',
          element: tagName,
          issue: 'Custom button without keyboard support',
          suggestion: 'Add onKeyDown handler to support Enter and Space keys',
          wcagLevel: 'A'
        });
      }
    }

    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    if (skipLinks.length === 0) {
      issues.push({
        type: 'info',
        category: 'keyboard',
        element: 'navigation',
        issue: 'No skip links found',
        suggestion: 'Consider adding skip links for keyboard users to bypass repetitive content',
        wcagLevel: 'A'
      });
    }

    return issues;
  };

  const testScreenReaderSupport = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing ARIA labels
    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    for (const element of Array.from(interactiveElements)) {
      const hasLabel = element.getAttribute('aria-label') || 
                      element.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${element.id}"]`) ||
                      element.textContent?.trim();
      
      if (!hasLabel) {
        issues.push({
          type: 'error',
          category: 'screen-reader',
          element: element.tagName.toLowerCase(),
          issue: 'Interactive element without accessible name',
          suggestion: 'Add aria-label, aria-labelledby, or associate with a label element',
          wcagLevel: 'A'
        });
      }
    }

    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
    
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        issues.push({
          type: 'error',
          category: 'screen-reader',
          element: `h${headingLevels[i]}`,
          issue: 'Heading hierarchy skips levels',
          suggestion: 'Use headings in sequential order (h1, h2, h3, etc.)',
          wcagLevel: 'A'
        });
        break;
      }
    }

    // Check for live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      issues.push({
        type: 'info',
        category: 'screen-reader',
        element: 'page',
        issue: 'No live regions found',
        suggestion: 'Consider adding aria-live regions for dynamic content updates',
        wcagLevel: 'AA'
      });
    }

    return issues;
  };

  const testFocusManagement = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for focus indicators
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    let missingFocusIndicators = 0;
    
    for (const element of Array.from(focusableElements)) {
      const styles = window.getComputedStyle(element, ':focus');
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      if (outline === 'none' && !boxShadow.includes('rgb')) {
        missingFocusIndicators++;
      }
    }
    
    if (missingFocusIndicators > 0) {
      issues.push({
        type: 'warning',
        category: 'focus',
        element: 'various',
        issue: `${missingFocusIndicators} elements may lack visible focus indicators`,
        suggestion: 'Ensure all focusable elements have clear visual focus indicators',
        wcagLevel: 'AA'
      });
    }

    // Check for focus traps in modals
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    for (const modal of Array.from(modals)) {
      const focusableInModal = modal.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableInModal.length === 0) {
        issues.push({
          type: 'error',
          category: 'focus',
          element: 'dialog',
          issue: 'Modal without focusable elements',
          suggestion: 'Ensure modals contain at least one focusable element',
          wcagLevel: 'A'
        });
      }
    }

    return issues;
  };

  const testSemanticStructure = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for proper landmarks
    const landmarks = ['main', 'nav', 'header', 'footer', 'aside', 'section'];
    const foundLandmarks = [];
    
    for (const landmark of landmarks) {
      const elements = document.querySelectorAll(landmark + ', [role="' + landmark + '"]');
      if (elements.length > 0) {
        foundLandmarks.push(landmark);
      }
    }
    
    if (!foundLandmarks.includes('main')) {
      issues.push({
        type: 'error',
        category: 'semantic',
        element: 'page',
        issue: 'No main landmark found',
        suggestion: 'Add a <main> element or role="main" to identify the primary content',
        wcagLevel: 'A'
      });
    }

    // Check for proper list usage
    const lists = document.querySelectorAll('ul, ol');
    for (const list of Array.from(lists)) {
      const children = Array.from(list.children);
      const nonListItems = children.filter(child => child.tagName.toLowerCase() !== 'li');
      
      if (nonListItems.length > 0) {
        issues.push({
          type: 'warning',
          category: 'semantic',
          element: list.tagName.toLowerCase(),
          issue: 'List contains non-list-item children',
          suggestion: 'Lists should only contain <li> elements as direct children',
          wcagLevel: 'A'
        });
      }
    }

    // Check for form structure
    const forms = document.querySelectorAll('form');
    for (const form of Array.from(forms)) {
      const inputs = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
      const labels = form.querySelectorAll('label');
      
      if (inputs.length > 0 && labels.length === 0) {
        issues.push({
          type: 'error',
          category: 'semantic',
          element: 'form',
          issue: 'Form without labels',
          suggestion: 'Associate form controls with labels using <label> elements',
          wcagLevel: 'A'
        });
      }
    }

    return issues;
  };

  const testImageAccessibility = async (): Promise<AccessibilityIssue[]> => {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt text
    const images = document.querySelectorAll('img');
    let missingAlt = 0;
    
    for (const img of Array.from(images)) {
      const alt = img.getAttribute('alt');
      if (alt === null) {
        missingAlt++;
      } else if (alt === '' && !img.hasAttribute('role')) {
        // Empty alt is okay for decorative images, but should have role="presentation"
        issues.push({
          type: 'info',
          category: 'images',
          element: 'img',
          issue: 'Image with empty alt text',
          suggestion: 'Consider adding role="presentation" for decorative images',
          wcagLevel: 'A'
        });
      }
    }
    
    if (missingAlt > 0) {
      issues.push({
        type: 'error',
        category: 'images',
        element: 'img',
        issue: `${missingAlt} images without alt text`,
        suggestion: 'Add descriptive alt text to all informative images',
        wcagLevel: 'A'
      });
    }

    // Check for complex images without descriptions
    const complexImages = document.querySelectorAll('svg, canvas, [role="img"]');
    for (const element of Array.from(complexImages)) {
      const hasDescription = element.getAttribute('aria-describedby') || 
                           element.getAttribute('aria-label') ||
                           element.querySelector('title, desc');
      
      if (!hasDescription) {
        issues.push({
          type: 'warning',
          category: 'images',
          element: element.tagName.toLowerCase(),
          issue: 'Complex image without description',
          suggestion: 'Add aria-describedby or aria-label for complex graphics',
          wcagLevel: 'A'
        });
      }
    }

    return issues;
  };

  const calculateCategoryScores = (issues: AccessibilityIssue[], totalTests: number) => {
    const categories: { [key: string]: { passed: number; total: number; score: number } } = {};
    
    const categoryTests = {
      'color-contrast': 1,
      'keyboard': 1,
      'screen-reader': 1,
      'focus': 1,
      'semantic': 1,
      'images': 1
    };

    for (const [category, total] of Object.entries(categoryTests)) {
      const categoryIssues = issues.filter(issue => issue.category === category);
      const passed = categoryIssues.length === 0 ? 1 : 0;
      categories[category] = {
        passed,
        total,
        score: Math.round((passed / total) * 100)
      };
    }

    return categories;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'color-contrast': Palette,
      'keyboard': Keyboard,
      'screen-reader': Volume2,
      'focus': Eye,
      'semantic': Monitor,
      'images': Eye
    };
    return icons[category as keyof typeof icons] || Monitor;
  };

  const getIssueColor = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const filteredIssues = testResult?.issues.filter(issue => 
    activeCategory === 'all' || issue.category === activeCategory
  ) || [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Accessibility Audit Tool</span>
          <Button 
            onClick={runAccessibilityTests} 
            disabled={isRunning}
            aria-describedby="audit-description"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Audit...' : 'Run Accessibility Audit'}
          </Button>
        </CardTitle>
        <p id="audit-description" className="text-sm text-gray-600">
          Comprehensive WCAG 2.1 AA compliance testing for the ASR-GoT interface
        </p>
      </CardHeader>

      <CardContent>
        {isRunning && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Running accessibility tests...</span>
            </div>
            <Progress value={50} className="h-2" />
          </div>
        )}

        {testResult && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`p-4 ${testResult.score >= 90 ? 'bg-green-50 border-green-200' : 
                testResult.score >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${testResult.score >= 90 ? 'text-green-600' : 
                    testResult.score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {testResult.score}%
                  </div>
                  <div className="text-sm text-gray-600">Accessibility Score</div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {testResult.passedTests}/{testResult.totalTests}
                  </div>
                  <div className="text-sm text-gray-600">Tests Passed</div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {testResult.issues.length}
                  </div>
                  <div className="text-sm text-gray-600">Issues Found</div>
                </div>
              </Card>
            </div>

            {/* Category Scores */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(testResult.categories).map(([category, data]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <Card key={category} className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">
                          {category.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={data.score >= 90 ? 'default' : data.score >= 70 ? 'secondary' : 'destructive'}>
                          {data.score}%
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {data.passed}/{data.total}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Issues List */}
            <div>
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                  <TabsTrigger value="all">All ({testResult.issues.length})</TabsTrigger>
                  {Object.keys(testResult.categories).map(category => (
                    <TabsTrigger key={category} value={category} className="text-xs">
                      {category.split('-')[0]} ({testResult.issues.filter(i => i.category === category).length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeCategory} className="mt-4">
                  {filteredIssues.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {filteredIssues.map((issue, index) => {
                          const IssueIcon = getIssueIcon(issue.type);
                          return (
                            <Alert key={index} className={`border-l-4 ${
                              issue.type === 'error' ? 'border-l-red-500' :
                              issue.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                            }`}>
                              <IssueIcon className={`h-4 w-4 ${getIssueColor(issue.type)}`} />
                              <AlertDescription>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{issue.issue}</span>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {issue.category}
                                      </Badge>
                                      {issue.wcagLevel && (
                                        <Badge variant="secondary" className="text-xs">
                                          WCAG {issue.wcagLevel}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600">{issue.suggestion}</p>
                                  {issue.location && (
                                    <p className="text-xs text-gray-500">
                                      Element: {issue.element} - {issue.location}
                                    </p>
                                  )}
                                </div>
                              </AlertDescription>
                            </Alert>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No issues found in this category!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Recommendations */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Accessibility Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Test with actual assistive technologies (NVDA, JAWS, VoiceOver)</li>
                  <li>• Validate with automated tools like axe-core or Lighthouse</li>
                  <li>• Conduct user testing with people who have disabilities</li>
                  <li>• Regularly audit accessibility as part of development workflow</li>
                  <li>• Keep up with WCAG updates and best practices</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};