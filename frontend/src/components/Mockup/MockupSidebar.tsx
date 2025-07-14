
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentMockup, fetchUserMockups } from '@/store/slices/projectSlice';
import { Plus, Image, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface MockupSidebarProps {
  onNewMockup: () => void;
}

const MockupSidebar: React.FC<MockupSidebarProps> = ({ onNewMockup }) => {
  const dispatch = useAppDispatch();
  const { projects, currentProject } = useAppSelector((state) => state.project);

  const handleSelectMockup = (mockup: any) => {
    dispatch(setCurrentMockup(mockup));
  };
  useEffect(() => {
    dispatch(fetchUserMockups({
      page: 1,
      per_page: 20
    }))
  },[])

  return (
    <div className="h-full bg-background border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button
            onClick={onNewMockup}
            size="sm"
            className="bg-gradient-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3 h-full">
        {projects.length === 0 ? (
          <div className="text-center py-8">
            {/* <Image className="h-12 w-12 mx-auto text-gray-400 mb-3" /> */}
            <p className="text-sm text-muted-foreground">No mockups yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "New" to create your first mockup
            </p>
          </div>
        ) : (
          projects.map((mockup) => (
            <motion.div
              key={mockup.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card
                className={`p-2 cursor-pointer transition-all hover:shadow-md ${
                  currentProject?.id === mockup.id
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => handleSelectMockup(mockup)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                      {mockup.name}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MockupSidebar;
