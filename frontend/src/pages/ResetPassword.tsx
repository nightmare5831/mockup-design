import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { legacyAuthApi } from '@/service/api';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast({
          title: "Invalid Link",
          description: "Password reset link is invalid or expired.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        await legacyAuthApi.verifyResetToken(token);
        setVerifying(false);
      } catch (error) {
        toast({
          title: "Invalid Link",
          description: "Password reset token is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!token) return;

    setLoading(true);
    
    try {
      await legacyAuthApi.resetPassword(token, password);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error?.message || "Failed to reset password. The link may be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle>Verifying Reset Link</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-600 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={8}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;