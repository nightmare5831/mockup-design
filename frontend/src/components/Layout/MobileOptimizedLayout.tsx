import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  sidebarTitle?: string;
  showDevicePreview?: boolean;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  className,
  sidebarTitle = "Tools",
  showDevicePreview = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-close sidebar on mobile when clicking outside
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleClick = () => setSidebarOpen(false);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isMobile, sidebarOpen]);

  const deviceSizes = {
    mobile: { width: '375px', height: '667px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '100%' }
  };

  const DevicePreviewControls = () => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium">Preview:</span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <Button
          size="sm"
          variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
          onClick={() => setPreviewDevice('mobile')}
          className="px-2"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
          onClick={() => setPreviewDevice('tablet')}
          className="px-2"
        >
          <Tablet className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
          onClick={() => setPreviewDevice('desktop')}
          className="px-2"
        >
          <Monitor className="w-4 h-4" />
        </Button>
      </div>
      <Badge variant="outline">
        {previewDevice === 'mobile' && '375×667'}
        {previewDevice === 'tablet' && '768×1024'}
        {previewDevice === 'desktop' && 'Full'}
      </Badge>
    </div>
  );

  // Mobile sidebar component
  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-900 shadow-lg"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{sidebarTitle}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-120px)]">
            {sidebar}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop sidebar component
  const DesktopSidebar = () => (
    <div className="hidden md:flex flex-col w-80 bg-gray-50 dark:bg-gray-900 border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{sidebarTitle}</h2>
        <ScrollArea className="h-[calc(100vh-160px)]">
          {sidebar}
        </ScrollArea>
      </div>
    </div>
  );

  // Responsive grid layout for mobile
  const ResponsiveGrid = ({ children }: { children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <div className="grid grid-cols-1 gap-4 p-4">
          {React.Children.map(children, (child, index) => (
            <div key={index} className="w-full">
              {child}
            </div>
          ))}
        </div>
      );
    }
    
    if (isTablet) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {children}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-8">
        {children}
      </div>
    );
  };

  // Touch-friendly button sizes
  const TouchButton = ({ children, className, ...props }: any) => (
    <Button
      className={cn(
        isMobile ? "min-h-[44px] px-4" : "",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("flex flex-col min-h-screen", className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b">
          {showDevicePreview && !isMobile && (
            <div className="border-b bg-gray-50 dark:bg-gray-800 px-4 py-2">
              <DevicePreviewControls />
            </div>
          )}
          <div className="px-4 lg:px-6">
            {header}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar */}
        {sidebar && <MobileSidebar />}
        
        {/* Desktop Sidebar */}
        {sidebar && <DesktopSidebar />}
        
        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 overflow-auto",
            showDevicePreview && previewDevice !== 'desktop' && !isMobile
              ? "flex items-center justify-center bg-gray-100 dark:bg-gray-800"
              : ""
          )}
        >
          {showDevicePreview && previewDevice !== 'desktop' && !isMobile ? (
            <div 
              className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg overflow-hidden"
              style={{
                width: deviceSizes[previewDevice].width,
                height: deviceSizes[previewDevice].height,
                maxWidth: '90vw',
                maxHeight: '90vh'
              }}
            >
              <div className="h-full overflow-auto">
                {children}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t bg-white dark:bg-gray-900">
          <div className="px-4 lg:px-6">
            {footer}
          </div>
        </footer>
      )}

      {/* Mobile Navigation Helper */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ChevronLeft className="w-4 h-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile-specific styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Prevent zoom on input focus */
          input, select, textarea {
            font-size: 16px !important;
          }
          
          /* Improve touch targets */
          button, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Better scrolling on iOS */
          .scroll-smooth {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Hide horizontal scroll */
          body {
            overflow-x: hidden;
          }
        }
        
        @media (max-width: 480px) {
          /* Even smaller screens */
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for responsive utilities
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

// Mobile-specific component wrapper
export const MobileContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { isMobile } = useResponsive();
  
  return (
    <div 
      className={cn(
        "w-full",
        isMobile ? "px-4 py-2" : "px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
};

// Touch-friendly form inputs
export const TouchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const { isMobile } = useResponsive();
  
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-gray-300 px-3 py-2",
        isMobile ? "min-h-[44px] text-base" : "h-10 text-sm",
        props.className
      )}
    />
  );
};