'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { RESUME_TEMPLATES } from '@/lib/resumeTemplates'

export default function TemplateGallery({ open, onOpenChange, onSelectTemplate, userProfile }) {
  const [selectedTemplate, setSelectedTemplate] = useState('harvard')

  const handleConfirm = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate, userProfile)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Resume Template</DialogTitle>
          <DialogDescription>
            Select a professional template for your resume. You can change it later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {Object.values(RESUME_TEMPLATES).map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      {selectedTemplate === template.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="bg-gray-50 border rounded-lg p-4 h-[300px] overflow-hidden">
                  <TemplatePreview template={template} />
                </div>
              </CardContent>

              <CardFooter>
                <div className="flex gap-2 flex-wrap">
                  {template.features?.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Resume with {RESUME_TEMPLATES[selectedTemplate]?.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Template preview component
 * Shows scaled-down sample of the template
 */
function TemplatePreview({ template }) {
  const sampleData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    subtitle: 'Senior Software Engineer',
    summary: 'Experienced software engineer with 8+ years in full-stack development. Passionate about building scalable applications.',
    experiences: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'New York, NY',
        startDate: 'Jan 2020',
        endDate: 'Present',
        achievements: '• Led development of microservices architecture\n• Improved system performance by 40%'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        grade: '3.8 GPA',
        institution: 'State University',
        location: 'Boston, MA',
        startDate: '2012',
        endDate: '2016'
      }
    ],
    skills: {
      technical: 'JavaScript, Python, React, Node.js, Docker',
      relevant: 'Agile, CI/CD, Team Leadership',
      other: ''
    },
    courses: [
      { title: 'Advanced React Patterns', provider: 'Frontend Masters' }
    ],
    achievements: []
  }

  if (template.id === 'harvard') {
    return <HarvardPreview blocks={sampleData} />
  } else if (template.id === '2columns') {
    return <TwoColumnsPreview blocks={sampleData} />
  }

  return <div className="text-center text-gray-400 py-20">Preview not available</div>
}

function HarvardPreview({ blocks }) {
  return (
    <div className="text-[6px] leading-tight font-serif transform scale-75 origin-top-left w-[133%] h-[133%]">
      <div className="text-center mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wide">{blocks.name}</div>
        <div className="text-[6px] mt-0.5">{blocks.subtitle}</div>
        <div className="text-[5px] mt-0.5">{blocks.email} • {blocks.phone} • {blocks.location}</div>
      </div>

      <div className="border-t border-gray-400 my-1.5"></div>

      <div className="mb-2">
        <div className="text-[7px] font-semibold uppercase mb-0.5">Summary</div>
        <div className="text-[5px] leading-tight">{blocks.summary}</div>
      </div>

      <div className="mb-2">
        <div className="text-[7px] font-semibold uppercase mb-0.5">Experience</div>
        {blocks.experiences.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-1">
            <div className="flex justify-between items-baseline">
              <div className="text-[6px] font-semibold">{exp.title}</div>
              <div className="text-[5px]">{exp.startDate} - {exp.endDate}</div>
            </div>
            <div className="text-[5px] italic">{exp.company}, {exp.location}</div>
            <div className="text-[5px] leading-tight mt-0.5 whitespace-pre-line">
              {exp.achievements.split('\n').slice(0, 2).join('\n')}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[7px] font-semibold uppercase mb-0.5">Education</div>
        {blocks.education.slice(0, 1).map((edu, i) => (
          <div key={i} className="text-[5px] leading-tight">
            <div className="font-semibold">{edu.degree}</div>
            <div>{edu.institution}, {edu.location}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TwoColumnsPreview({ blocks }) {
  return (
    <div className="text-[6px] leading-tight font-sans flex gap-2 transform scale-75 origin-top-left w-[133%] h-[133%]">
      {/* Left sidebar */}
      <div className="w-[35%] bg-gray-800 text-white p-2">
        <div className="mb-2">
          <div className="text-[8px] font-bold">{blocks.name}</div>
          <div className="text-[5px] mt-0.5">{blocks.subtitle}</div>
        </div>

        <div className="mb-2">
          <div className="text-[6px] font-semibold uppercase mb-0.5 border-b border-white/30 pb-0.5">Contact</div>
          <div className="text-[4px] space-y-0.5">
            <div>{blocks.email}</div>
            <div>{blocks.phone}</div>
            <div>{blocks.location}</div>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-[6px] font-semibold uppercase mb-0.5 border-b border-white/30 pb-0.5">Skills</div>
          <div className="text-[4px] leading-tight">
            {blocks.skills.technical.split(',').slice(0, 5).join(', ')}
          </div>
        </div>

        <div>
          <div className="text-[6px] font-semibold uppercase mb-0.5 border-b border-white/30 pb-0.5">Education</div>
          {blocks.education.slice(0, 1).map((edu, i) => (
            <div key={i} className="text-[4px] leading-tight mt-1">
              <div className="font-semibold">{edu.degree}</div>
              <div>{edu.institution}</div>
              <div>{edu.startDate} - {edu.endDate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 p-2">
        <div className="mb-2">
          <div className="text-[7px] font-bold uppercase mb-0.5">Professional Summary</div>
          <div className="text-[5px] leading-tight">{blocks.summary}</div>
        </div>

        <div>
          <div className="text-[7px] font-bold uppercase mb-0.5">Experience</div>
          {blocks.experiences.slice(0, 2).map((exp, i) => (
            <div key={i} className="mb-1.5">
              <div className="text-[6px] font-semibold">{exp.title}</div>
              <div className="text-[5px] italic">{exp.company} • {exp.startDate} - {exp.endDate}</div>
              <div className="text-[5px] leading-tight mt-0.5 whitespace-pre-line">
                {exp.achievements.split('\n').slice(0, 2).join('\n')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
