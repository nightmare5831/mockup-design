'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { TechniqueSelector } from '@/components/Mockup/TechniqueSelector';
import { TechniqueExample } from '@/components/Mockup/TechniqueExample';
import { RegisteredGuard } from '@/components/Auth/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MockupTechniqueInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function TechniquesPage() {
  const [selectedTechnique, setSelectedTechnique] = useState<MockupTechniqueInfo | null>(null);
  const [showPremiumOnly, setShowPremiumOnly] = useState(true);

  const handleTechniqueSelect = (technique: MockupTechniqueInfo) => {
    setSelectedTechnique(technique);
  };

  return (
    <RegisteredGuard>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Marking Techniques
              </h1>
              <p className="text-muted-foreground">
                Explore available marking techniques for your mockups
              </p>
            </div>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Display Options</CardTitle>
                <CardDescription>
                  Configure what techniques to show
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-premium"
                    checked={showPremiumOnly}
                    onCheckedChange={setShowPremiumOnly}
                  />
                  <Label htmlFor="show-premium">Show premium techniques</Label>
                </div>
              </CardContent>
            </Card>

            {/* Selected Technique Display */}
            {selectedTechnique && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Selected Technique
                    {selectedTechnique.premium_only && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{selectedTechnique.display_name}</h3>
                    <p className="text-muted-foreground">{selectedTechnique.description}</p>
                    <div className="text-sm">
                      <strong>Technique ID:</strong>{' '}
                      <code className="bg-muted px-2 py-1 rounded">{selectedTechnique.name}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technique Selector Component */}
            <TechniqueSelector
              selectedTechnique={selectedTechnique?.name}
              onTechniqueSelect={handleTechniqueSelect}
              showPremiumOnly={showPremiumOnly}
            />

            {/* API Example Component */}
            <div className="border-t pt-8">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Direct API Usage Example
              </h2>
              <TechniqueExample />
            </div>

            {/* API Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
                <CardDescription>
                  How to use the getMarkingTechniques API endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Backend Endpoint:</h4>
                    <code className="bg-muted p-2 rounded block">
                      GET /api/v1/mockups/techniques
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Frontend Usage:</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import { mockupsApi } from '@/service/api';

// Using the API directly
const techniques = await mockupsApi.getMarkingTechniques();

// Using the custom hook
import { useTechniques } from '@/hooks/useTechniques';
const { techniques, loading, error } = useTechniques();`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Response Format:</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`[
  {
    "name": "SERIGRAFIA",
    "display_name": "Serigrafía",
    "description": "Screen printing technique for vibrant colors",
    "premium_only": false,
    "texture_preview_url": null
  },
  // ... more techniques
]`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RegisteredGuard>
  );
}