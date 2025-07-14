import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  RotateCw, 
  RotateCcw, 
  Download,
  RefreshCw,
  Image as ImageIcon,
  Settings,
  Eye
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface LogoTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  width: number;
  height: number;
}

interface CustomImageEditorProps {
  backgroundImage?: string;
  logoImage?: string;
  resultImage?: string;
  onBackgroundUpload?: (file: File) => void;
  onLogoUpload?: (file: File) => void;
  handleResultImage?: () => void;
  onTransformChange?: (transform: LogoTransform & { productBounds?: ProductBounds }) => void;
  initialTransform?: Partial<LogoTransform>;
  canvasWidth?: number;
  canvasHeight?: number;
}

interface ProductBounds {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
  scaleX: number;
  scaleY: number;
}

const CustomImageEditor: React.FC<CustomImageEditorProps> = ({
  backgroundImage,
  logoImage,
  resultImage,
  onBackgroundUpload,
  onLogoUpload,
  onTransformChange,
  handleResultImage,
  initialTransform = {},
  canvasWidth = 800,
  canvasHeight = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [initialScale, setInitialScale] = useState(1);
  const [initialRotation, setInitialRotation] = useState(0);
  const [logoTransform, setLogoTransform] = useState<LogoTransform>({
    x: initialTransform.x || canvasWidth / 2,
    y: initialTransform.y || canvasHeight / 2,
    scale: initialTransform.scale || 1,
    rotation: initialTransform.rotation || 0,
    opacity: initialTransform.opacity || 1,
    width: initialTransform.width || 0,
    height: initialTransform.height || 0
  });


  // Load background image - moved after function declarations
  const API_UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5371';

  // Load logo image
  useEffect(() => {
    if (logoImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogoImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error", 
          description: "Failed to load logo image",
          variant: "destructive"
        });
      };
      img.src = API_UPLOAD_URL + logoImage;
    }
  }, [logoImage]);

  // Calculate product image bounds within canvas
  const getProductBounds = useCallback((): ProductBounds | null => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImg) return null;

    const bgAspect = backgroundImg.width / backgroundImg.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;
    
    if (bgAspect > canvasAspect) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / bgAspect;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * bgAspect;
      drawHeight = canvas.height;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    }
    
    return {
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
      scaleX: drawWidth / backgroundImg.width,
      scaleY: drawHeight / backgroundImg.height
    };
  }, [backgroundImg]);

  // Convert product-relative coordinates to canvas coordinates
  const convertToCanvasCoordinates = useCallback((relativeX: number, relativeY: number) => {
    const bounds = getProductBounds();
    if (!bounds) {
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }
    
    return {
      x: bounds.offsetX + (relativeX * bounds.scaleX),
      y: bounds.offsetY + (relativeY * bounds.scaleY)
    };
  }, [getProductBounds, canvasWidth, canvasHeight]);

  // Get logo bounds for interaction
  const getLogoBounds = useCallback(() => {
    if (!logoImg) return null;
    
    const logoWidth = logoImg.width * logoTransform.scale;
    const logoHeight = logoImg.height * logoTransform.scale;
    
    return {
      left: logoTransform.x - logoWidth / 2,
      right: logoTransform.x + logoWidth / 2,
      top: logoTransform.y - logoHeight / 2,
      bottom: logoTransform.y + logoHeight / 2,
      width: logoWidth,
      height: logoHeight,
      centerX: logoTransform.x,
      centerY: logoTransform.y
    };
  }, [logoImg, logoTransform]);

  // Helper function to rotate a point around another point
  const rotatePoint = useCallback((x: number, y: number, centerX: number, centerY: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const dx = x - centerX;
    const dy = y - centerY;
    
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos
    };
  }, []);

  // Get rotated handle positions
  const getRotatedHandles = useCallback(() => {
    const bounds = getLogoBounds();
    if (!bounds) return null;
    
    const handleSize = 12;
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const rotation = logoTransform.rotation;
    
    // Original handle positions (before rotation)
    const originalHandles = [
      { x: bounds.left - 8, y: bounds.top - 8, type: 'nw' },
      { x: bounds.right + 8 - handleSize, y: bounds.top - 8, type: 'ne' },
      { x: bounds.right + 8 - handleSize, y: bounds.bottom + 8 - handleSize, type: 'se' },
      { x: bounds.left - 8, y: bounds.bottom + 8 - handleSize, type: 'sw' }
    ];
    
    // Rotate each handle around the logo center
    const rotatedHandles = originalHandles.map(handle => {
      const handleCenterX = handle.x + handleSize / 2;
      const handleCenterY = handle.y + handleSize / 2;
      const rotated = rotatePoint(handleCenterX, handleCenterY, centerX, centerY, rotation);
      
      return {
        ...handle,
        x: rotated.x - handleSize / 2,
        y: rotated.y - handleSize / 2,
        centerX: rotated.x,
        centerY: rotated.y
      };
    });
    
    // Rotation handle
    const rotateHandleY = bounds.top - 30;
    const rotatedRotateHandle = rotatePoint(centerX, rotateHandleY, centerX, centerY, rotation);
    
    return {
      corners: rotatedHandles,
      rotation: {
        x: rotatedRotateHandle.x,
        y: rotatedRotateHandle.y
      }
    };
  }, [getLogoBounds, logoTransform.rotation, rotatePoint]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgroundImg) {
      // Calculate aspect ratio to fit background
      const bgAspect = backgroundImg.width / backgroundImg.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;
      
      if (bgAspect > canvasAspect) {
        // Background is wider than canvas
        drawWidth = canvas.width;
        drawHeight = canvas.width / bgAspect;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Background is taller than canvas
        drawWidth = canvas.height * bgAspect;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      
      ctx.drawImage(backgroundImg, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      // Draw placeholder background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid pattern
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const gridSize = 20;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw placeholder text
      ctx.fillStyle = '#64748b';
      ctx.font = '20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drop your background image here', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('or click "Upload Background" above', canvas.width / 2, canvas.height / 2 + 15);
    }

    // Draw logo
    if (logoImg) {
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = logoTransform.opacity;
      
      // Move to logo center
      ctx.translate(logoTransform.x, logoTransform.y);
      
      // Apply rotation
      ctx.rotate((logoTransform.rotation * Math.PI) / 180);
      
      // Calculate logo dimensions
      const logoWidth = logoImg.width * logoTransform.scale;
      const logoHeight = logoImg.height * logoTransform.scale;
      
      // Draw logo centered at current position
      ctx.drawImage(
        logoImg,
        -logoWidth / 2,
        -logoHeight / 2,
        logoWidth,
        logoHeight
      );
      
      ctx.restore();
      
      // Draw interactive handles if logo is selected
      if (showControls) {
        const bounds = getLogoBounds();
        const rotatedHandles = getRotatedHandles();
        if (bounds && rotatedHandles) {
          ctx.strokeStyle = '#3b82f6';
          ctx.fillStyle = '#3b82f6';
          ctx.lineWidth = 2;
          
          // Draw selection border (rotated)
          ctx.save();
          ctx.translate(bounds.centerX, bounds.centerY);
          ctx.rotate((logoTransform.rotation * Math.PI) / 180);
          ctx.strokeRect(-bounds.width / 2 - 5, -bounds.height / 2 - 5, bounds.width + 10, bounds.height + 10);
          ctx.restore();
          
          // Draw corner handles for scaling (rotated)
          const handleSize = 12;
          rotatedHandles.corners.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          });
          
          // Draw rotation handle (rotated)
          ctx.beginPath();
          ctx.arc(rotatedHandles.rotation.x, rotatedHandles.rotation.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw line from border to rotation handle (rotated)
          ctx.save();
          ctx.translate(bounds.centerX, bounds.centerY);
          ctx.rotate((logoTransform.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.moveTo(0, -bounds.height / 2 - 5);
          ctx.lineTo(0, -bounds.height / 2 - 30 + 8);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }, [backgroundImg, logoImg, logoTransform, showControls, getLogoBounds, getRotatedHandles]);

  // Re-render when dependencies change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBackgroundImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load product image",
          variant: "destructive"
        });
      };
      img.src = API_UPLOAD_URL + backgroundImage;
    }
  }, [backgroundImage, API_UPLOAD_URL]);

  // Convert initial coordinates when background image loads
  useEffect(() => {
    if (backgroundImg && initialTransform.x !== undefined && initialTransform.y !== undefined) {
      const canvasCoords = convertToCanvasCoordinates(initialTransform.x, initialTransform.y);
      setLogoTransform(prev => ({
        ...prev,
        x: canvasCoords.x,
        y: canvasCoords.y
      }));
    }
  }, [backgroundImg]); // Only re-run when background image changes

  // Get cursor style based on mouse position
  const getCursorStyle = useCallback((mouseX: number, mouseY: number) => {
    if (!logoImg || !showControls) return 'default';
    
    const bounds = getLogoBounds();
    const rotatedHandles = getRotatedHandles();
    if (!bounds || !rotatedHandles) return 'default';
    
    // Check rotation handle
    const distToRotateHandle = Math.sqrt(
      Math.pow(mouseX - rotatedHandles.rotation.x, 2) + Math.pow(mouseY - rotatedHandles.rotation.y, 2)
    );
    if (distToRotateHandle <= 12) return 'grab';
    
    // Check corner handles (with better detection)
    for (const handle of rotatedHandles.corners) {
      const distToHandle = Math.sqrt(
        Math.pow(mouseX - handle.centerX, 2) + Math.pow(mouseY - handle.centerY, 2)
      );
      if (distToHandle <= 10) {
        // Return appropriate cursor based on handle type and rotation
        const rotation = logoTransform.rotation;
        const normalizedRotation = ((rotation % 90) + 90) % 90;
        
        if (normalizedRotation < 22.5 || normalizedRotation > 67.5) {
          // Close to 0° or 90° rotation
          return handle.type === 'nw' || handle.type === 'se' ? 'nw-resize' : 'ne-resize';
        } else {
          // Close to 45° rotation
          return handle.type === 'nw' || handle.type === 'se' ? 'ne-resize' : 'nw-resize';
        }
      }
    }
    
    // Check if over logo (using rotated bounds check)
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const rotation = -logoTransform.rotation * Math.PI / 180; // Inverse rotation
    
    // Rotate mouse position to logo's coordinate system
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const rotatedMouseX = centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
    const rotatedMouseY = centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation);
    
    if (rotatedMouseX >= bounds.left && rotatedMouseX <= bounds.right &&
        rotatedMouseY >= bounds.top && rotatedMouseY <= bounds.bottom) {
      return 'move';
    }
    
    return 'default';
  }, [logoImg, showControls, getLogoBounds, getRotatedHandles, logoTransform.rotation]);

  // Handle file uploads
  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (onBackgroundUpload) {
      onBackgroundUpload(file);
    }

    // Also load locally for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setBackgroundImg(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (onLogoUpload) {
      onLogoUpload(file);
    }

    // Also load locally for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLogoImg(img);
        setLogoTransform(prev => ({
          ...prev,
          width: img.width,
          height: img.height
        }));
        setShowControls(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle mouse events
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!logoImg) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const bounds = getLogoBounds();
    const rotatedHandles = getRotatedHandles();
    if (!bounds || !rotatedHandles) return;
    
    // Check rotation handle
    const distToRotateHandle = Math.sqrt(
      Math.pow(mouseX - rotatedHandles.rotation.x, 2) + Math.pow(mouseY - rotatedHandles.rotation.y, 2)
    );
    
    if (distToRotateHandle <= 12) {
      setIsRotating(true);
      setInitialRotation(logoTransform.rotation);
      setDragStart({ x: mouseX, y: mouseY });
      return;
    }
    
    // Check corner handles for resizing
    for (const handle of rotatedHandles.corners) {
      const distToHandle = Math.sqrt(
        Math.pow(mouseX - handle.centerX, 2) + Math.pow(mouseY - handle.centerY, 2)
      );
      if (distToHandle <= 10) {
        setIsResizing(true);
        setInitialScale(logoTransform.scale);
        setDragStart({ x: mouseX, y: mouseY });
        return;
      }
    }

    // Check if clicking on logo for dragging (using rotated bounds check)
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const rotation = -logoTransform.rotation * Math.PI / 180; // Inverse rotation
    
    // Rotate mouse position to logo's coordinate system
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const rotatedMouseX = centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
    const rotatedMouseY = centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation);

    if (rotatedMouseX >= bounds.left && rotatedMouseX <= bounds.right &&
        rotatedMouseY >= bounds.top && rotatedMouseY <= bounds.bottom) {
      setIsDragging(true);
      setDragStart({ x: mouseX - logoTransform.x, y: mouseY - logoTransform.y });
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  };
  const handleMouseMove = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    // Update cursor
    canvas.style.cursor = getCursorStyle(mouseX, mouseY);

    if (!logoImg) return;
    if (isDragging) {
      // Update visual position immediately for smooth dragging
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      
      // Update state for visual feedback
      setLogoTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing) {
      const logoBounds = getLogoBounds();
      if (!logoBounds) return;
      
      // Calculate distance from center to current mouse position
      const centerX = logoTransform.x;
      const centerY = logoTransform.y;
      const currentDistance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
      const initialDistance = Math.sqrt(Math.pow(dragStart.x - centerX, 2) + Math.pow(dragStart.y - centerY, 2));
      
      // Calculate scale factor based on distance ratio
      const distanceRatio = currentDistance / initialDistance;
      let newScale = initialScale * distanceRatio;
      
      // Clamp scale values
      newScale = Math.max(0.1, Math.min(3, newScale));
      
      const newTransform = { ...logoTransform, scale: newScale };
      setLogoTransform(newTransform);
      
      // Calculate product-relative position
      const productBoundsData = getProductBounds();
      if (productBoundsData) {
        const relativeX = (newTransform.x - productBoundsData.offsetX) / productBoundsData.scaleX;
        const relativeY = (newTransform.y - productBoundsData.offsetY) / productBoundsData.scaleY;
        
        onTransformChange?.({
          ...newTransform,
          x: relativeX,
          y: relativeY,
          productBounds: productBoundsData
        });
      } else {
        onTransformChange?.(newTransform);
      }
      
    } else if (isRotating) {
      const rotationBounds = getLogoBounds();
      if (!rotationBounds) return;
      
      // Calculate rotation angle from center of logo
      const centerX = rotationBounds.centerX;
      const centerY = rotationBounds.centerY;
      
      // Get initial angle and current angle
      const initialAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX);
      const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
      
      // Calculate total rotation from initial position
      const totalRotation = (currentAngle - initialAngle) * (180 / Math.PI);
      const newRotation = initialRotation + totalRotation;
      
      const newTransform = {
        ...logoTransform,
        rotation: newRotation
      };
      setLogoTransform(newTransform);
      
      // Calculate product-relative position
      const productBoundsInfo = getProductBounds();
      if (productBoundsInfo) {
        const relativeX = (newTransform.x - productBoundsInfo.offsetX) / productBoundsInfo.scaleX;
        const relativeY = (newTransform.y - productBoundsInfo.offsetY) / productBoundsInfo.scaleY;
        
        onTransformChange?.({
          ...newTransform,
          x: relativeX,
          y: relativeY,
          productBounds: productBoundsInfo
        });
      } else {
        onTransformChange?.(newTransform);
      }
    }
  };

  const handleMouseUp = () => {
    // If we were dragging, now convert coordinates and notify parent
    if (isDragging && logoTransform) {
      const productBounds = getProductBounds();
      if (productBounds) {
        const relativeX = (logoTransform.x - productBounds.offsetX) / productBounds.scaleX;
        const relativeY = (logoTransform.y - productBounds.offsetY) / productBounds.scaleY;
        
        onTransformChange?.({
          ...logoTransform,
          x: relativeX,
          y: relativeY,
          productBounds
        });
      } else {
        onTransformChange?.(logoTransform);
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setInitialScale(logoTransform.scale);
    setInitialRotation(logoTransform.rotation);
  };

  // Transform handlers with product-relative coordinates
  const updateTransform = (updates: Partial<LogoTransform>) => {
    const newTransform = { ...logoTransform, ...updates };
    setLogoTransform(newTransform);
    
    // Calculate product-relative position
    const productBounds = getProductBounds();
    if (productBounds) {
      const relativeX = (newTransform.x - productBounds.offsetX) / productBounds.scaleX;
      const relativeY = (newTransform.y - productBounds.offsetY) / productBounds.scaleY;
      
      onTransformChange?.({
        ...newTransform,
        x: relativeX,
        y: relativeY,
        productBounds
      });
    } else {
      onTransformChange?.(newTransform);
    }
  };

  const resetLogo = () => {
    setLogoTransform(prev => ({
      ...prev,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      scale: 1,
      rotation: 0,
      opacity: 1
    }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'mockup-design.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={backgroundFileRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />
      <input
        ref={logoFileRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Top Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => backgroundFileRef.current?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Product
              </Button>
              <Button
                variant="outline"
                onClick={() => logoFileRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Logo
              </Button>
            </div>
            {resultImage &&
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleResultImage}
                  disabled={!backgroundImg && !logoImg}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Result Product
                </Button>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4">
        {/* Canvas Area */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full max-h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        {logoImg && (
          <div className="w-80">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Logo Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowControls(!showControls)}
                    className="flex-1"
                  >
                    {showControls ? 'Hide' : 'Show'} Handles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetLogo}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Position */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">X</Label>
                      <Input
                        type="number"
                        value={Math.round(logoTransform.x)}
                        onChange={(e) => updateTransform({ x: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Y</Label>
                      <Input
                        type="number"
                        value={Math.round(logoTransform.y)}
                        onChange={(e) => updateTransform({ y: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Scale */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Scale: {logoTransform.scale.toFixed(2)}x
                  </Label>
                  <Slider
                    value={[logoTransform.scale]}
                    onValueChange={([value]) => updateTransform({ scale: value })}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Rotation: {Math.round(logoTransform.rotation)}°
                  </Label>
                  <Slider
                    value={[logoTransform.rotation]}
                    onValueChange={([value]) => updateTransform({ rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTransform({ rotation: logoTransform.rotation - 15 })}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTransform({ rotation: logoTransform.rotation + 15 })}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Opacity: {Math.round(logoTransform.opacity * 100)}%
                  </Label>
                  <Slider
                    value={[logoTransform.opacity]}
                    onValueChange={([value]) => updateTransform({ opacity: value })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                {/* Help */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-xs">
                      <p className="font-medium">Quick Controls:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Click logo to select</li>
                        <li>• Drag blue handles to resize</li>
                        <li>• Drag blue circle to rotate</li>
                        <li>• Drag logo to move</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomImageEditor;