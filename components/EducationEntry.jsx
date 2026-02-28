'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GraduationCap, Building2, MapPin, Calendar, X, BookOpen, Hash } from 'lucide-react'

export function EducationEntry({ education, onChange, onRemove }) {
  return (
    <Card className="relative border-2 hover:border-primary/50 transition-all duration-200">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base">
              {education.degree || 'New Education Entry'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Degree */}
          <div className="space-y-2">
            <Label>Degree / Qualification *</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={education.degree}
                onChange={(e) => onChange('degree', e.target.value)}
                placeholder="Bachelor of Science"
                className="pl-10"
              />
            </div>
          </div>

          {/* Field of Study */}
          <div className="space-y-2">
            <Label>Field of Study</Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={education.fieldOfStudy || ''}
                onChange={(e) => onChange('fieldOfStudy', e.target.value)}
                placeholder="Computer Science"
                className="pl-10"
              />
            </div>
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label>Institution *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={education.institution}
                onChange={(e) => onChange('institution', e.target.value)}
                placeholder="University Name"
                className="pl-10"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={education.location || ''}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="City, Country"
                className="pl-10"
              />
            </div>
          </div>

          {/* Graduation Date */}
          <div className="space-y-2">
            <Label>Graduation Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="month"
                value={education.graduationDate}
                onChange={(e) => onChange('graduationDate', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* GPA */}
          <div className="space-y-2">
            <Label>GPA (Optional)</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={education.gpa || ''}
                onChange={(e) => onChange('gpa', e.target.value)}
                placeholder="3.8 / 4.0"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Include honors, relevant coursework, or academic achievements
        </p>
      </CardContent>
    </Card>
  )
}
