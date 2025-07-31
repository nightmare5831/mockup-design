
import { useEffect, useState } from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentMockup, deleteMockup, fetchUserMockups } from '@/store/slices/projectSlice';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Trash2, Edit, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import NewMockupModal from "@/components/Mockup/NewMockupModal";
import { toast } from '@/components/ui/use-toast';
import { getImageUrl } from '@/utils/imageUrl';
import { mockupsApi } from '@/service/api';

const Projects = () => {
  const [showNewMockupModal, setShowNewMockupModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.project);
  const [newFlag, setNewFlag] = useState(false);
  const handleCreateNew = () => {
    setShowNewMockupModal(true);
    setNewFlag(true);
  };

  const handleOpenProject = (project: any) => {
    dispatch(setCurrentMockup(project));
    navigate('/mockup');
  };

  const handleDeleteProject = (projectId: string) => {
    try {
      dispatch(deleteMockup(projectId)).unwrap();
      toast({
        title: "Product deleted",
        description: "Your product has been deleted successfully.",
      });
    } catch (error) {
      
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('Auth token present:', !!token);
    
    if (token) {
      mockupsApi.setToken(token);
    }
    
    dispatch(fetchUserMockups({
      page: 1,
      per_page: 20
    })).unwrap()
      .then((data) => {
        console.log('Mockups fetched successfully:', data);
      })
      .catch((error) => {
        console.error('Failed to fetch mockups:', error);
        
        let errorMessage = "Please check your connection and try again.";
        if (error.includes('Network Error') || error.includes('ERR_NETWORK')) {
          errorMessage = "Unable to connect to the server. Please ensure the backend is running.";
        } else if (error.includes('401') || error.includes('Unauthorized')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.includes('500')) {
          errorMessage = "Server error. Please try again later.";
        }
        
        toast({
          title: "Failed to load projects",
          description: error || errorMessage,
          variant: "destructive"
        });
      });
  }, [])
  useEffect(() => {
    if (newFlag && !showNewMockupModal) {
      setNewFlag(false);
      dispatch(setCurrentMockup(projects[0]));
      navigate('/mockup');
    }
  },[newFlag, showNewMockupModal])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage your mockup projects</p>
          </div>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            {projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Folder className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Create your first mockup project to get started</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                          {project.result_image_url ? (
                            <img
                              src={getImageUrl(project.result_image_url)}
                              alt={project.name}
                              className="w-full h-full object-contain"
                            />
                          ) : project.product_image_url ? (
                            <img
                              src={getImageUrl(project.product_image_url)}
                              alt={project.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Folder className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className='flex justify-between flex-col md:flex-row gap-6'>
                            { project.marking_technique && (
                              <div>
                                <Badge variant="outline">{project.marking_technique}</Badge>
                              </div>
                            )}
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(project.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOpenProject(project)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <NewMockupModal
        open={showNewMockupModal}
        onOpenChange={setShowNewMockupModal}
      />
      <Footer />
    </div>
  );
};

export default Projects;
