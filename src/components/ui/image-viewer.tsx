import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
  alt?: string;
}

export function ImageViewer({ 
  open, 
  onOpenChange, 
  imageUrl, 
  title = "Image Viewer",
  alt = "Image"
}: ImageViewerProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = alt;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  React.useEffect(() => {
    if (!open) {
      resetTransform();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center h-[70vh] overflow-auto bg-gray-50">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
        
        <div className="p-4 text-center text-sm text-muted-foreground">
          Zoom: {Math.round(zoom * 100)}% | Use mouse wheel to zoom
        </div>
      </DialogContent>
    </Dialog>
  );
}