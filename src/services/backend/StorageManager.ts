/**
 * Comprehensive Storage Manager
 * Handles all Supabase storage operations with robust error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { backendInitializer } from './BackendInitializer';
import { fallbackStorage } from './FallbackStorage';

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface StorageDownloadResult {
  success: boolean;
  data?: Blob;
  text?: string;
  error?: string;
}

export class StorageManager {
  private static instance: StorageManager;

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Upload file to specified bucket with comprehensive error handling
   */
  async uploadFile(
    bucketName: string,
    filePath: string,
    file: File | Blob | string,
    options: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    } = {}
  ): Promise<StorageUploadResult> {
    try {
      // Ensure backend is initialized
      const health = backendInitializer.getHealthStatus();
      if (health.storage === 'error') {
        console.log('🔄 Storage marked as error, attempting to reinitialize...');
        await backendInitializer.reinitialize();
      }

      console.log(`📤 Uploading file to ${bucketName}/${filePath}`);

      // Prepare file data
      let fileData: File | Blob;
      if (typeof file === 'string') {
        fileData = new Blob([file], { type: options.contentType || 'text/plain' });
      } else {
        fileData = file;
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileData, {
          contentType: options.contentType,
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert ?? true
        });

      if (error) {
        console.error(`❌ Upload failed to ${bucketName}/${filePath}:`, error);
        
        // If RLS policy error, try fallback storage
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`🔄 RLS policy blocked upload, trying fallback storage for ${bucketName}/${filePath}`);
          
          try {
            const fallbackResult = await fallbackStorage.storeFile(
              bucketName, 
              filePath, 
              typeof fileData === 'string' ? fileData : await this.blobToString(fileData),
              options.contentType || 'application/octet-stream'
            );
            
            if (fallbackResult.success) {
              console.log(`✅ File stored in fallback storage: ${bucketName}/${filePath}`);
              return {
                success: true,
                url: fallbackResult.url,
                path: filePath
              };
            } else {
              return {
                success: false,
                error: `Supabase storage blocked by RLS policy, fallback storage failed: ${fallbackResult.error}`
              };
            }
          } catch (fallbackError) {
            console.error('❌ Fallback storage also failed:', fallbackError);
            return {
              success: false,
              error: `Storage access restricted by security policy. Fallback storage also failed.`
            };
          }
        }
        
        // Provide more helpful error messages for other issues
        let errorMessage = error.message;
        if (error.message.includes('bucket') && error.message.includes('not found')) {
          errorMessage = `Storage bucket '${bucketName}' not found. Please contact support.`;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      // Get public URL for public buckets
      let publicUrl: string | undefined;
      try {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      } catch (urlError) {
        console.warn(`⚠️ Could not generate public URL for ${bucketName}/${filePath}`);
      }

      console.log(`✅ Upload successful: ${bucketName}/${filePath}`);
      return {
        success: true,
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error(`❌ Storage upload error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Download file from storage
   */
  async downloadFile(
    bucketName: string,
    filePath: string,
    asText: boolean = false
  ): Promise<StorageDownloadResult> {
    try {
      console.log(`📥 Downloading file from ${bucketName}/${filePath}`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error(`❌ Download failed from ${bucketName}/${filePath}:`, error);
        
        // If RLS policy error, try fallback storage
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`🔄 RLS policy blocked download, trying fallback storage for ${bucketName}/${filePath}`);
          
          try {
            const fallbackResult = await fallbackStorage.retrieveFile(bucketName, filePath);
            
            if (fallbackResult.success && fallbackResult.content) {
              console.log(`✅ File retrieved from fallback storage: ${bucketName}/${filePath}`);
              
              const result: StorageDownloadResult = {
                success: true,
                text: fallbackResult.content
              };
              
              // Try to convert content back to Blob if needed
              if (!asText) {
                try {
                  const response = await fetch(fallbackResult.content);
                  result.data = await response.blob();
                } catch (conversionError) {
                  console.warn('⚠️ Could not convert fallback content to blob');
                }
              }
              
              return result;
            } else {
              return {
                success: false,
                error: `Supabase storage blocked by RLS policy, file not found in fallback storage`
              };
            }
          } catch (fallbackError) {
            console.error('❌ Fallback storage retrieval failed:', fallbackError);
            return {
              success: false,
              error: `Storage access restricted by security policy. Fallback storage retrieval failed.`
            };
          }
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      const result: StorageDownloadResult = {
        success: true,
        data
      };

      if (asText && data) {
        try {
          result.text = await data.text();
        } catch (textError) {
          console.warn('⚠️ Could not convert blob to text');
        }
      }

      console.log(`✅ Download successful: ${bucketName}/${filePath}`);
      return result;

    } catch (error) {
      console.error(`❌ Storage download error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown download error'
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucketName: string, filePath: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting file from ${bucketName}/${filePath}`);

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error(`❌ Delete failed for ${bucketName}/${filePath}:`, error);
        return false;
      }

      console.log(`✅ Delete successful: ${bucketName}/${filePath}`);
      return true;

    } catch (error) {
      console.error(`❌ Storage delete error:`, error);
      return false;
    }
  }

  /**
   * List files in a bucket folder
   */
  async listFiles(bucketName: string, folderPath: string = ''): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      id: string;
      updated_at: string;
      created_at: string;
      last_accessed_at: string;
      metadata: any;
    }>;
    error?: string;
  }> {
    try {
      console.log(`📋 Listing files in ${bucketName}/${folderPath}`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (error) {
        console.error(`❌ List failed for ${bucketName}/${folderPath}:`, error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`✅ List successful: ${bucketName}/${folderPath} (${data?.length || 0} files)`);
      return {
        success: true,
        files: data || []
      };

    } catch (error) {
      console.error(`❌ Storage list error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown list error'
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucketName: string, filePath: string): string | null {
    try {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error(`❌ Could not get public URL for ${bucketName}/${filePath}:`, error);
      return null;
    }
  }

  /**
   * Create a signed URL for private files
   */
  async createSignedUrl(
    bucketName: string, 
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      console.log(`🔗 Creating signed URL for ${bucketName}/${filePath}`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error(`❌ Signed URL creation failed for ${bucketName}/${filePath}:`, error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`✅ Signed URL created: ${bucketName}/${filePath}`);
      return {
        success: true,
        url: data.signedUrl
      };

    } catch (error) {
      console.error(`❌ Signed URL error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown signed URL error'
      };
    }
  }

  /**
   * Helper: Convert Blob to string
   */
  private async blobToString(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Upload multiple files in batch
   */
  async uploadBatch(
    bucketName: string,
    files: Array<{
      path: string;
      file: File | Blob | string;
      options?: {
        contentType?: string;
        cacheControl?: string;
        upsert?: boolean;
      };
    }>
  ): Promise<Array<StorageUploadResult>> {
    console.log(`📤 Batch uploading ${files.length} files to ${bucketName}`);

    const results = await Promise.all(
      files.map(({ path, file, options }) =>
        this.uploadFile(bucketName, path, file, options)
      )
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch upload completed: ${successCount}/${files.length} successful`);

    return results;
  }

  /**
   * Clean up old files (utility function)
   */
  async cleanupOldFiles(
    bucketName: string,
    folderPath: string,
    olderThanDays: number = 7
  ): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      console.log(`🧹 Cleaning up files older than ${olderThanDays} days in ${bucketName}/${folderPath}`);

      const { success, files, error } = await this.listFiles(bucketName, folderPath);
      if (!success || !files) {
        return { success: false, error: error || 'Could not list files' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const filesToDelete = files.filter(file => 
        new Date(file.updated_at) < cutoffDate
      );

      if (filesToDelete.length === 0) {
        console.log(`✅ No old files to clean up in ${bucketName}/${folderPath}`);
        return { success: true, deletedCount: 0 };
      }

      const deletePromises = filesToDelete.map(file => 
        this.deleteFile(bucketName, `${folderPath}/${file.name}`.replace('//', '/'))
      );

      const deleteResults = await Promise.all(deletePromises);
      const deletedCount = deleteResults.filter(result => result).length;

      console.log(`✅ Cleanup completed: ${deletedCount}/${filesToDelete.length} files deleted`);
      return { success: true, deletedCount };

    } catch (error) {
      console.error(`❌ Cleanup error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cleanup error'
      };
    }
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();