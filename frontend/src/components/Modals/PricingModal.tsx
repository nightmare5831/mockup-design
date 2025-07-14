
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setShowPricingModal, setShowAuthModal } from '@/store/slices/uiSlice';
import { Check, Zap, Crown, Rocket } from 'lucide-react';

const PricingModal = () => {
  const dispatch = useAppDispatch();
  const { showPricingModal } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.user);

  const plans = [
    {
      name: 'Basic',
      price: '€9',
      period: '/month',
      icon: Zap,
      features: [
        '10 mockups/month',
        'Standard techniques',
        'PNG/JPG export',
        'Email support'
      ]
    },
    {
      name: 'Pro',
      price: '€29',
      period: '/month',
      icon: Crown,
      features: [
        '30 mockups/month',
        'All techniques',
        'PDF export with specs',
        'Priority queue',
        'Advanced editor',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Premium',
      price: '€79',
      period: '/month',
      icon: Rocket,
      features: [
        '100 mockups/month',
        'All techniques',
        'Bulk processing',
        'API access',
        'Custom branding',
        'Dedicated support'
      ]
    }
  ];

  const handleClose = () => {
    dispatch(setShowPricingModal(false));
  };

  const handleSelectPlan = (planName: string) => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      handleClose();
    } else {
      handleClose();
      // Navigate to subscription page
      window.location.href = '/subscription';
    }
  };

  return (
    <Dialog open={showPricingModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                  <plan.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm text-muted-foreground font-normal">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
