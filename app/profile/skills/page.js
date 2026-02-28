'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Code, Languages, Users, Wrench, Plus, X, RefreshCw, Save } from 'lucide-react'

const skillCategories = [
  { id: 'technical', name: 'Technical Skills', icon: Code, description: 'Programming languages, frameworks, tools' },
  { id: 'soft', name: 'Soft Skills', icon: Users, description: 'Communication, leadership, teamwork' },
  { id: 'languages', name: 'Languages', icon: Languages, description: 'Spoken languages' },
  { id: 'other', name: 'Other Skills', icon: Wrench, description: 'Additional relevant skills' },
]

const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

export default function SkillsPage() {
  const [skills, setSkills] = useState({
    technical: [],
    soft: [],
    languages: [],
    other: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState({ category: 'technical', name: '', proficiency: 'Intermediate' })
  const { toast } = useToast()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const loadedSkills = data.user.profile?.skills || {
          technical: [],
          soft: [],
          languages: [],
          other: []
        }
        setSkills(loadedSkills)
      }
    } catch (error) {
      console.error('Failed to load skills:', error)
      toast({ title: 'Error', description: 'Failed to load skills', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: { skills }
        })
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Skills saved successfully' })
      } else {
        const data = await response.json()
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save skills', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (!newSkill.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a skill name', variant: 'destructive' })
      return
    }

    const category = newSkill.category
    const exists = skills[category].some(s => s.name.toLowerCase() === newSkill.name.toLowerCase())
    
    if (exists) {
      toast({ title: 'Error', description: 'This skill already exists', variant: 'destructive' })
      return
    }

    setSkills({
      ...skills,
      [category]: [...skills[category], { name: newSkill.name, proficiency: newSkill.proficiency }]
    })

    setNewSkill({ category: 'technical', name: '', proficiency: 'Intermediate' })
  }

  const removeSkill = (category, index) => {
    setSkills({
      ...skills,
      [category]: skills[category].filter((_, i) => i !== index)
    })
  }

  const updateSkillProficiency = (category, index, proficiency) => {
    const updated = [...skills[category]]
    updated[index] = { ...updated[index], proficiency }
    setSkills({ ...skills, [category]: updated })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
        <p className="text-muted-foreground mt-1">Showcase your technical and professional competencies</p>
      </div>

      {/* Add Skill Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Add New Skill</CardTitle>
          <CardDescription>Select category, enter skill name, and choose proficiency level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={newSkill.category} onValueChange={(val) => setNewSkill({ ...newSkill, category: val })}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skillCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              placeholder="e.g., React, Leadership, Spanish"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            />

            <Select value={newSkill.proficiency} onValueChange={(val) => setNewSkill({ ...newSkill, proficiency: val })}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {proficiencyLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={addSkill} className="sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      {skillCategories.map(category => {
        const categorySkills = skills[category.id] || []
        const Icon = category.icon

        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {category.name}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {categorySkills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No {category.name.toLowerCase()} added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {categorySkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 flex items-center gap-3">
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {skill.proficiency}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={skill.proficiency}
                          onValueChange={(val) => updateSkillProficiency(category.id, index, val)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {proficiencyLevels.map(level => (
                              <SelectItem key={level} value={level} className="text-xs">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSkill(category.id, index)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Save Button */}
      <div className="flex justify-end gap-2 pb-6">
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save Changes</>
          )}
        </Button>
      </div>
    </div>
  )
}
