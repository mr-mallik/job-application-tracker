'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2, Briefcase, Building2, MapPin, Calendar } from 'lucide-react';

export function ExperienceEntry({ experience, index, onChange, onRemove }) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardHeader className="pb-3 pt-4 bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Experience #{index + 1}</span>
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
            <Label className="text-xs font-medium">Job Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Software Engineer"
                className="pl-10"
                value={experience.title || ''}
                onChange={(e) => onChange({ ...experience, title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Company</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Tech Corp Inc."
                className="pl-10"
                value={experience.company || ''}
                onChange={(e) => onChange({ ...experience, company: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g., San Francisco, CA"
                className="pl-10"
                value={experience.location || ''}
                onChange={(e) => onChange({ ...experience, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Duration</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="mm/yyyy"
                  className="pl-10"
                  value={experience.startDate || ''}
                  onChange={(e) => onChange({ ...experience, startDate: e.target.value })}
                />
              </div>
              <span className="flex items-center text-muted-foreground">-</span>
              <Input
                placeholder="mm/yyyy or Present"
                className="flex-1"
                value={experience.endDate || ''}
                onChange={(e) => onChange({ ...experience, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Key Responsibilities & Achievements</Label>
          <Textarea
            placeholder="• Led development of...&#10;• Implemented features that...&#10;• Collaborated with team to...&#10;&#10;(One bullet point per line)"
            className="min-h-[120px] resize-y font-mono text-xs"
            value={experience.description || ''}
            onChange={(e) => onChange({ ...experience, description: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Tip: Use action verbs and quantify achievements where possible
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
