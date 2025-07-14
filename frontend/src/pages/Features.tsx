import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import TechniquesShowcase from '@/components/Features/TechniquesShowcase';

const Features = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <TechniquesShowcase/>
      <Footer />
    </div>
  );
};

export default Features;
