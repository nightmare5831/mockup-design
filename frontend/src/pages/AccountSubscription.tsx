import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Download,
  Crown
} from 'lucide-react';
import { subscriptionsApi } from '@/service/api/subscriptionsApi';
import { SubscriptionUsage, SubscriptionStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import AddPaymentMethodModal from '@/components/Payment/AddPaymentMethodModal';
import { format } from 'date-fns';

const AccountSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    fetchSubscriptionData();
    fetchPaymentMethods();
    fetchInvoices();
  }, [isAuthenticated, navigate]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      const data = await subscriptionsApi.getCurrentSubscription();
      setSubscriptionData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      const response = await subscriptionsApi.getPaymentMethods();
      setPaymentMethods(response.payment_methods || []);
    } catch (error) {
      console.error('Failed to fetch payment methods');
      setPaymentMethods([]);
    }
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      const response = await subscriptionsApi.getPaymentHistory();
      setInvoices(response.payments || []);
    } catch (error) {
      console.error('Failed to fetch invoices');
      setInvoices([]);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setCancelLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      const response = await subscriptionsApi.cancelSubscription({
        reason: 'User requested cancellation',
      });
      
      toast({
        title: 'Subscription Cancelled',
        description: response.message,
      });
      
      fetchSubscriptionData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate('/subscription');
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      await subscriptionsApi.deletePaymentMethod(paymentMethodId);
      
      toast({
        title: 'Success',
        description: 'Payment method deleted successfully',
      });
      
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      
      await subscriptionsApi.reactivateSubscription();
      
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated successfully',
      });
      
      fetchSubscriptionData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants: Record<SubscriptionStatus, { variant: any; label: string }> = {
      [SubscriptionStatus.ACTIVE]: { variant: 'default', label: 'Active' },
      [SubscriptionStatus.CANCELLED]: { variant: 'secondary', label: 'Cancelled' },
      [SubscriptionStatus.EXPIRED]: { variant: 'destructive', label: 'Expired' },
      [SubscriptionStatus.INACTIVE]: { variant: 'outline', label: 'Inactive' },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">Loading subscription data...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">No Active Subscription</h1>
            <p className="text-muted-foreground mb-8">
              Subscribe to unlock premium features and monthly credits
            </p>
            <Button onClick={() => navigate('/subscription')} size="lg">
              View Plans
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const creditsPercentage = 
    (subscriptionData.credits_used_this_period / 
    (subscriptionData.credits_used_this_period + subscriptionData.credits_remaining)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
            <p className="text-muted-foreground">
              Manage your subscription, billing, and usage
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{subscriptionData.subscription.plan} Plan</CardTitle>
                    <CardDescription>
                      Your current subscription plan
                    </CardDescription>
                  </div>
                  {getStatusBadge(subscriptionData.subscription.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Credits Used This Month</span>
                        <span className="text-sm text-muted-foreground">
                          {subscriptionData.credits_used_this_period} / {subscriptionData.credits_used_this_period + subscriptionData.credits_remaining}
                        </span>
                      </div>
                      <Progress value={creditsPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {subscriptionData.credits_remaining} credits remaining
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Renews on {format(new Date(subscriptionData.subscription.current_period_end), 'MMMM d, yyyy')}</span>
                    </div>

                    {subscriptionData.auto_renew && (
                      <div className="flex items-center space-x-2 text-sm">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <span>Auto-renewal enabled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center space-y-3">
                    <Button 
                      onClick={handleUpgradePlan}
                      className="w-full"
                      variant="outline"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                    
                    {subscriptionData.subscription.status === SubscriptionStatus.ACTIVE && (
                      <Button
                        onClick={handleCancelSubscription}
                        variant="destructive"
                        className="w-full"
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {subscriptionData.subscription.status === SubscriptionStatus.CANCELLED && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Your subscription has been cancelled and will expire on{' '}
                    {format(new Date(subscriptionData.subscription.current_period_end), 'MMMM d, yyyy')}.
                    You can continue using your credits until then.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleReactivateSubscription}
                    className="ml-4"
                  >
                    Reactivate
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {subscriptionData.subscription.status === SubscriptionStatus.INACTIVE && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-800">
                      Your subscription payment is being processed. Once confirmed, your subscription will be activated and you'll receive your monthly credits.
                    </span>
                    <Button 
                      size="sm" 
                      onClick={fetchSubscriptionData}
                      variant="outline"
                      className="ml-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Tabs defaultValue="payment" className="space-y-4">
            <TabsList>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="billing">Billing History</TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No payment methods on file
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">•••• {method.card?.last4 || '****'}</p>
                              <p className="text-sm text-muted-foreground">
                                Expires {method.card?.exp_month || '**'}/{method.card?.exp_year || '**'}
                              </p>
                              {method.card?.brand && (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {method.card.brand}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => setShowAddPaymentModal(true)}
                  >
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No billing history available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {invoices.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">€{payment.amount || 0}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              Status: {payment.status?.toLowerCase() || 'unknown'}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddPaymentMethodModal
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
        onSuccess={fetchPaymentMethods}
      />

      <Footer />
    </div>
  );
};

export default AccountSubscription;