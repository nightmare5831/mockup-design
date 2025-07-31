import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff, ArrowLeftRight } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUrl';

interface BeforeAfterPreviewProps {
  beforeImage?: string;
  afterImage?: string;
  className?: string;
}

const BeforeAfterPreview: React.FC<BeforeAfterPreviewProps> = ({
  beforeImage,
  afterImage,
  className = ""
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'toggle'>('slider');
  const [showAfter, setShowAfter] = useState(false);

  if (!beforeImage || !afterImage) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p>Upload product and logo images to see the before/after preview</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Preview Comparison</h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'slider' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('slider')}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'toggle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('toggle')}
            >
              {showAfter ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="relative aspect-video bg-muted">
        {viewMode === 'slider' ? (
          <>
            {/* Before Image */}
            <div className="absolute inset-0">
              <img 
                src={getImageUrl(beforeImage)} 
                alt="Before" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* After Image with Clip */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img 
                src={getImageUrl(afterImage)} 
                alt="After" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Slider Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            
            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
              After
            </div>
          </>
        ) : (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <img 
              src={getImageUrl(showAfter ? afterImage : beforeImage)} 
              alt={showAfter ? "After" : "Before"} 
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {showAfter ? 'After' : 'Before'}
            </div>
          </motion.div>
        )}
      </div>
      
      {viewMode === 'slider' && (
        <div className="p-4">
          <Slider
            value={[sliderPosition]}
            onValueChange={([value]) => setSliderPosition(value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      )}
      
      {viewMode === 'toggle' && (
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAfter(!showAfter)}
          >
            {showAfter ? 'Show Original' : 'Show AI Result'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BeforeAfterPreview;