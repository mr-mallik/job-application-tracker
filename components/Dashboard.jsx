'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Briefcase, Plus, LogOut, User, RefreshCw, X, TrendingUp, UserCheck, CalendarCheck, PartyPopper, AlertCircle, Loader2 } from 'lucide-react'
import { statusColors } from './constants'
import { JobForm } from './JobForm'
import { JobDetailsPanel } from './JobDetailsPanel'
import { ProfileEditor } from './ProfileEditor'
import { ThemeToggle } from '@/components/theme-toggle'

export function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [filter, setFilter] = useState('all')

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
    { label: 'Total Jobs', value: stats.total, filter: 'all', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Applied', value: stats.applied, filter: 'applied', icon: UserCheck, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-950' },
    { label: 'Interviews', value: stats.interview, filter: 'interview', icon: CalendarCheck, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-950' },
    { label: 'Offers', value: stats.offer, filter: 'offer', icon: PartyPopper, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950' },
    { label: 'Rejected', value: stats.rejected, filter: 'rejected', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Job Application Tracker</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Separator orientation="vertical" className="h-8" />
              <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="transition-all hover:bg-accent">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout} className="transition-all hover:bg-accent">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map(stat => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.filter} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${filter === stat.filter ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/50'}`}
                onClick={() => setFilter(stat.filter)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Jobs List */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className={`${selectedJob ? 'lg:w-1/3' : 'w-full'} transition-all duration-300`}>
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
              <ScrollArea className="h-[calc(100vh-360px)] lg:h-[calc(100vh-320px)]">
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
                    {filteredJobs.map(job => (
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
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {job.company}
                                {job.location && ` • ${job.location}`}
                              </p>
                              {job.closingDate && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                  Closes: {job.closingDate}
                                </p>
                              )}
                            </div>
                            <Badge className={`${statusColors[job.status]} shrink-0 shadow-sm`}>
                              {job.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
          
          {/* Job Details Panel */}
          {selectedJob && (
            <div className="lg:w-2/3 w-full animate-in slide-in-from-right duration-300">
              <Card className="h-[calc(100vh-220px)] overflow-hidden shadow-md">
                <JobDetailsPanel 
                  job={selectedJob} 
                  token={token} 
                  userProfile={user} 
                  onUpdate={(updatedJob) => { 
                    setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j))
                    setSelectedJob(updatedJob)
                  }} 
                  onClose={() => setSelectedJob(null)} 
                  onDelete={() => handleDeleteJob(selectedJob.id)} 
                />
              </Card>
            </div>
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
            userProfile={user} 
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
      
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Profile & Resume Data</DialogTitle>
            <DialogDescription>Your profile information is used as a template for AI-generated resumes and cover letters</DialogDescription>
          </DialogHeader>
          <ProfileEditor 
            user={user} 
            token={token} 
            onSave={(updatedUser) => { 
              localStorage.setItem('user', JSON.stringify(updatedUser))
              onUserUpdate(updatedUser)
              setShowProfile(false)
              toast.success('Profile updated successfully!')
            }} 
            onCancel={() => setShowProfile(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
