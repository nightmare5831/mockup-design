import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { regenerateMockup, updateMockup, updateProject, uploadMockupImages, fetchMarkingTechniques } from '@/store/slices/projectSlice';
import { Settings, Sparkles, Image, Loader2, Upload, Palette, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import CustomImageEditor from '../ImageEditor/CustomImageEditor';
import AIPreviewModal from './AIPreviewModal';
import BeforeAfterPreview from './BeforeAfterPreview';
import { toast } from '@/components/ui/use-toast';


const ProjectEditor = () => {
  const API_UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5371';
  const dispatch = useAppDispatch();
  const { currentProject, mockupTechniques, loading } = useAppSelector((state) => state.project);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTechniqueChange = (technique: string) => {
    dispatch(updateProject({ marking_technique: technique }));
  };

  const handleTransformChange = useCallback((transform: any) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout to save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      if (currentProject) {
        try {
          // Use product-relative coordinates (x, y are already converted)
          await dispatch(updateMockup({
            id: currentProject.id,
            data: {
              logo_scale: transform.scale,
              logo_rotation: transform.rotation,
              marking_zone_x: transform.x,
              marking_zone_y: transform.y,
              marking_zone_w: currentProject.marking_zone_w,
              marking_zone_h: currentProject.marking_zone_h,
              marking_technique: currentProject.marking_technique,
              logo_opacity: transform.opacity,
            }
          })).unwrap();
          
          // Update local project state
          dispatch(updateProject({
            logo_scale: transform.scale,
            logo_rotation: transform.rotation,
            marking_zone_x: transform.x,
            marking_zone_y: transform.y,
            logo_opacity: transform.opacity,
          }));
        } catch (error: any) {
          console.error('Failed to save logo transform:', error);
          toast({
            title: "Save failed",
            description: error.message || "Failed to save logo changes.",
            variant: "destructive",
          });
        }
      }
    }, 1000); // 1 second delay
  }, [currentProject, dispatch]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    dispatch(fetchMarkingTechniques());
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dispatch]);

  // Memoize initialTransform to prevent re-renders
  // Must be before early return to maintain hooks order
  const initialTransform = useMemo(() => ({
    x: currentProject?.marking_zone_x || 200,
    y: currentProject?.marking_zone_y || 150,
    scale: currentProject?.logo_scale || 1,
    rotation: currentProject?.logo_rotation || 0,
    opacity: currentProject?.logo_opacity || 1,
    width: 0,
    height: 0,
  }), [
    currentProject?.marking_zone_x,
    currentProject?.marking_zone_y,
    currentProject?.logo_scale,
    currentProject?.logo_rotation,
    currentProject?.logo_opacity
  ]);
  // Early return after all hooks are defined
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Image className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">Select a mockup from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (file: File, type: 'products' | 'logos') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload the file
      const response = await dispatch(uploadMockupImages({ 
        mockupId: currentProject.id,
        image: file, 
        type 
      })).unwrap();

      // Update the project with the uploaded image URL
      if (type === 'products') {
        dispatch(updateProject({ 
          productImage: response.image_url 
        }));
        toast({
          title: "Product image uploaded",
          description: "Your product image has been uploaded successfully.",
        });
      } else {
        dispatch(updateProject({ 
          logoImage: response.image_url 
        }));
        toast({
          title: "Logo uploaded",
          description: "Your logo has been uploaded successfully.",
        });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || `Failed to upload ${type} image.`,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePreview = async () => {
    try {
      // Show loading toast
      toast({
        title: " Preview",
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing your mockup design...</span>
          </div>
        ),
        duration: 30000, // 30 seconds max duration
      });
      
      // Regenerate the mockup with current settings
      await dispatch(regenerateMockup({
        id: currentProject.id, 
        data: {
          logo_scale: currentProject.logo_scale,
          logo_rotation: currentProject.logo_rotation,
          logo_color: currentProject.logo_color,
          marking_zone_x: currentProject.marking_zone_x,
          marking_zone_y: currentProject.marking_zone_y,
          marking_zone_w: currentProject.marking_zone_w,
          marking_zone_h: currentProject.marking_zone_h,
          marking_technique: currentProject.marking_technique,
        }
      })).unwrap();
      
      // Success toast
      toast({
        title: "✨ Preview Ready!",
        description: "Your AI mockup preview has been generated successfully.",
        className: "bg-green-50 border-green-200",
      });
      
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error('Generate preview error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate preview.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPreview = () => {
    if (currentProject.result_image_url) {
      const imageUrl = API_UPLOAD_URL + currentProject.result_image_url;
      fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentProject.name}-mockup.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
  };
  // Progress steps
  const progressSteps = [
    { 
      id: 1, 
      label: 'Upload Product', 
      icon: Upload, 
      completed: !!currentProject.product_image_url 
    },
    { 
      id: 2, 
      label: 'Add Logo & Position', 
      icon: Palette, 
      completed: !!currentProject.logo_image_url 
    },
    { 
      id: 3, 
      label: 'Generate Preview', 
      icon: Sparkles, 
      completed: !!currentProject.result_image_url 
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid gap-6 p-6">
        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              {progressSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        step.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        step.completed ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </motion.div>
                    {index < progressSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                        progressSteps[index + 1].completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Preview and Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Image Editor */}
          <Card>
            <CardContent>
              <CustomImageEditor
                backgroundImage={currentProject.product_image_url}
                logoImage={currentProject.logo_image_url}
                resultImage={currentProject.result_image_url}
                onBackgroundUpload={(file) => handleImageUpload(file, 'products')}
                onLogoUpload={(file) => handleImageUpload(file, 'logos')}
                handleResultImage={()=>setShowPreviewModal(true)}
                onTransformChange={handleTransformChange}
                initialTransform={initialTransform}
                canvasWidth={800}
                canvasHeight={600}
              />
            </CardContent>
          </Card>

          {/* Technique Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Technique Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="technique">AI Technique</Label>
                  <Select value={currentProject.marking_technique || ""} onValueChange={handleTechniqueChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technique" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockupTechniques.map((technique) => (
                        <SelectItem key={technique?.name} value={technique?.name}>
                          {technique?.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Before/After Preview */}
          {(currentProject.product_image_url || currentProject.result_image_url) && (
            <BeforeAfterPreview
              beforeImage={currentProject.product_image_url}
              afterImage={currentProject.result_image_url}
            />
          )}

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="primary"
              onClick={handleGeneratePreview}
              className="w-full h-12 text-base font-medium relative overflow-hidden group"
              disabled={!currentProject.marking_technique || !currentProject.product_image_url || loading}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                animate={loading ? { x: ['0%', '100%'] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="relative flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    <span>Generating AI Preview...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    <span>Generate AI Preview</span>
                  </>
                )}
              </span>
            </Button>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-sm text-center text-muted-foreground"
              >
                This may take up to 30 seconds...
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* AI Preview Modal */}
      <AIPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        previewImage={currentProject.result_image_url}
        projectName={currentProject.name}
        technique={currentProject.marking_technique}
        onDownload={handleDownloadPreview}
        onEdit={() => setShowPreviewModal(false)}
      />
    </div>
  );
};

export default ProjectEditor;