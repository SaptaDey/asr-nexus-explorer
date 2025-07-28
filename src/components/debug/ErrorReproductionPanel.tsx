import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Play, 
  RefreshCw, 
  Bug, 
  AlertTriangle, 
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  FileText,
  Zap
} from 'lucide-react';
import { 
  errorReproducer,
  type ErrorReport,
  type ReproductionScript,
  type ReproductionStep
} from '@/utils/debugging/ErrorReproducer';
import { toast } from 'sonner';

interface ErrorReproductionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorReproductionPanel: React.FC<ErrorReproductionPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  const [reproductionScript, setReproductionScript] = useState<ReproductionScript | null>(null);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('errors');

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    const currentStats = errorReproducer.getReproductionStats();
    setStats(currentStats);
    setErrors(currentStats.recent);
  };

  const handleErrorSelect = (error: ErrorReport) => {
    setSelectedError(error);
    const script = errorReproducer.generateReproductionScript(error.id);
    setReproductionScript(script);
    setExecutionResults(null);
  };

  const handleExecuteScript = async () => {
    if (!reproductionScript) return;

    setIsExecuting(true);
    try {
      const results = await errorReproducer.executeReproductionScript(reproductionScript);
      setExecutionResults(results);
      
      if (results.success) {
        toast.success('Reproduction script executed successfully');
      } else {
        toast.error(`Script execution failed: ${results.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error('Failed to execute reproduction script');
      console.error('Script execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportErrors = (format: 'json' | 'csv' | 'yaml') => {
    try {
      const data = errorReproducer.exportErrorData(format);
      const blob = new Blob([data], { type: getContentType(format) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Errors exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export errors');
      console.error('Export error:', error);
    }
  };

  const handleGenerateTest = (framework: 'playwright' | 'cypress' | 'jest') => {
    if (!selectedError) return;

    try {
      const testCode = errorReproducer.generateAutomatedTest(selectedError.id, framework);
      const blob = new Blob([testCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-test.${framework === 'jest' ? 'test.js' : 'spec.js'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${framework} test generated`);
    } catch (error) {
      toast.error('Failed to generate test');
      console.error('Test generation error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ui': return <Zap className="h-4 w-4" />;
      case 'api': return <RefreshCw className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      case 'data': return <FileText className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const getContentType = (format: string) => {
    switch (format) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'yaml': return 'text/yaml';
      default: return 'text/plain';
    }
  };

  const renderStepIcon = (step: ReproductionStep) => {
    switch (step.type) {
      case 'navigate': return '🔗';
      case 'click': return '👆';
      case 'input': return '⌨️';
      case 'wait': return '⏱️';
      case 'verify': return '✅';
      case 'execute': return '⚡';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Error Reproduction Panel
            </CardTitle>
            <CardDescription>
              Analyze, reproduce, and debug application errors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Errors</p>
                      <p className="text-2xl font-bold">{stats.totalErrors}</p>
                    </div>
                    <Bug className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Reproducible</p>
                      <p className="text-2xl font-bold">{stats.reproducible}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold">{stats.bySeverity.critical || 0}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {stats.totalErrors > 0 
                          ? Math.round((stats.reproducible / stats.totalErrors) * 100)
                          : 0}%
                      </p>
                    </div>
                    <Info className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors">Recent Errors</TabsTrigger>
              <TabsTrigger value="reproduction">Reproduction</TabsTrigger>
              <TabsTrigger value="testing">Test Generation</TabsTrigger>
              <TabsTrigger value="export">Export & Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Error List</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {errors.map((error) => (
                        <Card 
                          key={error.id} 
                          className={`cursor-pointer transition-colors ${
                            selectedError?.id === error.id ? 'bg-muted' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleErrorSelect(error)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(error.metadata.category)}
                                <span className="font-medium">{error.error.name}</span>
                              </div>
                              <Badge variant={getSeverityColor(error.metadata.severity) as any}>
                                {error.metadata.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {error.error.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{new Date(error.timestamp).toLocaleString()}</span>
                              <div className="flex items-center gap-2">
                                {error.metadata.reproducible && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Reproducible
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {error.metadata.category}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Error Details</h3>
                  {selectedError ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Error Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">Name:</span> {selectedError.error.name}
                              </div>
                              <div>
                                <span className="font-medium">Message:</span> {selectedError.error.message}
                              </div>
                              <div>
                                <span className="font-medium">URL:</span> {selectedError.context.url}
                              </div>
                              <div>
                                <span className="font-medium">Session:</span> {selectedError.context.sessionId}
                              </div>
                              {selectedError.context.stage && (
                                <div>
                                  <span className="font-medium">Stage:</span> {selectedError.context.stage}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Environment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">Browser:</span> {selectedError.reproduction.environment.browser}
                              </div>
                              <div>
                                <span className="font-medium">OS:</span> {selectedError.reproduction.environment.os}
                              </div>
                              <div>
                                <span className="font-medium">Viewport:</span> {selectedError.reproduction.environment.viewport.width}x{selectedError.reproduction.environment.viewport.height}
                              </div>
                              <div>
                                <span className="font-medium">Device:</span> {selectedError.reproduction.environment.deviceType}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {selectedError.error.stack && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Stack Trace</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {selectedError.error.stack}
                              </pre>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Select an error to view details
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reproduction" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Reproduction Script</h3>
                    {reproductionScript && (
                      <Button 
                        onClick={handleExecuteScript}
                        disabled={isExecuting}
                        size="sm"
                      >
                        {isExecuting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {isExecuting ? 'Executing...' : 'Execute'}
                      </Button>
                    )}
                  </div>

                  {reproductionScript ? (
                    <ScrollArea className="h-[400px]">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{reproductionScript.title}</CardTitle>
                          <CardDescription>{reproductionScript.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Prerequisites:</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {reproductionScript.prerequisites.map((prereq, index) => (
                                  <li key={index}>{prereq}</li>
                                ))}
                              </ul>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium mb-2">Steps:</h4>
                              <div className="space-y-2">
                                {reproductionScript.steps.map((step, index) => (
                                  <div key={index} className="flex items-start gap-3 text-sm">
                                    <span className="text-lg">{renderStepIcon(step)}</span>
                                    <div className="flex-1">
                                      <div className="font-medium">{step.type}</div>
                                      <div className="text-muted-foreground">{step.description}</div>
                                      {step.selector && (
                                        <code className="text-xs bg-muted px-1 rounded">{step.selector}</code>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium mb-2">Expected Results:</h4>
                              <div className="space-y-2">
                                {reproductionScript.assertions.map((assertion, index) => (
                                  <div key={index} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                                    <span>{assertion.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Select an error to generate reproduction script
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Execution Results</h3>
                  {executionResults ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Execution Summary</CardTitle>
                              <Badge variant={executionResults.success ? 'default' : 'destructive'}>
                                {executionResults.success ? 'Success' : 'Failed'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {executionResults.success ? (
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>
                                  Reproduction script executed successfully with all steps completed.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Execution Failed</AlertTitle>
                                <AlertDescription>
                                  {executionResults.errors.join(', ')}
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Step Results</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {executionResults.results.map((result: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="flex-1">
                                    {result.step || result.assertion}
                                  </span>
                                  {result.error && (
                                    <span className="text-red-500 text-xs">{result.error}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  ) : isExecuting ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                      <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                      <p className="text-muted-foreground">Executing reproduction script...</p>
                      <Progress className="w-64 mt-4" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Execute a reproduction script to see results
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Generate Automated Tests</h3>
                  <p className="text-muted-foreground mb-4">
                    Convert error reproduction scripts into automated tests for different testing frameworks.
                  </p>
                </div>

                {selectedError ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Playwright
                        </CardTitle>
                        <CardDescription>
                          Generate E2E test for Playwright framework
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => handleGenerateTest('playwright')}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Playwright Test
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Cypress
                        </CardTitle>
                        <CardDescription>
                          Generate E2E test for Cypress framework
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => handleGenerateTest('cypress')}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Cypress Test
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Jest
                        </CardTitle>
                        <CardDescription>
                          Generate unit test for Jest framework
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => handleGenerateTest('jest')}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate Jest Test
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Error Selected</AlertTitle>
                    <AlertDescription>
                      Please select an error from the errors tab to generate automated tests.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="export" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Export Error Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Export error data in various formats for analysis and reporting.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">JSON Export</CardTitle>
                      <CardDescription>
                        Complete error data with full context
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExportErrors('json')}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">CSV Export</CardTitle>
                      <CardDescription>
                        Tabular data for spreadsheet analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExportErrors('csv')}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">YAML Export</CardTitle>
                      <CardDescription>
                        Human-readable configuration format
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handleExportErrors('yaml')}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export YAML
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Error Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">By Category</h4>
                          <div className="space-y-2">
                            {Object.entries(stats.byCategory).map(([category, count]) => (
                              <div key={category} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getCategoryIcon(category)}
                                  <span className="capitalize">{category}</span>
                                </div>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">By Severity</h4>
                          <div className="space-y-2">
                            {Object.entries(stats.bySeverity).map(([severity, count]) => (
                              <div key={severity} className="flex items-center justify-between">
                                <span className="capitalize">{severity}</span>
                                <Badge variant={getSeverityColor(severity) as any}>{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};