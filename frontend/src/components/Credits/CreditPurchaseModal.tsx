import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Zap } from 'lucide-react';
import { creditsApi } from '@/service/api/creditsApi';
import { CreditPackage } from '@/types';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { refreshCredits } from '@/store/slices/userSlice';
import { useToast } from '@/components/ui/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditPackage: CreditPackage;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<{
  creditPackage: CreditPackage;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ creditPackage, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || processing || submittedOnce) {
      if (!stripe || !elements) {
        setError('Payment system not ready. Please try again.');
      }
      return;
    }

    setProcessing(true);
    setSubmittedOnce(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Failed to create payment method');
        setProcessing(false);
        return;
      }

      // Purchase credits
      const token = localStorage.getItem("access_token");
      if (token) {
        creditsApi.setToken(token);
      }

      const purchaseResponse = await creditsApi.purchaseCredits({
        amount: creditPackage.amount,
        payment_method_id: paymentMethod.id,
      });

      // Confirm payment intent
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        purchaseResponse.client_secret
      );

      if (confirmError) {
        // Handle case where payment intent has already succeeded
        if (confirmError.code === 'payment_intent_unexpected_state' && 
            confirmError.payment_intent?.status === 'succeeded') {
          // Payment already succeeded, treat as success
          dispatch(refreshCredits());
          
          toast({
            title: 'Purchase Successful!',
            description: `${creditPackage.amount} credits have been added to your account`,
          });
          onSuccess();
          onClose();
        } else {
          setError(confirmError.message || 'Payment failed');
        }
      } else {
        // Payment succeeded normally
        dispatch(refreshCredits());
        
        toast({
          title: 'Purchase Successful!',
          description: `${creditPackage.amount} credits have been added to your account`,
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setSubmittedOnce(false); // Allow retry on error
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your payment information is secure and encrypted with Stripe
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!stripe || processing || submittedOnce}
            >
              {processing ? 'Processing...' : `Pay ${formatPrice(creditPackage.price)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>{creditPackage.amount} Credits</span>
                </div>
                <span className="font-medium">{formatPrice(creditPackage.price)}</span>
              </div>
              
              {creditPackage.savings_percentage && creditPackage.savings_percentage > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Savings</span>
                  <span>{Math.round(creditPackage.savings_percentage)}% off</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(creditPackage.price)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>• Credits never expire</p>
                <p>• Instant activation</p>
                <p>• Use for any mockup generation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What You Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ {creditPackage.amount} mockup generations</p>
            <p>✓ All marking techniques available</p>
            <p>✓ High-quality PNG/JPG exports</p>
            <p>✓ Priority processing queue</p>
            {creditPackage.amount >= 50 && (
              <p>✓ Bulk processing discounts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  open,
  onOpenChange,
  creditPackage,
  onSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Purchase {creditPackage.amount} Credits</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Elements stripe={stripePromise}>
            <CheckoutForm
              creditPackage={creditPackage}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </Elements>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            By purchasing, you agree to our{' '}
            <a href="/terms" className="underline">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;