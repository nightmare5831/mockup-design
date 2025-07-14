
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setShowAuthModal, setShowPricingModal } from '@/store/slices/uiSlice';
import { logout, verifyToken } from '@/store/slices/userSlice';
import { Zap, User, LogOut, Sparkles, FolderOpen, Settings, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.user);

  useEffect(() => {
    // Check for existing JWT token and verify it
    const token = localStorage.getItem("access_token");
    if (token && !isAuthenticated) {
      dispatch(verifyToken());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogin = () => {
    dispatch(setShowAuthModal(true));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handlePricing = () => {
    dispatch(setShowPricingModal(true));
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              MockupAI
            </span>
          </motion.div>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" onClick={()=>navigate('/features')}>Features</Button>
          <Button variant="ghost">Gallery</Button>
          {isAuthenticated && (
            <>
              <Button variant="ghost" onClick={() => navigate('/mockup')}>
                Generate
              </Button>
              <Button variant="ghost" onClick={()=> navigate('/subscription')}>Subscription</Button>
              <Button variant="ghost" onClick={() => navigate('/projects')}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects
              </Button>
              <Button variant="ghost" onClick={() => navigate('/credits')}>
                <Zap className="h-4 w-4 mr-2" />
                Credits
              </Button>
              {user?.role === 'ADMIN' && (
                <Button variant="ghost" onClick={() => navigate('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <Badge 
                variant="primary" 
                className="cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900 transition-all duration-200 font-semibold shadow-sm"
                onClick={() => navigate('/account/subscription')}
              >
                <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                {user.credits} credits
              </Badge>
              <Badge 
                variant="outline" 
                className="capitalize cursor-pointer transition-all duration-200 font-medium"
                onClick={() => navigate('/account/subscription')}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {user.plan}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={handleLogin} disabled={loading}>
                <User className="h-4 w-4 mr-2" />
                {loading ? 'Loading...' : 'Login'}
              </Button>
              <Button 
                variant="primary"
                onClick={handleLogin}
                disabled={loading}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
