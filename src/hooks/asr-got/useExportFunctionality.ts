// Export Functionality
import { useCallback } from 'react';
import { toast } from "sonner";
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import {
  exportResultsAsHTML,
  exportResultsAsJSON,
  exportGraphAsSVG
} from '@/utils/asrGotUtils';

interface UseExportFunctionalityProps {
  stageResults: string[];
  graphData: GraphData;
  researchContext: ResearchContext;
  finalReport: string;
  parameters: ASRGoTParameters;
  currentSessionId?: string | null;
}

export const useExportFunctionality = ({
  stageResults,
  graphData,
  researchContext,
  finalReport,
  parameters,
  currentSessionId
}: UseExportFunctionalityProps) => {
  
  const exportResults = useCallback(async (format?: 'html' | 'json' | 'svg') => {
    const exportFormat = format || 'json';
    if (stageResults.length === 0 && exportFormat !== 'svg') {
      toast.warning('No results to export yet');
      return;
    }

    try {
      switch (exportFormat) {
        case 'html':
          await exportResultsAsHTML(stageResults, graphData, researchContext, finalReport, parameters, currentSessionId || undefined);
          toast.success('Comprehensive HTML report exported successfully');
          break;
        case 'svg':
          exportGraphAsSVG(graphData);
          toast.success('Graph exported as SVG successfully');
          break;
        case 'json':
        default:
          exportResultsAsJSON(stageResults, graphData, researchContext, finalReport, parameters);
          toast.success('JSON analysis exported successfully');
          break;
      }
    } catch (error) {
      toast.error(`Export failed: ${error}`);
    }
  }, [stageResults, graphData, researchContext, finalReport, parameters]);

  return {
    exportResults
  };
};