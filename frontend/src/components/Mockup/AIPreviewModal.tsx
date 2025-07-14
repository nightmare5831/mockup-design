
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Edit, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5371';
interface AIPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewImage?: string;
  projectName?: string;
  technique?: string;
  onDownload?: () => void;
  onEdit?: () => void;
}

const AIPreviewModal: React.FC<AIPreviewModalProps> = ({
  open,
  onOpenChange,
  previewImage,
  projectName,
  technique,
  onDownload,
  onEdit
}) => {
  console.log(previewImage)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Generated Preview
            </DialogTitle>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Generated Successfully
              </Badge>
            </motion.div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {previewImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg"
            >
              <img
                src={API_UPLOAD_URL + previewImage}
                alt="AI Generated Mockup"
                className="w-full h-full object-contain"
              />
            </motion.div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-muted-foreground">No preview available</p>
              </div>
            </div>
          )}

          {(projectName || technique) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg"
            >
              {projectName && (
                <div>
                  <span className="font-medium text-foreground/80">Project:</span>
                  <p className="text-foreground mt-1">{projectName}</p>
                </div>
              )}
              {technique && (
                <div>
                  <span className="font-medium text-foreground/80">Technique Applied:</span>
                  <p className="text-foreground mt-1">{technique.replace(/_/g, ' ')}</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg"
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ✨ Your AI-powered mockup is ready! The logo has been seamlessly integrated with the product using advanced AI techniques.
            </p>
          </motion.div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit More
          </Button>
          <Button onClick={onDownload} className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIPreviewModal;
