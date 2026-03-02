'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2, FolderOpen, Link2 } from 'lucide-react';

export function ProjectEntry({ project, index, onChange, onRemove }) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardHeader className="pb-3 pt-4 bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10">
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Project #{index + 1}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Project Title</Label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g., E-commerce Platform"
                className="pl-10"
                value={project.title || ''}
                onChange={(e) => onChange('title', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Project URL (optional)</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://github.com/user/repo"
                className="pl-10"
                value={project.url || ''}
                onChange={(e) => onChange('url', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Description & Impact</Label>
          <Textarea
            placeholder="Describe the project, technologies used, your role, and measurable impact...&#10;&#10;Example: Built a full-stack application using React and Node.js that increased user engagement by 40%"
            className="min-h-[100px] resize-y"
            value={project.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Include tech stack, your contributions, and quantifiable results
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
