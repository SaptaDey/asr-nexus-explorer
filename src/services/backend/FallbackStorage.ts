/**
 * Fallback Storage Service
 * Provides local storage when Supabase storage is not accessible due to RLS policies
 */

export interface FallbackStorageItem {
  id: string;
  bucketName: string;
  filePath: string;
  content: string;
  contentType: string;
  createdAt: string;
  size: number;
}

export class FallbackStorage {
  private static instance: FallbackStorage;
  private readonly storageKey = 'asr-got-fallback-storage';
  private readonly maxSize = 50 * 1024 * 1024; // 50MB total limit

  public static getInstance(): FallbackStorage {
    if (!FallbackStorage.instance) {
      FallbackStorage.instance = new FallbackStorage();
    }
    return FallbackStorage.instance;
  }

  /**
   * Store file content in localStorage with compression
   */
  async storeFile(
    bucketName: string,
    filePath: string,
    content: string | Blob,
    contentType: string = 'application/octet-stream'
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
    url?: string;
  }> {
    try {
      console.log(`💾 Storing file in fallback storage: ${bucketName}/${filePath}`);

      // Convert Blob to string if needed
      let fileContent: string;
      if (content instanceof Blob) {
        fileContent = await this.blobToBase64(content);
      } else {
        fileContent = content;
      }

      // Check size constraints
      if (fileContent.length > this.maxSize) {
        return {
          success: false,
          error: `File too large (${fileContent.length} bytes, max ${this.maxSize})`
        };
      }

      const id = crypto.randomUUID();
      const item: FallbackStorageItem = {
        id,
        bucketName,
        filePath,
        content: fileContent,
        contentType,
        createdAt: new Date().toISOString(),
        size: fileContent.length
      };

      // Get existing storage
      const storage = this.getStorage();
      
      // Check total size limit
      const totalSize = storage.reduce((sum, item) => sum + item.size, 0);
      if (totalSize + item.size > this.maxSize) {
        // Remove oldest items to make space
        this.cleanupOldItems(item.size);
      }

      // Add new item
      storage.push(item);
      this.saveStorage(storage);

      // Generate a data URL for the content
      const url = this.generateDataUrl(fileContent, contentType);

      console.log(`✅ File stored in fallback storage: ${id}`);
      return {
        success: true,
        id,
        url
      };

    } catch (error) {
      console.error('❌ Fallback storage failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage failed'
      };
    }
  }

  /**
   * Retrieve file from fallback storage
   */
  async retrieveFile(bucketName: string, filePath: string): Promise<{
    success: boolean;
    content?: string;
    contentType?: string;
    error?: string;
  }> {
    try {
      const storage = this.getStorage();
      const item = storage.find(item => 
        item.bucketName === bucketName && item.filePath === filePath
      );

      if (!item) {
        return {
          success: false,
          error: 'File not found in fallback storage'
        };
      }

      return {
        success: true,
        content: item.content,
        contentType: item.contentType
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      };
    }
  }

  /**
   * List files in fallback storage
   */
  listFiles(bucketName?: string): Array<{
    id: string;
    bucketName: string;
    filePath: string;
    size: number;
    createdAt: string;
  }> {
    try {
      const storage = this.getStorage();
      return storage
        .filter(item => !bucketName || item.bucketName === bucketName)
        .map(item => ({
          id: item.id,
          bucketName: item.bucketName,
          filePath: item.filePath,
          size: item.size,
          createdAt: item.createdAt
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('❌ Failed to list fallback storage files:', error);
      return [];
    }
  }

  /**
   * Delete file from fallback storage
   */
  deleteFile(bucketName: string, filePath: string): boolean {
    try {
      const storage = this.getStorage();
      const initialLength = storage.length;
      const filtered = storage.filter(item => 
        !(item.bucketName === bucketName && item.filePath === filePath)
      );
      
      if (filtered.length < initialLength) {
        this.saveStorage(filtered);
        console.log(`🗑️ File deleted from fallback storage: ${bucketName}/${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to delete from fallback storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getUsageStats(): {
    totalFiles: number;
    totalSize: number;
    maxSize: number;
    usagePercent: number;
    buckets: Record<string, { files: number; size: number }>;
  } {
    try {
      const storage = this.getStorage();
      const totalSize = storage.reduce((sum, item) => sum + item.size, 0);
      const buckets: Record<string, { files: number; size: number }> = {};

      storage.forEach(item => {
        if (!buckets[item.bucketName]) {
          buckets[item.bucketName] = { files: 0, size: 0 };
        }
        buckets[item.bucketName].files++;
        buckets[item.bucketName].size += item.size;
      });

      return {
        totalFiles: storage.length,
        totalSize,
        maxSize: this.maxSize,
        usagePercent: Math.round((totalSize / this.maxSize) * 100),
        buckets
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        maxSize: this.maxSize,
        usagePercent: 0,
        buckets: {}
      };
    }
  }

  /**
   * Clear all fallback storage
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🧹 Fallback storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear fallback storage:', error);
    }
  }

  /**
   * Private: Get storage from localStorage
   */
  private getStorage(): FallbackStorageItem[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Failed to read fallback storage:', error);
      return [];
    }
  }

  /**
   * Private: Save storage to localStorage
   */
  private saveStorage(storage: FallbackStorageItem[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('❌ Failed to save fallback storage:', error);
      // If localStorage is full, try to clean up and retry
      this.cleanupOldItems(0);
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(storage));
      } catch (retryError) {
        console.error('❌ Failed to save fallback storage after cleanup:', retryError);
      }
    }
  }

  /**
   * Private: Clean up old items to make space
   */
  private cleanupOldItems(spaceNeeded: number): void {
    try {
      const storage = this.getStorage();
      storage.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let removedSize = 0;
      const filtered = storage.filter(item => {
        if (removedSize < spaceNeeded) {
          removedSize += item.size;
          console.log(`🧹 Removing old fallback storage item: ${item.bucketName}/${item.filePath}`);
          return false;
        }
        return true;
      });

      this.saveStorage(filtered);
    } catch (error) {
      console.error('❌ Failed to cleanup fallback storage:', error);
    }
  }

  /**
   * Private: Convert Blob to Base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Private: Generate data URL for content
   */
  private generateDataUrl(content: string, contentType: string): string {
    try {
      // If content is already a data URL, return as-is
      if (content.startsWith('data:')) {
        return content;
      }

      // For text content, create a data URL
      const encoded = btoa(unescape(encodeURIComponent(content)));
      return `data:${contentType};base64,${encoded}`;
    } catch (error) {
      console.warn('⚠️ Failed to generate data URL:', error);
      return `data:${contentType};base64,${btoa(content)}`;
    }
  }
}

// Export singleton instance
export const fallbackStorage = FallbackStorage.getInstance();