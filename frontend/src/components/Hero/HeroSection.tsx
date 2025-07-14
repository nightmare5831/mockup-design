import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, Upload, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/mockup');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="relative py-10 lg:py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-primary opacity-10 rounded-full animate-float" />
      <div className="absolute top-40 right-20 w-16 h-16 bg-accent opacity-20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary opacity-15 rounded-full animate-float" style={{ animationDelay: '4s' }} />

      <div className="container">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <Badge className="bg-accent mb-6" variant='outline'>
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Mockup Generation
          </Badge>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight"
          >
            Create{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Stunning
            </span>{' '}
            Product Mockups in Seconds
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Upload your product and logo, select a marking technique, and watch AI generate 
            photorealistic mockups with advanced texture simulation. Perfect for promotional 
            products and branding visualization.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 h-auto animate-glow"
            >
              Start Creating
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
              View Gallery
            </Button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          >
            {[
              {
                icon: Upload,
                title: "Upload & Position",
                description: "Drag and drop your product and logo images, then define the marking zone"
              },
              {
                icon: Palette,
                title: "Choose Technique",
                description: "Select from 18+ marking techniques like embroidery, laser, or screen printing"
              },
              {
                icon: Zap,
                title: "AI Generation",
                description: "Our AI creates photorealistic mockups with texture-aware rendering"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
