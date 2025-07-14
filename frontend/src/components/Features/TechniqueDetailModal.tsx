import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Technique } from '@/types';

interface TechniqueDetailModalProps {
  technique: Technique | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TechniqueDetailModal = ({ technique, open, onOpenChange }: TechniqueDetailModalProps) => {
  if (!technique) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {technique.display_name.charAt(0)}
              </span>
            </div>
            <div>
              <span className="text-2xl font-heading">{technique.display_name}</span>
              {technique.premium_only && (
                <Badge variant="secondary" className="ml-3">
                  Premium
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <DialogDescription className="text-base">
              {technique.description}
            </DialogDescription>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Technical ID</h4>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {technique.name}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechniqueDetailModal;