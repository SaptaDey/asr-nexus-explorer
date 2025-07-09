/**
 * React Hooks for Data Export/Import
 * Provides comprehensive data portability functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DataExportImportService, 
  ExportOptions, 
  ImportOptions, 
  ExportResult, 
  ImportResult,
  ExportTemplate,
  DataValidationResult
} from '@/services/data/DataExportImportService';

interface UseDataExportParams {
  sessionId: string;
}

interface UseDataExportReturn {
  // State
  isExporting: boolean;
  exportProgress: number;
  exportResult: ExportResult | null;
  exportError: string | null;
  exportHistory: any[];
  templates: ExportTemplate[];
  
  // Actions
  exportData: (options: ExportOptions) => Promise<ExportResult>;
  downloadExport: (result: ExportResult) => void;
  saveTemplate: (name: string, description: string, options: ExportOptions, isPublic?: boolean) => Promise<void>;
  loadTemplate: (templateId: string) => Promise<ExportOptions | null>;
  deleteTemplate: (templateId: string) => Promise<void>;
  getExportHistory: () => Promise<void>;
  
  // Utilities
  clearExportError: () => void;
  validateExportOptions: (options: ExportOptions) => Promise<DataValidationResult>;
}

export function useDataExport({ sessionId }: UseDataExportParams): UseDataExportReturn {
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);

  // Service reference
  const exportService = useRef(new DataExportImportService());

  /**
   * Export data with progress tracking
   */
  const exportData = useCallback(async (options: ExportOptions): Promise<ExportResult> => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setExportResult(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await exportService.current.exportSession(sessionId, options);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportResult(result);

      if (!result.success) {
        setExportError(result.error || 'Export failed');
      }

      return result;
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [sessionId]);

  /**
   * Download export result
   */
  const downloadExport = useCallback((result: ExportResult) => {
    if (!result.data) return;

    const blob = new Blob([result.data], { 
      type: result.format === 'json' ? 'application/json' : 
            result.format === 'csv' ? 'text/csv' :
            result.format === 'xml' ? 'application/xml' :
            'application/octet-stream'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Save export template
   */
  const saveTemplate = useCallback(async (
    name: string, 
    description: string, 
    options: ExportOptions, 
    isPublic: boolean = false
  ) => {
    try {
      const template = await exportService.current.saveExportTemplate(
        name, 
        description, 
        options, 
        isPublic
      );
      
      setTemplates(prev => [template, ...prev]);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to save template');
    }
  }, []);

  /**
   * Load export template
   */
  const loadTemplate = useCallback(async (templateId: string): Promise<ExportOptions | null> => {
    try {
      const template = templates.find(t => t.id === templateId);
      return template?.options || null;
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to load template');
      return null;
    }
  }, [templates]);

  /**
   * Delete export template
   */
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      // Implementation would call service to delete template
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  }, []);

  /**
   * Get export history
   */
  const getExportHistory = useCallback(async () => {
    try {
      const history = await exportService.current.getExportHistory(sessionId);
      setExportHistory(history);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to load export history');
    }
  }, [sessionId]);

  /**
   * Validate export options
   */
  const validateExportOptions = useCallback(async (options: ExportOptions): Promise<DataValidationResult> => {
    // Basic validation
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!options.format) {
      result.errors.push({
        type: 'missing_field',
        message: 'Export format is required',
        field: 'format'
      });
    }

    if (!options.includeGraphData && !options.includeStageResults && !options.includeHypotheses) {
      result.warnings.push({
        type: 'data_quality',
        message: 'No data types selected for export'
      });
    }

    if (options.format === 'csv' && options.includeGraphData) {
      result.warnings.push({
        type: 'performance_concern',
        message: 'CSV format may not preserve graph structure well'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }, []);

  /**
   * Clear export error
   */
  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  /**
   * Load templates and history on mount
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData] = await Promise.all([
          exportService.current.getExportTemplates(),
          getExportHistory()
        ]);
        setTemplates(templatesData);
      } catch (error) {
        console.error('Failed to load export data:', error);
      }
    };

    loadData();
  }, [getExportHistory]);

  return {
    // State
    isExporting,
    exportProgress,
    exportResult,
    exportError,
    exportHistory,
    templates,

    // Actions
    exportData,
    downloadExport,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    getExportHistory,

    // Utilities
    clearExportError,
    validateExportOptions
  };
}

interface UseDataImportParams {
  sessionId: string;
}

interface UseDataImportReturn {
  // State
  isImporting: boolean;
  importProgress: number;
  importResult: ImportResult | null;
  importError: string | null;
  importHistory: any[];
  
  // Actions
  importData: (data: string | ArrayBuffer, options: ImportOptions) => Promise<ImportResult>;
  validateImportData: (data: string | ArrayBuffer, format: string) => Promise<DataValidationResult>;
  previewImport: (data: string | ArrayBuffer, format: string) => Promise<any>;
  rollbackImport: (importId: string) => Promise<void>;
  getImportHistory: () => Promise<void>;
  
  // Utilities
  clearImportError: () => void;
  validateImportOptions: (options: ImportOptions) => Promise<DataValidationResult>;
}

export function useDataImport({ sessionId }: UseDataImportParams): UseDataImportReturn {
  // State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  // Service reference
  const importService = useRef(new DataExportImportService());

  /**
   * Import data with progress tracking
   */
  const importData = useCallback(async (
    data: string | ArrayBuffer, 
    options: ImportOptions
  ): Promise<ImportResult> => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportError(null);
      setImportResult(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await importService.current.importSession(sessionId, data, options);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);

      if (!result.success) {
        setImportError(result.errors.map(e => e.message).join(', '));
      }

      return result;
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, [sessionId]);

  /**
   * Validate import data
   */
  const validateImportData = useCallback(async (
    data: string | ArrayBuffer, 
    format: string
  ): Promise<DataValidationResult> => {
    try {
      // Basic validation based on format
      const result: DataValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      if (format === 'json') {
        try {
          const jsonString = typeof data === 'string' ? data : new TextDecoder().decode(data);
          JSON.parse(jsonString);
        } catch (error) {
          result.errors.push({
            type: 'invalid_format',
            message: 'Invalid JSON format',
            field: 'data'
          });
        }
      }

      result.isValid = result.errors.length === 0;
      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'invalid_format',
          message: 'Data validation failed'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }, []);

  /**
   * Preview import data
   */
  const previewImport = useCallback(async (
    data: string | ArrayBuffer, 
    format: string
  ): Promise<any> => {
    try {
      // Parse and return preview of data structure
      if (format === 'json') {
        const jsonString = typeof data === 'string' ? data : new TextDecoder().decode(data);
        const parsedData = JSON.parse(jsonString);
        
        // Return summary of what would be imported
        return {
          summary: {
            hasSession: !!parsedData.session,
            hasGraphData: !!parsedData.graphData,
            nodeCount: parsedData.graphData?.nodes?.length || 0,
            edgeCount: parsedData.graphData?.edges?.length || 0,
            hasStageResults: !!parsedData.stageExecutions,
            stageCount: parsedData.stageExecutions?.length || 0,
            hasHypotheses: !!parsedData.hypotheses,
            hypothesisCount: parsedData.hypotheses?.length || 0
          },
          data: parsedData
        };
      }

      return { summary: {}, data: {} };
    } catch (error) {
      throw new Error('Failed to preview import data');
    }
  }, []);

  /**
   * Rollback import
   */
  const rollbackImport = useCallback(async (importId: string) => {
    try {
      // Implementation would restore from backup
      setImportError(null);
      // Call service to restore from backup
      console.log('Rolling back import:', importId);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Rollback failed');
    }
  }, []);

  /**
   * Get import history
   */
  const getImportHistory = useCallback(async () => {
    try {
      // Implementation would load import history from service
      setImportHistory([]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to load import history');
    }
  }, []);

  /**
   * Validate import options
   */
  const validateImportOptions = useCallback(async (options: ImportOptions): Promise<DataValidationResult> => {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!options.format) {
      result.errors.push({
        type: 'missing_field',
        message: 'Import format is required',
        field: 'format'
      });
    }

    if (!options.mergeStrategy) {
      result.errors.push({
        type: 'missing_field',
        message: 'Merge strategy is required',
        field: 'mergeStrategy'
      });
    }

    if (options.mergeStrategy === 'replace') {
      result.warnings.push({
        type: 'data_quality',
        message: 'Replace strategy will overwrite existing data'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }, []);

  /**
   * Clear import error
   */
  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  /**
   * Load history on mount
   */
  useEffect(() => {
    getImportHistory();
  }, [getImportHistory]);

  return {
    // State
    isImporting,
    importProgress,
    importResult,
    importError,
    importHistory,

    // Actions
    importData,
    validateImportData,
    previewImport,
    rollbackImport,
    getImportHistory,

    // Utilities
    clearImportError,
    validateImportOptions
  };
}

/**
 * Combined hook for both export and import
 */
export function useDataPortability(sessionId: string) {
  const exportHook = useDataExport({ sessionId });
  const importHook = useDataImport({ sessionId });

  return {
    export: exportHook,
    import: importHook,
    
    // Combined utilities
    isProcessing: exportHook.isExporting || importHook.isImporting,
    hasError: !!exportHook.exportError || !!importHook.importError,
    clearAllErrors: () => {
      exportHook.clearExportError();
      importHook.clearImportError();
    }
  };
}

/**
 * Hook for managing export/import templates
 */
export function useDataTemplates() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useRef(new DataExportImportService());

  /**
   * Load templates
   */
  const loadTemplates = useCallback(async (includePublic: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const templatesData = await service.current.getExportTemplates(includePublic);
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create template
   */
  const createTemplate = useCallback(async (
    name: string,
    description: string,
    options: ExportOptions,
    isPublic: boolean = false
  ) => {
    try {
      setError(null);
      
      const template = await service.current.saveExportTemplate(
        name, 
        description, 
        options, 
        isPublic
      );
      
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    }
  }, []);

  /**
   * Update template usage count
   */
  const useTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, usageCount: template.usageCount + 1 }
        : template
    ));
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    useTemplate,
    clearError: () => setError(null)
  };
}