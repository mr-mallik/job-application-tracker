'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

export function ProjectEntry({ project, index, onChange, onRemove }) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium">Project #{index + 1}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Project Title" value={project.title || ''} onChange={(e) => onChange({ ...project, title: e.target.value })} />
          <Input placeholder="URL (optional)" value={project.url || ''} onChange={(e) => onChange({ ...project, url: e.target.value })} />
        </div>
        <Textarea placeholder="Description (tech stack, problem, impact)" className="min-h-[60px]" value={project.description || ''} onChange={(e) => onChange({ ...project, description: e.target.value })} />
      </CardContent>
    </Card>
  )
}
