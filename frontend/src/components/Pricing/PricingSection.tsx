
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch } from '@/store/hooks';
import { setShowAuthModal } from '@/store/slices/uiSlice';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingSection = () => {
  const dispatch = useAppDispatch();

  const plans = [
    {
      name: 'Basic',
      price: '€9',
      period: '/month',
      description: 'Perfect for small businesses',
      icon: Zap,
      features: [
        '10 mockups/month',
        'Standard techniques',
        'PNG/JPG export',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '€29',
      period: '/month',
      description: 'Most popular for agencies',
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
      description: 'For high-volume users',
      icon: Rocket,
      features: [
        '100 mockups/month',
        'All techniques',
        'Bulk processing',
        'API access',
        'Custom branding',
        'Dedicated support'
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planName: string) => {
    dispatch(setShowAuthModal(true));
  };

  return (
    <section className="py-10">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with our free plan or upgrade for more credits and premium features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg text-muted-foreground font-normal">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
