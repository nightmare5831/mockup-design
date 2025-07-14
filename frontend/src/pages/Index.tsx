
import React from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import HeroSection from '@/components/Hero/HeroSection';
import TechniquesShowcase from '@/components/Features/TechniquesShowcase';
import PricingSection from '@/components/Pricing/PricingSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TechniquesShowcase />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
