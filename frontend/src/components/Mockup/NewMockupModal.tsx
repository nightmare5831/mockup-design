
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createMockup } from '@/store/slices/projectSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
interface NewMockupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewMockupModal: React.FC<NewMockupModalProps> = ({ open, onOpenChange }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    technique: '',
  });

  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);

    try {
      const newProject = {
        name: formData.name,
        technique: 'SERIGRAFIA'
      };

      await dispatch(createMockup(newProject)).unwrap();
      
      // Reset form
      setFormData({ name: '', technique: 'SERIGRAFIA' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating mockup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Mockup</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Mockup Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter mockup name"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              className='w-full bg-secondary'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className='w-full bg-gradient-primary' disabled={isLoading || !formData.name.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Mockup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMockupModal;
