/**
 * Design System Usage Examples
 * 
 * This file demonstrates how to use the MockupAI design system components
 * for consistent styling across the application.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Settings, Trash2 } from 'lucide-react';

const DesignSystemExample = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-heading font-bold">MockupAI Design System</h1>
        <p className="text-muted-foreground">
          Examples of how to use the design system components for consistent styling.
        </p>
      </div>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            Use these button variants for different actions and contexts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Primary Actions</h4>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI
              </Button>
              <Button variant="primary" size="sm">
                Small Primary
              </Button>
              <Button variant="primary" size="lg">
                Large Primary
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Secondary Actions</h4>
            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary">
                <User className="h-4 w-4 mr-2" />
                Secondary
              </Button>
              <Button variant="outline">
                Outline
              </Button>
              <Button variant="ghost">
                Ghost
              </Button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status Actions</h4>
            <div className="flex gap-3 flex-wrap">
              <Button variant="success">
                <Settings className="h-4 w-4 mr-2" />
                Success
              </Button>
              <Button variant="warning">
                Warning
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            Use these badge variants for status indicators and labels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status Badges</h4>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="primary">Credits: 150</Badge>
              <Badge variant="outline">Free Plan</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Badge Sizes</h4>
            <div className="flex gap-3 flex-wrap items-center">
              <Badge variant="primary" size="sm">Small</Badge>
              <Badge variant="primary" size="default">Default</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Cards</CardTitle>
          <CardDescription>
            Use these card variants for different content containers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with subtle shadow</CardDescription>
              </CardHeader>
              <CardContent>
                This is the default card style for most content.
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with more prominent shadow</CardDescription>
              </CardHeader>
              <CardContent>
                Use this for important content or modals.
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>Card with border emphasis</CardDescription>
              </CardHeader>
              <CardContent>
                Good for forms or structured content.
              </CardContent>
            </Card>

            <Card variant="flat">
              <CardHeader>
                <CardTitle>Flat Card</CardTitle>
                <CardDescription>Minimal card without shadow</CardDescription>
              </CardHeader>
              <CardContent>
                Subtle container for secondary content.
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>
            How to use the design system effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Button Usage</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><code>variant="primary"</code> - For main actions like "Generate AI", "Save", "Create"</li>
              <li><code>variant="secondary"</code> - For secondary actions like "Cancel", "Reset"</li>
              <li><code>variant="outline"</code> - For subtle actions or toggles</li>
              <li><code>variant="ghost"</code> - For navigation or minimal actions</li>
              <li><code>variant="destructive"</code> - For delete or dangerous actions</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Badge Usage</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><code>variant="success"</code> - For completed, active, or positive status</li>
              <li><code>variant="warning"</code> - For pending, loading, or attention status</li>
              <li><code>variant="destructive"</code> - For errors or negative status</li>
              <li><code>variant="primary"</code> - For credits, important metrics</li>
              <li><code>variant="outline"</code> - For plans, categories, neutral labels</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Card Usage</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><code>variant="default"</code> - For most content containers</li>
              <li><code>variant="elevated"</code> - For modals, important content, featured items</li>
              <li><code>variant="outlined"</code> - For forms, inputs, structured data</li>
              <li><code>variant="flat"</code> - For subtle grouping, secondary content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignSystemExample;