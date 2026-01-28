'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

export function ExperienceEntry({ experience, index, onChange, onRemove }) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium">Experience #{index + 1}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Job Title" value={experience.title || ''} onChange={(e) => onChange({ ...experience, title: e.target.value })} />
          <Input placeholder="Company" value={experience.company || ''} onChange={(e) => onChange({ ...experience, company: e.target.value })} />
          <Input placeholder="Location" value={experience.location || ''} onChange={(e) => onChange({ ...experience, location: e.target.value })} />
          <div className="flex gap-2">
            <Input placeholder="Start (mm/yyyy)" value={experience.startDate || ''} onChange={(e) => onChange({ ...experience, startDate: e.target.value })} />
            <Input placeholder="End (mm/yyyy)" value={experience.endDate || ''} onChange={(e) => onChange({ ...experience, endDate: e.target.value })} />
          </div>
        </div>
        <Textarea placeholder="Description (one bullet point per line)" className="min-h-[80px]" value={experience.description || ''} onChange={(e) => onChange({ ...experience, description: e.target.value })} />
      </CardContent>
    </Card>
  )
}
