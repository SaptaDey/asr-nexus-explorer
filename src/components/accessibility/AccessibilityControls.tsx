import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Accessibility, 
  Eye, 
  EyeOff,
  Keyboard, 
  Volume2, 
  VolumeX,
  Settings, 
  Contrast, 
  Type, 
  MousePointer,
  Focus,
  Glasses,
  Headphones,
  MonitorSpeaker,
  Zap,
  RotateCcw,
  TestTube
} from 'lucide-react';
import { useAccessibilityContext } from './AccessibilityProvider';

interface AccessibilityControlsProps {
  className?: string;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({ className = '' }) => {
  const { preferences, updatePreferences, isScreenReader, announceLiveRegion } = useAccessibilityContext();
  const [isOpen, setIsOpen] = useState(false);

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    updatePreferences({ [key]: value });
    
    // Announce changes to screen readers
    const messages: Record<string, string> = {
      highContrast: `High contrast mode ${value ? 'enabled' : 'disabled'}`,
      reducedMotion: `Reduced motion ${value ? 'enabled' : 'disabled'}`,
      screenReaderMode: `Screen reader mode ${value ? 'enabled' : 'disabled'}`,
      fontSize: `Font size changed to ${value}`,
      focusVisible: `Focus indicators ${value ? 'enabled' : 'disabled'}`,
      keyboardNavigation: `Keyboard navigation ${value ? 'enabled' : 'disabled'}`,
    };
    
    if (messages[key]) {
      announceLiveRegion(messages[key]);
    }
  };

  const runAccessibilityTest = async () => {
    announceLiveRegion('Running accessibility test...', 'assertive');
    
    // Basic accessibility audit
    const issues: string[] = [];
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }
    
