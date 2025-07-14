import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, ShoppingCart, History, AlertCircle } from 'lucide-react';
import { creditsApi } from '@/service/api/creditsApi';
import { CreditBalance } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';

interface CreditBalanceWidgetProps {
  className?: string;
  showPurchaseButton?: boolean;
  showHistoryButton?: boolean;
  compact?: boolean;
}

const CreditBalanceWidget: React.FC<CreditBalanceWidgetProps> = ({
  className = '',
  showPurchaseButton = true,
  showHistoryButton = true,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditBalance();
    }
  }, [isAuthenticated]);

  const fetchCreditBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        creditsApi.setToken(token);
      }
      const balance = await creditsApi.getCreditBalance();
      setCreditBalance(balance);
    } catch (error) {
      console.error('Failed to fetch credit balance');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  if (!creditBalance) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Unable to load credit balance
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = creditBalance.total_credits > 0 
    ? (creditBalance.used_credits / creditBalance.total_credits) * 100 
    : 0;

  const isLowCredits = creditBalance.remaining_credits <= 5;

  if (compact) {
    return (
      <Card className={`${className} ${isLowCredits ? 'border-orange-200 bg-orange-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{creditBalance.remaining_credits} Credits</div>
                <div className="text-sm text-muted-foreground">
                  {creditBalance.used_credits} of {creditBalance.total_credits} used
                </div>
              </div>
            </div>
            {isLowCredits && (
              <Button size="sm" onClick={() => navigate('/credits')}>
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Credit Balance</span>
          </CardTitle>
          <div className="flex space-x-2">
            {showHistoryButton && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/credits/history')}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            {showPurchaseButton && (
              <Button 
                size="sm"
                onClick={() => navigate('/credits')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Balance Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {creditBalance.remaining_credits}
            </div>
            <div className="text-sm text-muted-foreground">
              Credits Available
            </div>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{creditBalance.used_credits} / {creditBalance.total_credits}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{creditBalance.total_credits}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{creditBalance.used_credits}</div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600">
                {creditBalance.expiring_soon}
              </div>
              <div className="text-xs text-muted-foreground">Expiring</div>
            </div>
          </div>

          {/* Low Credits Warning */}
          {isLowCredits && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're running low on credits. Purchase more to continue generating mockups.
              </AlertDescription>
            </Alert>
          )}

          {/* Expiring Credits Warning */}
          {creditBalance.expiring_soon > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {creditBalance.expiring_soon} credits expiring soon
                {creditBalance.next_expiry_date && 
                  ` on ${new Date(creditBalance.next_expiry_date).toLocaleDateString()}`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditBalanceWidget;