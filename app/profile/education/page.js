'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Award, Plus, RefreshCw, Save } from 'lucide-react'
import { EducationEntry } from '@/components/EducationEntry'
import { CertificationEntry } from '@/components/CertificationEntry'

export default function EducationPage() {
  const [education, setEducation] = useState([])
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEducation(data.user.profile?.education || [])
        setCertifications(data.user.profile?.certifications || [])
      }
    } catch (error) {
      console.error('Failed to load education:', error)
      toast({ title: 'Error', description: 'Failed to load education data', variant: 'destructive' })
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
          profile: { education, certifications }
        })
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Education & certifications saved successfully' })
      } else {
        const data = await response.json()
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({ title: 'Error', description: 'Failed to save data', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Education functions
  const addEducation = () => {
    setEducation([
      ...education,
      {
        degree: '',
        fieldOfStudy: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: ''
      }
    ])
  }

  const updateEducation = (index, field, value) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
  }

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  // Certification functions
  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: ''
      }
    ])
  }

  const updateCertification = (index, field, value) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index))
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
        <h1 className="text-3xl font-bold tracking-tight">Education & Certifications</h1>
        <p className="text-muted-foreground mt-1">Your academic background and professional certifications</p>
      </div>

      <Tabs defaultValue="education" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="education" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="certifications" className="gap-2">
            <Award className="w-4 h-4" />
            Certifications
          </TabsTrigger>
        </TabsList>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addEducation} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </div>

          {education.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No education entries</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your academic background to strengthen your profile
                  </p>
                  <Button onClick={addEducation} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <EducationEntry
                  key={index}
                  education={edu}
                  onChange={(field, value) => updateEducation(index, field, value)}
                  onRemove={() => removeEducation(index)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addCertification} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Certification
            </Button>
          </div>

          {certifications.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No certifications added</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Showcase your professional certifications and credentials
                  </p>
                  <Button onClick={addCertification} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Certification
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <CertificationEntry
                  key={index}
                  certification={cert}
                  onChange={(field, value) => updateCertification(index, field, value)}
                  onRemove={() => removeCertification(index)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
