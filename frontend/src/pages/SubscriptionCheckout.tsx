import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { subscriptionsApi } from '@/service/api/subscriptionsApi';
import { SubscriptionPlan } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import StripeElements from '@/components/Payment/StripeElements';

interface LocationState {
  plan: SubscriptionPlan;
}

const SubscriptionCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  
  const selectedPlan = (location.state as LocationState)?.plan;

  useEffect(() => {
    if (!isAuthenticated || !selectedPlan) {
      navigate('/subscription');
      return;
    }

    createSetupIntent();
  }, [isAuthenticated, selectedPlan, navigate]);

  const createSetupIntent = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      const response = await subscriptionsApi.createSetupIntent();
      setSetupClientSecret(response.client_secret);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize payment setup',
        variant: 'destructive',
      });
    }
  };

  const getPlanDetails = () => {
    switch (selectedPlan) {
      case SubscriptionPlan.BASIC:
        return { name: 'Basic', price: 9, credits: 10 };
      case SubscriptionPlan.PRO:
        return { name: 'Pro', price: 29, credits: 30 };
      case SubscriptionPlan.PREMIUM:
        return { name: 'Premium', price: 79, credits: 100 };
      default:
        return { name: '', price: 0, credits: 0 };
    }
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        subscriptionsApi.setToken(token);
      }
      
      const subscriptionResponse = await subscriptionsApi.createSubscription({
        plan: selectedPlan,
        payment_method_id: paymentMethodId,
      });

      // Check if subscription needs payment confirmation
      if (subscriptionResponse.client_secret) {
        // Subscription was created but needs payment confirmation
        await handlePaymentConfirmation(subscriptionResponse.client_secret);
      } else if (subscriptionResponse.status === 'ACTIVE') {
        // Subscription is already active
        toast({
          title: 'Success!',
          description: 'Your subscription has been activated',
        });
        navigate('/account/subscription');
      } else {
        // Subscription is pending - show appropriate message
        toast({
          title: 'Subscription Created',
          description: 'Your subscription is being processed. You will receive an email confirmation shortly.',
        });
        navigate('/account/subscription');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmation = async (clientSecret: string) => {
    try {
      setConfirmingPayment(true);
      
      const stripe = await (await import('@stripe/stripe-js')).loadStripe(
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      );
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Confirm the payment intent
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
      
      if (error) {
        throw new Error(error.message || 'Payment confirmation failed');
      }
      
      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: 'Success!',
          description: 'Your subscription has been activated',
        });
        navigate('/account/subscription');
      } else {
        toast({
          title: 'Payment Processing',
          description: 'Your payment is being processed. You will receive an email confirmation shortly.',
        });
        navigate('/account/subscription');
      }
    } finally {
      setConfirmingPayment(false);
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
            <p className="text-muted-foreground">
              You're subscribing to the {planDetails.name} plan
            </p>
          </div>

          {confirmingPayment && (
            <div className="mb-8">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Confirming your payment... Please do not close this page.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <StripeElements
              onPaymentSuccess={handlePaymentSuccess}
              loading={loading || confirmingPayment}
              buttonText={
                confirmingPayment 
                  ? 'Confirming Payment...' 
                  : `Subscribe for €${planDetails.price}/month`
              }
            />

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>{planDetails.name} Plan</span>
                      <span className="font-medium">€{planDetails.price}/month</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Credits per month</span>
                      <span>{planDetails.credits}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>€{planDetails.price}/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✓ Instant access to all features</p>
                  <p>✓ Monthly credits refresh automatically</p>
                  <p>✓ Cancel anytime, no questions asked</p>
                  <p>✓ 7-day free trial included</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By subscribing, you agree to our{' '}
              <a href="/terms" className="underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;