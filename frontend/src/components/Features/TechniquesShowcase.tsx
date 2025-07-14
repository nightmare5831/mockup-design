
import { Card, CardContent} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Technique } from '@/types';
import TechniqueDetailModal from './TechniqueDetailModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchMarkingTechniques } from '@/store/slices/projectSlice';

const TechniquesShowcase = () => {
  const dispatch = useAppDispatch();
  const { mockupTechniques } = useAppSelector((state) => state.project);
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  useEffect(() => {
    dispatch(fetchMarkingTechniques())
  }, [])

  return (
    <section className="py-10 bg-muted/30">
      <div className="container">
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
        >
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            {mockupTechniques?.length} Marking Techniques
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From embroidery to laser engraving, our AI simulates every texture and finish 
            with photorealistic precision.
        </p>
        </motion.div>

        <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
        {mockupTechniques.map((technique) => (
            <motion.div key={technique.name} variants={itemVariants}>
            <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  setSelectedTechnique(technique);
                  setModalOpen(true);
                }}
            >
                <CardContent className="p-4 text-center">
                <div className="h-16 w-16 bg-gradient-primary rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-sm">
                    {technique.display_name.charAt(0)}
                    </span>
                </div>
                <p className="font-medium text-sm">{technique.display_name}</p>
                </CardContent>
            </Card>
            </motion.div>
        ))}
        </motion.div>

        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-12"
        >
        {/* <Badge className="bg-primary/10 text-primary border-primary/20">
            More techniques added monthly
        </Badge> */}
        </motion.div>
      </div>
      
      <TechniqueDetailModal 
        technique={selectedTechnique}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
};

export default TechniquesShowcase;
