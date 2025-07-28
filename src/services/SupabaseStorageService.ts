/**
 * Comprehensive Supabase Storage Service
 * Preserves all ASR-GoT generated content for future retrieval and re-analysis
 */

import { supabase } from '@/integrations/supabase/client';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';

export interface StoredAnalysis {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  
  // Core Analysis Data
  research_context: ResearchContext;
  parameters: ASRGoTParameters;
  stage_results: string[];
  graph_data: GraphData;
  final_report_html: string;
  
  // Generated Content
  textual_content: {
    abstract: string;
    introduction: string;
    methodology: string;
    results: string;
    discussion: string;
    conclusions: string;
    clinical_implications: string;
    future_directions: string;
  };
  
  // Data and Visualizations
  json_analysis_data: any;
  table_data: any[];
  chart_data: any[];
  visualization_files: string[]; // URLs to stored PNG files
  
  // Metadata
  total_tokens_used: number;
  generation_time_seconds: number;
  model_versions: {
    gemini: string;
    perplexity?: string;
  };
  
  // Quality Metrics
  content_length: number;
  figure_count: number;
  reference_count: number;
  statistical_measures: any[];
}

export interface VisualizationFile {
  id: string;
  analysis_id: string;
  filename: string;
  file_url: string;
  file_type: 'png' | 'svg' | 'pdf';
  description: string;
  figure_number: number;
  created_at: string;
}

export class SupabaseStorageService {
  private bucketName = 'asr-got-analyses';
  private visualizationBucket = 'asr-got-visualizations';

