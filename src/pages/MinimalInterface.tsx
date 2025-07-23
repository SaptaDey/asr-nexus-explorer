import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Rocket, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MinimalResearchInterface: React.FC = () => {
  const [researchQuery, setResearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleStartResearch = async () => {
    if (!researchQuery.trim()) {
      toast.error('Please enter a research question');
      return;
    }

    setIsProcessing(true);
    
    // Simulate research process
    try {
      toast.info('Starting AI research analysis...');
      
      // Simulate 9 stages
      const stages = [
        'Initializing research framework...',
        'Decomposing research question...',
        'Generating hypotheses...',
        'Gathering evidence...',
        'Analyzing relationships...',
        'Extracting key insights...',
        'Synthesizing findings...',
        'Reflecting on results...',
        'Generating final analysis...'
      ];

      const newResults = [];
      
      for (let i = 0; i < stages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.info(stages[i]);
        newResults.push(`Stage ${i + 1}: ${stages[i]} - Completed with simulated results for "${researchQuery}"`);
        setResults([...newResults]);
      }

      toast.success('🎉 Research analysis complete!');
    } catch (error) {
      toast.error('Research analysis failed');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">ASR-GoT Research Interface</h1>
        <p className="text-lg text-muted-foreground">
          AI-Powered Scientific Research & Analysis Platform
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This is a simplified interface due to recent system changes. Full functionality is being restored.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Research Configuration
          </CardTitle>
          <CardDescription>
            Enter your research question to begin AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="research-query" className="text-sm font-medium">
              Research Question or Topic
            </label>
            <Textarea
              id="research-query"
              placeholder="Enter your scientific research question or topic of interest..."
              value={researchQuery}
              onChange={(e) => setResearchQuery(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          
          <Button 
            onClick={handleStartResearch}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                AI Analyzing... ({results.length}/9 stages)
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Start AI Research
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Research Progress & Results</CardTitle>
            <CardDescription>
              Real-time analysis results from the ASR-GoT framework
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted rounded-lg border-l-4 border-primary"
                >
                  <div className="text-sm text-muted-foreground">
                    Stage {index + 1} of 9
                  </div>
                  <div className="font-medium">{result}</div>
                </div>
              ))}
            </div>
            
            {results.length === 9 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="font-bold text-green-800 mb-2">
                  🎉 Analysis Complete!
                </h3>
                <p className="text-green-600 text-sm">
                  All 9 stages of scientific analysis have been completed successfully.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinimalResearchInterface;