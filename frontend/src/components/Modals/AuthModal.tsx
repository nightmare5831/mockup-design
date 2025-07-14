
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setShowAuthModal } from '@/store/slices/uiSlice';
import { loginUser, registerUser, verifyToken } from '@/store/slices/userSlice';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AuthModal = () => {
  const dispatch = useAppDispatch();
  const { showAuthModal } = useAppSelector((state) => state.ui);
  const { loading, error } = useAppSelector((state) => state.user);

  const handleClose = () => {
    dispatch(setShowAuthModal(false));
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await dispatch(loginUser({ email, password }));
      
      if (loginUser.fulfilled.match(result)) {
        dispatch(verifyToken())
        // toast({
        //   title: "Success",
        //   description: "Welcome back! You have 10 free credits to get started.",
        // });
        handleClose();
      } else {
        toast({
          title: "Error",
          description: result.payload as string,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      const nameParts = name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      
      const result = await dispatch(registerUser({ 
        email, 
        password, 
        firstName, 
        lastName 
      }));
      
      if (registerUser.fulfilled.match(result)) {
        toast({
          title: "Success",
          description: "Account created successfully! You have 10 free credits to get started.",
        });
        handleClose();
      } else {
        toast({
          title: "Error",
          description: result.payload as string,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center">Welcome to MockupAI</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <LoginForm onSubmit={handleLogin} isLoading={loading} />
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <RegisterForm onSubmit={handleRegister} isLoading={loading} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const LoginForm = ({ onSubmit, isLoading }: { onSubmit: (email: string, password: string) => void; isLoading: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
};

const RegisterForm = ({ onSubmit, isLoading }: { onSubmit: (email: string, password: string, name: string) => void; isLoading: boolean }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
};

export default AuthModal;