    // Check for buttons without accessible names
    const unlabeledButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      !btn.getAttribute('aria-label') && 
      !btn.getAttribute('aria-labelledby') && 
      !btn.textContent?.trim()
    );
    if (unlabeledButtons.length > 0) {
      issues.push(`${unlabeledButtons.length} buttons without accessible names`);
    }
    
    // Check for form inputs without labels
    const unlabeledInputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(input => {
      const id = input.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel;
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs without labels`);
    }
    
    // Check for headings hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
    let hasSkippedLevel = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        hasSkippedLevel = true;
        break;
      }
    }
    if (hasSkippedLevel) {
      issues.push('Heading hierarchy has skipped levels');
    }
    
    // Report results
    setTimeout(() => {
      if (issues.length === 0) {
        announceLiveRegion('Accessibility test completed. No issues found!', 'assertive');
      } else {
        announceLiveRegion(
          `Accessibility test completed. Found ${issues.length} issues: ${issues.join(', ')}`,
          'assertive'
        );
      }
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`${className} relative bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 min-w-0 px-2`}
          aria-label="Open accessibility settings"
          title="Accessibility Settings"
        >
          <Accessibility className="h-4 w-4" />
          {isScreenReader && (
            <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700 border-green-200 min-w-0 px-1">
              <Headphones className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="accessibility-settings-title"
        aria-describedby="accessibility-settings-description"
      >
        <DialogHeader>
          <DialogTitle id="accessibility-settings-title" className="flex items-center">
            <Accessibility className="h-5 w-5 mr-2" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription id="accessibility-settings-description">
            Customize your accessibility preferences for the ASR-GoT research interface.
            Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Screen Reader Detection */}
          {isScreenReader && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 flex items-center text-lg">
                  <MonitorSpeaker className="h-5 w-5 mr-2" />
                  Screen Reader Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 text-sm">
                  We've detected you're using a screen reader. Enhanced accessibility features are automatically enabled.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Visual Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Glasses className="h-5 w-5 mr-2" />
                Visual Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="flex items-center space-x-2">
                  <Contrast className="h-4 w-4" />
                  <span>High Contrast Mode</span>
                </Label>
                <Switch
                  id="high-contrast"
                  checked={preferences.highContrast}
                  onCheckedChange={(checked) => handlePreferenceChange('highContrast', checked)}
                  aria-describedby="high-contrast-desc"
                />
              </div>
              <p id="high-contrast-desc" className="text-sm text-gray-600">
                Increases contrast between text and background for better readability
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Reduced Motion</span>
                </Label>
                <Switch
                  id="reduced-motion"
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) => handlePreferenceChange('reducedMotion', checked)}
                  aria-describedby="reduced-motion-desc"
                />
              </div>
              <p id="reduced-motion-desc" className="text-sm text-gray-600">
                Reduces animations and transitions throughout the interface
              </p>

              <div className="space-y-2">
                <Label htmlFor="font-size" className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span>Font Size</span>
                </Label>
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value: any) => handlePreferenceChange('fontSize', value)}
                >
                  <SelectTrigger id="font-size" aria-describedby="font-size-desc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
                <p id="font-size-desc" className="text-sm text-gray-600">
                  Adjust text size throughout the interface
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Keyboard className="h-4 w-4 mr-2" />
                Navigation Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="focus-visible" className="flex items-center space-x-2">
                  <Focus className="h-4 w-4" />
                  <span>Enhanced Focus Indicators</span>
                </Label>
                <Switch
                  id="focus-visible"
                  checked={preferences.focusVisible}
                  onCheckedChange={(checked) => handlePreferenceChange('focusVisible', checked)}
                  aria-describedby="focus-visible-desc"
                />
              </div>
              <p id="focus-visible-desc" className="text-sm text-gray-600">
                Shows enhanced visual indicators when navigating with keyboard
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="keyboard-nav" className="flex items-center space-x-2">
                  <Keyboard className="h-4 w-4" />
                  <span>Keyboard Navigation</span>
                </Label>
                <Switch
                  id="keyboard-nav"
                  checked={preferences.keyboardNavigation}
                  onCheckedChange={(checked) => handlePreferenceChange('keyboardNavigation', checked)}
                  aria-describedby="keyboard-nav-desc"
                />
              </div>
              <p id="keyboard-nav-desc" className="text-sm text-gray-600">
                Enables full keyboard navigation with enhanced shortcuts
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="screen-reader-mode" className="flex items-center space-x-2">
                  <Headphones className="h-4 w-4" />
                  <span>Screen Reader Mode</span>
                </Label>
                <Switch
                  id="screen-reader-mode"
                  checked={preferences.screenReaderMode}
                  onCheckedChange={(checked) => handlePreferenceChange('screenReaderMode', checked)}
                  aria-describedby="screen-reader-mode-desc"
                />
              </div>
              <p id="screen-reader-mode-desc" className="text-sm text-gray-600">
                Optimizes interface for screen reader usage with enhanced announcements
              </p>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Navigation</h4>
                  <ul className="space-y-1">
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> Next element</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift+Tab</kbd> Previous element</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> Activate button</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> Toggle switch</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Interface</h4>
                  <ul className="space-y-1">
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Alt+H</kbd> Show help</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Alt+C</kbd> Toggle contrast</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Alt+1-9</kbd> Jump to stage</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">F1</kbd> Context help</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-4 w-4 mr-2" />
                Accessibility Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runAccessibilityTest}
                className="w-full"
                aria-describedby="test-desc"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Run Accessibility Test
              </Button>
              <p id="test-desc" className="text-sm text-gray-600 mt-2">
                Performs a basic accessibility audit of the current page and announces results
              </p>
            </CardContent>
          </Card>

          {/* Reset Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  updatePreferences({
                    highContrast: false,
                    reducedMotion: false,
                    screenReaderMode: isScreenReader,
                    fontSize: 'medium',
                    focusVisible: true,
                    keyboardNavigation: true,
                  });
                  announceLiveRegion('Accessibility settings reset to defaults');
                }}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};