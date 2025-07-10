/**
 * In-App Preview Component for Exports
 * Provides iframe preview functionality for HTML/PDF exports
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Printer, 
  Share, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface InAppPreviewProps {
  content: string;
  title: string;
  type: 'html' | 'pdf' | 'markdown';
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export const InAppPreview: React.FC<InAppPreviewProps> = ({
  content,
  title,
  type,
  onDownload,
  onShare,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Create blob URL for preview
  useEffect(() => {
    if (content && isOpen) {
      setIsLoading(true);
      
      const mimeType = type === 'html' ? 'text/html' : 
                      type === 'pdf' ? 'application/pdf' : 
                      'text/markdown';
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [content, type, isOpen]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Auto-adjust zoom for better fit
    if (iframeRef.current && type === 'html') {
      try {
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          // Apply responsive styling
          const style = iframeDoc.createElement('style');
          style.textContent = `
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto; 
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          `;
          iframeDoc.head.appendChild(style);
        }
      } catch (error) {
        console.warn('Could not access iframe content:', error);
      }
    }
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Print function
  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const iframeWindow = iframe.contentWindow;
        
        if (iframeWindow) {
          iframeWindow.focus();
          iframeWindow.print();
          toast.success('Print dialog opened');
        }
      } catch (error) {
        toast.error('Could not open print dialog');
      }
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
      toast.success('Opened in new tab');
    }
  };

  // Download function
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    }
  };

  // Share function
  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this ${type.toUpperCase()} report: ${title}`,
          url: previewUrl
        });
        toast.success('Shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Could not share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(previewUrl);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Could not copy link');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <FileText className="h-4 w-4 mr-2" />
          Preview {type.toUpperCase()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className={`max-w-7xl max-h-[90vh] ${isFullscreen ? 'w-screen h-screen max-w-none max-h-none' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>{title}</span>
              <Badge variant="outline">{type.toUpperCase()}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button size="sm" variant="ghost" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 min-w-[50px] text-center">
                  {zoomLevel}%
                </span>
                <Button size="sm" variant="ghost" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleZoomReset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-1" />
                New Tab
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
              
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </motion.div>
            </div>
          )}

          <div className="h-full border rounded-lg overflow-hidden">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                width: `${(100 / zoomLevel) * 100}%`,
                height: `${(100 / zoomLevel) * 100}%`
              }}
              onLoad={handleIframeLoad}
              title={`${title} Preview`}
              sandbox="allow-same-origin allow-scripts allow-popups"
            />
          </div>

          {/* Preview Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Preview Mode</span>
                <Badge variant="secondary">{type.toUpperCase()}</Badge>
              </div>
            </div>
            
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
              <div className="flex items-center gap-2 text-sm">
                <span>Zoom: {zoomLevel}%</span>
                {isLoading && (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                    <span className="text-xs">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};