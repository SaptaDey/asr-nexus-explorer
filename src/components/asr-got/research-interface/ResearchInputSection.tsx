/**
 * Research Input Section Component
 * Handles the initial research query input and configuration
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Rocket } from 'lucide-react';
import { ResearchHeroIllustration } from '@/components/ui/EngagingIllustrations';

interface ResearchInputSectionProps {
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  onStartResearch: () => Promise<void>;
  isProcessing: boolean;
}

export const ResearchInputSection: React.FC<ResearchInputSectionProps> = ({
  taskDescription,
  setTaskDescription,
  onStartResearch,
  isProcessing,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Illustration Section */}
      <div className="text-center space-y-4">
        <ResearchHeroIllustration className="mx-auto" width={350} height={240} />
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            🧠 AI-Powered Scientific Research
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
            Transform your research questions into comprehensive scientific analysis using our advanced 9-stage AI framework
          </p>
        </div>
      </div>
      
      {/* Research Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="task-description" className="text-lg font-semibold">
            Research Question or Topic
          </Label>
          <Textarea 
            id="task-description" 
            placeholder="Enter your scientific research question or topic of interest. The AI will automatically analyze the field, generate hypotheses, and conduct comprehensive research..." 
            value={taskDescription} 
            onChange={e => setTaskDescription(e.target.value)} 
            rows={4} 
            className="mt-2" 
          />
        </div>
        <Button 
          onClick={onStartResearch} 
          disabled={isProcessing} 
          className="w-full gradient-bg bg-cyan-800 hover:bg-cyan-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI is analyzing and researching...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Start AI-Powered Research
            </>
          )}
        </Button>
      </div>
    </div>
  );
};