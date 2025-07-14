import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Zap, Star, ShoppingCart, AlertCircle } from 'lucide-react';
import { creditsApi } from '@/service/api/creditsApi';
import { CreditPackage, CreditBalance } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import CreditPurchaseModal from '@/components/Credits/CreditPurchaseModal';

const Credits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        creditsApi.setToken(token);
      }
      
      const [packagesResponse, balanceResponse] = await Promise.all([
        creditsApi.getCreditPackages(),
        creditsApi.getCreditBalance()
      ]);
      
      setPackages(packagesResponse.packages);
      setCreditBalance(balanceResponse);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load credit packages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    fetchData(); // Refresh credit balance
    setShowPurchaseModal(false);
    setSelectedPackage(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getPricePerCredit = (pkg: CreditPackage) => {
    return pkg.price / pkg.amount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">Loading credit packages...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Credit Packages</h1>
            <p className="text-lg text-muted-foreground">
              Purchase credits to generate more amazing mockups
            </p>
          </div>

          {/* Current Balance */}
          {creditBalance && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-primary" />
                      Your Credit Balance
                    </CardTitle>
                    <CardDescription>
                      Credits available for mockup generation
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/credits/history')}
                  >
                    View History
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {creditBalance.remaining_credits}
                    </div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{creditBalance.used_credits}</div>
                    <div className="text-sm text-muted-foreground">Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{creditBalance.total_credits}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {creditBalance.expiring_soon}
                    </div>
                    <div className="text-sm text-muted-foreground">Expiring Soon</div>
                  </div>
                </div>

                {creditBalance.expiring_soon > 0 && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have {creditBalance.expiring_soon} credits expiring 
                      {creditBalance.next_expiry_date && 
                        ` on ${new Date(creditBalance.next_expiry_date).toLocaleDateString()}`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.amount}
                className={`relative transition-all hover:shadow-lg cursor-pointer ${
                  pkg.popular ? 'border-primary shadow-md ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{pkg.amount} Credits</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatPrice(pkg.price)}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {formatPrice(getPricePerCredit(pkg))} per credit
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">{pkg.amount} mockup generations</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Credits never expire</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">All marking techniques</span>
                    </div>
                    {pkg.amount >= 50 && (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm">Priority processing</span>
                      </div>
                    )}
                  </div>

                  {pkg.savings_percentage && pkg.savings_percentage > 0 && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="w-full justify-center">
                        Save {Math.round(pkg.savings_percentage)}%
                      </Badge>
                    </div>
                  )}

                  <Button 
                    className={`w-full ${
                      pkg.popular 
                        ? 'bg-gradient-primary hover:opacity-90' 
                        : ''
                    }`}
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Alert className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Need help choosing? Our Basic package is perfect for getting started, 
                while the Popular package offers the best value for regular users.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>

      {selectedPackage && (
        <CreditPurchaseModal
          open={showPurchaseModal}
          onOpenChange={setShowPurchaseModal}
          creditPackage={selectedPackage}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      <Footer />
    </div>
  );
};

export default Credits;