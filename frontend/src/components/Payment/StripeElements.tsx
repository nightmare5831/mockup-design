import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Lock } from 'lucide-react';
import { subscriptionsApi } from '@/service/api/subscriptionsApi';
import { useAppSelector } from '@/store/hooks';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface StripeElementsProps {
  onPaymentSuccess: (paymentMethodId: string) => void;
  loading?: boolean;
  buttonText?: string;
}

const CheckoutForm: React.FC<StripeElementsProps> = ({
  onPaymentSuccess,
  loading = false,
  buttonText = 'Complete Payment',
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create setup intent when component mounts
    const createSetupIntent = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          subscriptionsApi.setToken(token);
        }
        const response = await subscriptionsApi.createSetupIntent();
        setClientSecret(response.client_secret);
      } catch (err) {
        setError('Failed to initialize payment setup');
      }
    };

    createSetupIntent();
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Confirm the setup intent with the card element
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else if (setupIntent?.payment_method) {
        // Payment method created successfully
        onPaymentSuccess(typeof setupIntent.payment_method === 'string' 
          ? setupIntent.payment_method 
          : setupIntent.payment_method.id);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
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
            disabled={!stripe || loading || processing || !clientSecret}
          >
            {processing ? 'Processing...' : buttonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const StripeElements: React.FC<StripeElementsProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripeElements;