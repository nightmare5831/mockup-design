
import React, { useState } from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import MockupSidebar from '@/components/Mockup/MockupSidebar';
import NewMockupModal from '@/components/Mockup/NewMockupModal';
import ProjectEditor from '@/components/Mockup/ProjectEditor';
import { useAppSelector } from '@/store/hooks';

const Mockup = () => {
  const { currentProject } = useAppSelector((state) => state.project);
  const [showNewMockupModal, setShowNewMockupModal] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] flex-1">
        {/* Sidebar */}
        <MockupSidebar onNewMockup={() => setShowNewMockupModal(true)} />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-heading font-bold mb-2">
              {currentProject ? currentProject.name : 'Create Mockup'}
            </h1>
            <p className="text-muted-foreground">
              {currentProject 
                ? 'Edit your mockup with AI-powered tools and image editing'
                : 'Select a mockup from the sidebar or create a new one to get started'
              }
            </p>
          </div>
          <ProjectEditor/>
        </main>
      </div>

      <Footer />

      {/* New Mockup Modal */}
      <NewMockupModal
        open={showNewMockupModal}
        onOpenChange={setShowNewMockupModal}
      />
    </div>
  );
};

export default Mockup;
