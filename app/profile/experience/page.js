'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Briefcase, Plus, RefreshCw, Save } from 'lucide-react'
import { ExperienceEntry } from '@/components/ExperienceEntry'

export default function WorkExperiencePage() {
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadExperiences()
  }, [])

  const loadExperiences = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setExperiences(data.user.profile?.experiences || [])
      }
    } catch (error) {
      console.error('Failed to load experiences:', error)
      toast({ title: 'Error', description: 'Failed to load work experience', variant: 'destructive' })
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
          profile: { experiences }
        })
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Work experience saved successfully' })
      } else {
        const data = await response.json()
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save work experience', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ])
  }

  const updateExperience = (index, field, value) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    setExperiences(updated)
  }

  const removeExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index))
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Experience</h1>
          <p className="text-muted-foreground mt-1">Your professional work history and achievements</p>
        </div>
        <Button onClick={addExperience} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {/* Experiences List */}
      {experiences.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No work experience added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your professional experience to showcase your career journey
              </p>
              <Button onClick={addExperience} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Experience
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <ExperienceEntry
              key={index}
              experience={exp}
              onChange={(field, value) => updateExperience(index, field, value)}
              onRemove={() => removeExperience(index)}
            />
          ))}
        </div>
      )}

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