  /**
   * Initialize storage buckets if they don't exist
   */
  async initializeStorage(): Promise<{
    success: boolean;
    mainBucketReady: boolean;
    vizBucketReady: boolean;
    errors: string[];
  }> {
    const results = {
      success: false,
      mainBucketReady: false,
      vizBucketReady: false,
      errors: [] as string[]
    };

    try {
      console.log('🔧 Initializing Supabase storage buckets...');
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        results.errors.push('Storage initialization requires authentication');
        return results;
      }
      
      // Check if buckets exist
      let buckets: any[] = [];
      try {
        const { data: bucketsData, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.warn('⚠️ Could not list buckets:', listError);
          results.errors.push(`Bucket listing failed: ${listError.message}`);
          // Continue with creation attempts anyway
        } else {
          buckets = bucketsData || [];
        }
      } catch (listErr) {
        console.warn('⚠️ Bucket listing exception:', listErr);
        results.errors.push('Failed to list existing buckets');
      }
      
      const mainBucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      const vizBucketExists = buckets.some(bucket => bucket.name === this.visualizationBucket);

      // Create main bucket
      if (!mainBucketExists) {
        try {
          const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
            public: false,
            allowedMimeTypes: ['application/json', 'text/html', 'text/plain'],
            fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
          });
          
          if (createError) {
            // Check if it's just a "bucket already exists" error
            if (createError.message.includes('already exists') || createError.message.includes('Duplicate')) {
              console.log('✅ Main storage bucket already exists (creation returned duplicate error)');
              results.mainBucketReady = true;
            } else {
              throw createError;
            }
          } else {
            console.log('✅ Main storage bucket created successfully');
            results.mainBucketReady = true;
          }
        } catch (bucketError: any) {
          console.error('❌ Main bucket creation failed:', bucketError);
          results.errors.push(`Main bucket creation failed: ${bucketError.message || bucketError}`);
          
          // Try to verify if bucket exists anyway (sometimes creation fails but bucket exists)
          try {
            const { data: testData, error: testError } = await supabase.storage
              .from(this.bucketName)
              .list('', { limit: 1 });
            
            if (!testError) {
              console.log('✅ Main bucket is accessible despite creation error');
              results.mainBucketReady = true;
            }
          } catch (testErr) {
            console.error('❌ Main bucket is not accessible:', testErr);
          }
        }
      } else {
        console.log('✅ Main storage bucket already exists');
        results.mainBucketReady = true;
      }

      // Create visualization bucket
      if (!vizBucketExists) {
        try {
          const { error: createError } = await supabase.storage.createBucket(this.visualizationBucket, {
            public: true, // Visualizations can be public for display
            allowedMimeTypes: ['image/png', 'image/svg+xml', 'application/pdf', 'application/json'],
            fileSizeLimit: 10 * 1024 * 1024 // 10MB per file
          });
          
          if (createError) {
            // Check if it's just a "bucket already exists" error
            if (createError.message.includes('already exists') || createError.message.includes('Duplicate')) {
              console.log('✅ Visualization storage bucket already exists (creation returned duplicate error)');
              results.vizBucketReady = true;
            } else {
              throw createError;
            }
          } else {
            console.log('✅ Visualization storage bucket created successfully');
            results.vizBucketReady = true;
          }
        } catch (bucketError: any) {
          console.error('❌ Visualization bucket creation failed:', bucketError);
          results.errors.push(`Visualization bucket creation failed: ${bucketError.message || bucketError}`);
          
          // Try to verify if bucket exists anyway
          try {
            const { data: testData, error: testError } = await supabase.storage
              .from(this.visualizationBucket)
              .list('', { limit: 1 });
            
            if (!testError) {
              console.log('✅ Visualization bucket is accessible despite creation error');
              results.vizBucketReady = true;
            }
          } catch (testErr) {
            console.error('❌ Visualization bucket is not accessible:', testErr);
          }
        }
      } else {
        console.log('✅ Visualization storage bucket already exists');
        results.vizBucketReady = true;
      }
      
      results.success = results.mainBucketReady && results.vizBucketReady;
      
      if (results.success) {
        console.log('🎉 Supabase storage initialization completed successfully');
      } else {
        console.warn('⚠️ Supabase storage initialization completed with issues:', results.errors);
      }
      
      return results;
      
    } catch (error: any) {
      console.error('❌ Storage initialization failed completely:', error);
      results.errors.push(`Initialization failed: ${error.message || error}`);
      return results;
    }
  }

  /**
   * Test storage bucket accessibility
   */
  async testStorageAccess(): Promise<{
    mainBucketAccessible: boolean;
    vizBucketAccessible: boolean;
    errors: string[];
  }> {
    const results = {
      mainBucketAccessible: false,
      vizBucketAccessible: false,
      errors: [] as string[]
    };

    try {
      // Test main bucket
      try {
        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .list('', { limit: 1 });
        
        if (error) {
          results.errors.push(`Main bucket test failed: ${error.message}`);
        } else {
          results.mainBucketAccessible = true;
        }
      } catch (err: any) {
        results.errors.push(`Main bucket access exception: ${err.message || err}`);
      }

      // Test visualization bucket
      try {
        const { data, error } = await supabase.storage
          .from(this.visualizationBucket)
          .list('', { limit: 1 });
        
        if (error) {
          results.errors.push(`Visualization bucket test failed: ${error.message}`);
        } else {
          results.vizBucketAccessible = true;
        }
      } catch (err: any) {
        results.errors.push(`Visualization bucket access exception: ${err.message || err}`);
      }

    } catch (error: any) {
      results.errors.push(`Storage test failed: ${error.message || error}`);
    }

    return results;
  }

  /**
   * Store complete analysis with all generated content
   */
  async storeCompleteAnalysis(
    sessionId: string,
    title: string,
    analysisData: {
      researchContext: ResearchContext;
      parameters: ASRGoTParameters;
      stageResults: string[];
      graphData: GraphData;
      finalReportHtml: string;
      textualContent: any;
      jsonAnalysisData?: any;
      tableData?: any[];
      chartData?: any[];
      visualizationFiles?: File[];
      metadata: {
        totalTokensUsed: number;
        generationTimeSeconds: number;
        modelVersions: any;
      };
    }
  ): Promise<string> {
    try {
      console.log('💾 Starting comprehensive analysis storage...');

      // **STEP 1: Create analysis record**
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // **STEP 2: Upload visualization files first**
      const visualizationUrls = await this.uploadVisualizationFiles(
        analysisId,
        analysisData.visualizationFiles || []
      );

      // **STEP 3: Store main analysis data**
      const storedAnalysis: Partial<StoredAnalysis> = {
        id: analysisId,
        session_id: sessionId,
        title,
        description: `Comprehensive ASR-GoT analysis: ${analysisData.researchContext.topic}`,
        
        research_context: analysisData.researchContext,
        parameters: analysisData.parameters,
        stage_results: analysisData.stageResults,
        graph_data: analysisData.graphData,
        final_report_html: analysisData.finalReportHtml,
        
        textual_content: analysisData.textualContent,
        json_analysis_data: analysisData.jsonAnalysisData || {},
        table_data: analysisData.tableData || [],
        chart_data: analysisData.chartData || [],
        visualization_files: visualizationUrls,
        
        total_tokens_used: analysisData.metadata.totalTokensUsed,
        generation_time_seconds: analysisData.metadata.generationTimeSeconds,
        model_versions: analysisData.metadata.modelVersions,
        
        content_length: analysisData.finalReportHtml.length,
        figure_count: visualizationUrls.length,
        reference_count: this.countReferences(analysisData.finalReportHtml),
        statistical_measures: this.extractStatisticalMeasures(analysisData.stageResults)
      };

      // **STEP 4: Store in custom analyses table**
      await this.storeAnalysisRecord(storedAnalysis);

      // **STEP 5: Store detailed files in storage buckets**
      await this.storeDetailedFiles(analysisId, {
        html: analysisData.finalReportHtml,
        json: analysisData.jsonAnalysisData,
        textualContent: analysisData.textualContent,
        stageResults: analysisData.stageResults
      });

      console.log(`✅ Complete analysis stored successfully: ${analysisId}`);
      return analysisId;

    } catch (error) {
      console.error('❌ Analysis storage failed:', error);
      throw new Error(`Failed to store analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload visualization files (PNG, SVG, PDF) or generate URLs for existing files
   */
  private async uploadVisualizationFiles(analysisId: string, files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    // If no files provided, try to collect existing visualization files from the page
    if (!files || files.length === 0) {
      try {
        const existingFiles = await this.collectVisualizationFiles();
        files = existingFiles;
      } catch (error) {
        console.warn('⚠️ Could not collect existing visualization files:', error);
        return uploadedUrls; // Return empty array rather than failing
      }
    }

    // Test bucket accessibility first
    try {
      const { data, error } = await supabase.storage
        .from(this.visualizationBucket)
        .list('', { limit: 1 });
      
      if (error) {
        throw new Error(`Visualization bucket not accessible: ${error.message}`);
      }
    } catch (testError) {
      console.error('❌ Visualization bucket accessibility test failed:', testError);
      return uploadedUrls;
    }

    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      if (!file || file.size === 0) {
        console.warn(`⚠️ Skipping invalid file at index ${i}`);
        continue;
      }
      
      // Check file size limit (10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`⚠️ Skipping oversized file: ${file.name} (${file.size} bytes)`);
        continue;
      }
      
      const filename = `${analysisId}/figure_${i + 1}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      let uploadSuccess = false;
      let lastError: any = null;

      // Retry upload with exponential backoff
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const { data, error } = await supabase.storage
            .from(this.visualizationBucket)
            .upload(filename, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type || 'application/octet-stream'
            });

          if (error) {
            // Handle specific error types
            if (error.message.includes('Bucket not found')) {
              throw new Error('Visualization bucket not accessible - ensure storage is initialized');
            }
            if (error.message.includes('Row Level Security')) {
              throw new Error('Storage access denied - check authentication and RLS policies');
            }
            if (error.message.includes('Duplicate')) {
              console.log(`📊 File already exists, getting URL: ${filename}`);
              // File already exists, just get the URL
            } else {
              throw error;
            }
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(this.visualizationBucket)
            .getPublicUrl(filename);

          if (urlData?.publicUrl) {
            uploadedUrls.push(urlData.publicUrl);
            console.log(`📊 Uploaded visualization ${i + 1}/${files.length}: ${filename}`);
            uploadSuccess = true;
            break; // Exit retry loop on success
          } else {
            throw new Error('Failed to get public URL for uploaded file');
          }
        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ Upload attempt ${retry + 1}/${maxRetries} failed for ${file.name}:`, error.message);
          
          if (retry < maxRetries - 1) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retry)));
          }
        }
      }
      
      if (!uploadSuccess) {
        console.error(`❌ Failed to upload ${file.name} after ${maxRetries} attempts:`, lastError);
        // Continue with other files rather than failing completely
      }
    }

    return uploadedUrls;
  }

  /**
   * Collect visualization files from current page (figures, charts, etc.)
   */
  private async collectVisualizationFiles(): Promise<File[]> {
    const files: File[] = [];
    
    try {
      // Find all images and canvas elements that could be visualizations
      const images = document.querySelectorAll('img[src*="data:"], canvas');
      
      for (let i = 0; i < images.length; i++) {
        const element = images[i];
        
        if (element instanceof HTMLCanvasElement) {
          // Convert canvas to blob
          element.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `visualization_${i + 1}.png`, { type: 'image/png' });
              files.push(file);
            }
          }, 'image/png');
        } else if (element instanceof HTMLImageElement && element.src.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(element.src);
          const blob = await response.blob();
          const file = new File([blob], `figure_${i + 1}.png`, { type: blob.type || 'image/png' });
          files.push(file);
        }
      }
      
      console.log(`📊 Collected ${files.length} visualization files from page`);
    } catch (error) {
      console.error('❌ Failed to collect visualization files:', error);
    }
    
    return files;
  }

  /**
   * Store analysis record in database
   */
  private async storeAnalysisRecord(analysis: Partial<StoredAnalysis>): Promise<void> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required for analysis storage');
      }

      // Store in the existing research_sessions table with enhanced config
      const sessionData = {
        id: analysis.session_id || analysis.id,
        title: analysis.title || 'ASR-GoT Analysis',
        description: analysis.description,
        status: 'completed',
        user_id: user.id, // Use authenticated user ID
        config: {
          analysis_id: analysis.id,
          research_context: analysis.research_context,
          parameters: analysis.parameters,
          metadata: {
            total_tokens_used: analysis.total_tokens_used,
            generation_time_seconds: analysis.generation_time_seconds,
            model_versions: analysis.model_versions,
            content_length: analysis.content_length,
            figure_count: analysis.figure_count,
            reference_count: analysis.reference_count
          },
          storage_info: {
            visualization_files: analysis.visualization_files,
            has_detailed_files: true,
            stored_at: new Date().toISOString()
          }
        }
      };

      const { error } = await supabase
        .from('research_sessions')
        .upsert(sessionData);

      if (error) throw error;
      console.log('✅ Analysis record stored in database');

    } catch (error) {
      console.error('❌ Database storage failed:', error);
      throw error;
    }
  }

  /**
   * Store detailed files in storage buckets
   */
  private async storeDetailedFiles(
    analysisId: string,
    files: {
      html: string;
      json: any;
      textualContent: any;
      stageResults: string[];
    }
  ): Promise<void> {
    try {
      // Store HTML report
      await this.uploadTextFile(
        `${analysisId}/final_report.html`,
        files.html,
        'text/html'
      );

      // Store JSON analysis data
      await this.uploadTextFile(
        `${analysisId}/analysis_data.json`,
        JSON.stringify(files.json, null, 2),
        'application/json'
      );

      // Store textual content
      await this.uploadTextFile(
        `${analysisId}/textual_content.json`,
        JSON.stringify(files.textualContent, null, 2),
        'application/json'
      );

      // Store stage results
      await this.uploadTextFile(
        `${analysisId}/stage_results.json`,
        JSON.stringify(files.stageResults, null, 2),
        'application/json'
      );

      console.log('✅ All detailed files stored successfully');

    } catch (error) {
      console.error('❌ Detailed file storage failed:', error);
    }
  }

  /**
   * Upload text content as file
   */
  private async uploadTextFile(
    path: string,
    content: string,
    contentType: string
  ): Promise<void> {
    const blob = new Blob([content], { type: contentType });
    
    const { error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
  }

  /**
   * Retrieve stored analysis by ID
   */
  async retrieveAnalysis(analysisId: string): Promise<StoredAnalysis | null> {
    try {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required for analysis retrieval');
      }

      // Get analysis record from database with RLS protection
      const { data: sessionData, error } = await supabase
        .from('research_sessions')
        .select('*')
        .eq('config->analysis_id', analysisId)
        .eq('user_id', user.id) // Ensure user can only access their own analyses
        .single();

      if (error || !sessionData) {
        console.error('❌ Analysis not found:', error);
        return null;
      }

      // Reconstruct stored analysis from session config
      const config = sessionData.config as any;
      
      // Download detailed files
      const detailedFiles = await this.downloadDetailedFiles(analysisId);

      const storedAnalysis: StoredAnalysis = {
        id: analysisId,
        session_id: sessionData.id,
        title: sessionData.title,
        description: sessionData.description,
        created_at: sessionData.created_at,
        updated_at: sessionData.updated_at,
        
        research_context: config.research_context,
        parameters: config.parameters,
        stage_results: detailedFiles.stageResults,
        graph_data: {} as GraphData, // Would need to reconstruct from stage executions
        final_report_html: detailedFiles.html,
        
        textual_content: detailedFiles.textualContent,
        json_analysis_data: detailedFiles.json,
        table_data: [],
        chart_data: [],
        visualization_files: config.storage_info?.visualization_files || [],
        
        total_tokens_used: config.metadata?.total_tokens_used || 0,
        generation_time_seconds: config.metadata?.generation_time_seconds || 0,
        model_versions: config.metadata?.model_versions || {},
        
        content_length: config.metadata?.content_length || 0,
        figure_count: config.metadata?.figure_count || 0,
        reference_count: config.metadata?.reference_count || 0,
        statistical_measures: []
      };

      console.log(`✅ Analysis retrieved successfully: ${analysisId}`);
      return storedAnalysis;

    } catch (error) {
      console.error('❌ Analysis retrieval failed:', error);
      return null;
    }
  }

  /**
   * Download detailed files from storage
   */
  private async downloadDetailedFiles(analysisId: string): Promise<{
    html: string;
    json: any;
    textualContent: any;
    stageResults: string[];
  }> {
    try {
      const [htmlData, jsonData, textualData, stageData] = await Promise.all([
        this.downloadTextFile(`${analysisId}/final_report.html`),
        this.downloadTextFile(`${analysisId}/analysis_data.json`),
        this.downloadTextFile(`${analysisId}/textual_content.json`),
        this.downloadTextFile(`${analysisId}/stage_results.json`)
      ]);

      return {
        html: htmlData || '',
        json: jsonData ? JSON.parse(jsonData) : {},
        textualContent: textualData ? JSON.parse(textualData) : {},
        stageResults: stageData ? JSON.parse(stageData) : []
      };

    } catch (error) {
      console.error('❌ Detailed file download failed:', error);
      return {
        html: '',
        json: {},
        textualContent: {},
        stageResults: []
      };
    }
  }

  /**
   * Download text file from storage
   */
  private async downloadTextFile(path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(path);

      if (error) throw error;
      return await data.text();

    } catch (error) {
      console.error(`❌ Failed to download ${path}:`, error);
      return null;
    }
  }

  /**
   * List all stored analyses
   */
  async listStoredAnalyses(limit = 20): Promise<Array<{
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    figure_count: number;
    content_length: number;
  }>> {
    try {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required to list analyses');
      }

      const { data, error } = await supabase
        .from('research_sessions')
        .select('id, title, description, created_at, config')
        .eq('user_id', user.id) // Only show user's own analyses
        .not('config->analysis_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.config?.analysis_id || item.id,
        title: item.title,
        description: item.description,
        created_at: item.created_at,
        figure_count: item.config?.metadata?.figure_count || 0,
        content_length: item.config?.metadata?.content_length || 0
      }));

    } catch (error) {
      console.error('❌ Failed to list analyses:', error);
      return [];
    }
  }

  /**
   * Delete stored analysis and all associated files
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required to delete analyses');
      }

      // Delete from database with RLS protection
      await supabase
        .from('research_sessions')
        .delete()
        .eq('config->analysis_id', analysisId)
        .eq('user_id', user.id); // Ensure user can only delete their own analyses

      // Delete files from storage
      await supabase.storage
        .from(this.bucketName)
        .remove([
          `${analysisId}/final_report.html`,
          `${analysisId}/analysis_data.json`,
          `${analysisId}/textual_content.json`,
          `${analysisId}/stage_results.json`
        ]);

      // Delete visualizations
      const { data: files } = await supabase.storage
        .from(this.visualizationBucket)
        .list(analysisId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${analysisId}/${file.name}`);
        await supabase.storage
          .from(this.visualizationBucket)
          .remove(filePaths);
      }

      console.log(`✅ Analysis deleted successfully: ${analysisId}`);
      return true;

    } catch (error) {
      console.error('❌ Analysis deletion failed:', error);
      return false;
    }
  }

  /**
   * Helper: Count references in HTML content
   */
  private countReferences(html: string): number {
    const referenceMatches = html.match(/<li[^>]*>/g);
    return referenceMatches ? referenceMatches.length : 0;
  }

  /**
   * Helper: Extract statistical measures from stage results
   */
  private extractStatisticalMeasures(stageResults: string[]): any[] {
    const measures: any[] = [];
    
    stageResults.forEach((result, index) => {
      // Extract p-values, confidence intervals, etc.
      const pValueMatches = result.match(/p\s*[<>=]\s*0\.\d+/gi);
      const ciMatches = result.match(/\d+%\s*ci[:\s]*[\d\.\-,\s]+/gi);
      
      if (pValueMatches || ciMatches) {
        measures.push({
          stage: index + 1,
          p_values: pValueMatches || [],
          confidence_intervals: ciMatches || [],
          content_snippet: result.substring(0, 200)
        });
      }
    });
    
    return measures;
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService();