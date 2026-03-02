'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Briefcase, Plus, RefreshCw, X, TrendingUp, UserCheck, CalendarCheck, PartyPopper, AlertCircle, Loader2 } from 'lucide-react'
import { statusColors } from './constants'
import { JobForm } from './JobForm'
import { JobDetailsPanel } from './JobDetailsPanel'
import { formatDateShort, isPastDate } from '@/lib/dateUtils'

export function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [filter, setFilter] = useState('all')

  // Merge user root fields with profile for backward compatibility
  // Handle both flat structure (fields at root) and nested structure (user.profile.*)
  const userProfile = user ? {
    // Prefer nested structure if it exists, otherwise use root-level fields
    name: user.name,
    email: user.email,
    id: user.id,
    headline: user.profile?.headline || user.designation,
    phone: user.profile?.phone || user.phone,
    location: user.profile?.location || user.location,
    linkedin: user.profile?.linkedin || user.linkedin,
    portfolio: user.profile?.portfolio || user.portfolio,
    summary: user.profile?.summary || user.summary,
    experiences: user.profile?.experiences || user.experiences || [],
    education: user.profile?.education || user.education,
    skills: user.profile?.skills || user.skills,
    projects: user.profile?.projects || user.projects || [],
    certifications: user.profile?.certifications || user.certifications || [],
    achievements: user.profile?.achievements || user.achievements,
  } : null

  useEffect(() => { loadJobs() }, [])
  
  const loadJobs = async () => {
    try { 
      const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setJobs(data.jobs)
    } catch { 
      toast.error('Failed to load jobs') 
    } finally { 
      setLoading(false) 
    }
  }

  const handleDeleteJob = async (id) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    try { 
      await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setJobs(jobs.filter(j => j.id !== id))
      if (selectedJob?.id === id) setSelectedJob(null)
      toast.success('Job deleted successfully') 
    } catch { 
      toast.error('Failed to delete job') 
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const stats = { 
    total: jobs.length, 
    applied: jobs.filter(j => j.status === 'applied').length, 
    interview: jobs.filter(j => j.status === 'interview').length, 
    offer: jobs.filter(j => j.status === 'offer').length, 
    rejected: jobs.filter(j => j.status === 'rejected').length 
  }

  const statCards = [
    // { label: 'Total', value: stats.total, filter: 'all', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Applied', value: stats.applied, filter: 'applied', icon: UserCheck, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-950' },
    { label: 'Interviews', value: stats.interview, filter: 'interview', icon: CalendarCheck, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-950' },
    { label: 'Offers', value: stats.offer, filter: 'offer', icon: PartyPopper, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950' },
    { label: 'Rejected', value: stats.rejected, filter: 'rejected', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950' }
  ]

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Compact Stats Bar */}
        <div className="flex flex-wrap gap-2 p-3 bg-card rounded-lg border shadow-sm">
          {statCards.map(stat => {
            const Icon = stat.icon
            return (
              <Button
                key={stat.filter}
                variant={filter === stat.filter ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(stat.filter)}
                className={`h-9 px-3 transition-all duration-200 ${
                  filter === stat.filter 
                    ? 'shadow-md' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className={`p-1 rounded ${stat.bgColor} mr-2`}>
                  <Icon className={`h-3 w-3 ${stat.color}`} />
                </div>
                <span className={`font-bold text-base mr-1 ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </Button>
            )
          })}
        </div>
        
        {/* Jobs List */}
        <div className="w-full">
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">Applications</CardTitle>
                  {filter !== 'all' && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                      onClick={() => setFilter('all')}
                    >
                      {filter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                </div>
                <Button size="sm" onClick={() => setShowAddJob(true)} className="shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <div className="overflow-y-auto">
              {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading applications...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="p-4 rounded-full bg-muted">
                      <Briefcase className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">No jobs found</p>
                      <p className="text-xs text-muted-foreground">
                        {filter === 'all' ? 'Add your first job application to get started' : `No ${filter} applications yet`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {filteredJobs.map(job => {
                      const isClosingSoon = job.closingDate && !isPastDate(job.closingDate)
                      const isClosed = job.closingDate && isPastDate(job.closingDate)
                      
                      return (
                        <Card 
                          key={job.id} 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                            selectedJob?.id === job.id ? 'ring-2 ring-primary shadow-md bg-accent/50' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => setSelectedJob(job)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm mb-1 truncate">{job.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {job.company}
                                  {job.location && ` • ${job.location}`}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                  {job.appliedDate && (
                                    <span className="text-muted-foreground">
                                      Applied: {formatDateShort(job.appliedDate)}
                                    </span>
                                  )}
                                  {job.closingDate && (
                                    <span className={isClosed ? 'text-muted-foreground line-through' : isClosingSoon ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'}>
                                      {isClosed ? 'Closed' : 'Closes'}: {formatDateShort(job.closingDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge className={`${statusColors[job.status]} shrink-0 shadow-sm`}>
                                {job.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          
          {/* Job Details Panel - Full Screen Overlay */}
          {selectedJob && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
                onClick={() => setSelectedJob(null)}
              />
              
              {/* Sliding Panel from Right */}
              <div className="fixed inset-y-0 right-0 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] max-w-[1200px] z-50 animate-in slide-in-from-right duration-300">
                <div className="h-full bg-background shadow-2xl border-r">
                  <JobDetailsPanel 
                    job={selectedJob} 
                    token={token} 
                    userProfile={userProfile} 
                    onUpdate={(updatedJob) => { 
                      setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j))
                      setSelectedJob(updatedJob)
                    }} 
                    onClose={() => setSelectedJob(null)} 
                    onDelete={() => handleDeleteJob(selectedJob.id)} 
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Job Application</DialogTitle>
            <DialogDescription>Fill in the details or paste a job URL to auto-fetch information</DialogDescription>
          </DialogHeader>
          <JobForm 
            token={token} 
            userProfile={userProfile} 
            onSave={(newJob) => { 
              setJobs([newJob, ...jobs])
              setShowAddJob(false)
              setSelectedJob(newJob)
              toast.success('Job added successfully!')
            }} 
            onCancel={() => setShowAddJob(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
