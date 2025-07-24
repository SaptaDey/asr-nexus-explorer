/**
 * Completion Celebration Component
 * Shows celebration UI when research is completed
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { CompletionCelebrationIllustration } from '@/components/ui/EngagingIllustrations';

export const CompletionCelebration: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Completion Celebration */}
      <div className="text-center space-y-4">
        <CompletionCelebrationIllustration className="mx-auto" width={280} height={180} />
        <div>
          <h3 className="text-2xl font-bold text-green-700 mb-2">
            🎉 Research Analysis Complete!
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto mb-4">
            All 9 stages of scientific analysis have been completed successfully. Your comprehensive research report is ready!
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Analysis completed • Report generated • Results available for export</span>
          </div>
        </div>
      </div>
    </div>
  );
};