
import React from 'react';
import { Sparkles, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">MockupAI</span>
            </div>
            <p className="text-muted-foreground">
              Generate stunning product mockups with AI-powered branding simulation.
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Features</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Pricing</li>
              <li className="hover:text-primary cursor-pointer transition-colors">API</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Gallery</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Contact</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Status</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Community</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Privacy</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Terms</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Cookies</li>
              <li className="hover:text-primary cursor-pointer transition-colors">GDPR</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MockupAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
