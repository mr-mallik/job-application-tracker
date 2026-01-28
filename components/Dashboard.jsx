'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Briefcase, Plus, LogOut, User, RefreshCw, X } from 'lucide-react'
import { statusColors } from './constants'
import { JobForm } from './JobForm'
import { JobDetailsPanel } from './JobDetailsPanel'
import { ProfileEditor } from './ProfileEditor'

export function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadJobs() }, [])
  const loadJobs = async () => {
    try { const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setJobs(data.jobs) }
    catch { toast.error('Failed to load') } finally { setLoading(false) }
  }
  const handleDeleteJob = async (id) => {
    if (!confirm('Delete?')) return
    try { await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); setJobs(jobs.filter(j => j.id !== id)); if (selectedJob?.id === id) setSelectedJob(null); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const stats = { total: jobs.length, applied: jobs.filter(j => j.status === 'applied').length, interview: jobs.filter(j => j.status === 'interview').length, offer: jobs.filter(j => j.status === 'offer').length, rejected: jobs.filter(j => j.status === 'rejected').length }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary-foreground" /></div>
            <div><h1 className="font-semibold text-sm">Job Tracker</h1><p className="text-xs text-muted-foreground">Welcome, {user.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}><User className="w-4 h-4 mr-1" />Profile</Button>
            <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[{ label: 'Total', value: stats.total, f: 'all' }, { label: 'Applied', value: stats.applied, f: 'applied', c: 'text-blue-600' }, { label: 'Interviews', value: stats.interview, f: 'interview', c: 'text-yellow-600' }, { label: 'Offers', value: stats.offer, f: 'offer', c: 'text-green-600' }, { label: 'Rejected', value: stats.rejected, f: 'rejected', c: 'text-red-600' }].map(s => (
            <Card key={s.f} className="cursor-pointer hover:shadow-md" onClick={() => setFilter(s.f)}><CardContent className="py-3"><div className={`text-xl font-bold ${s.c || ''}`}>{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></CardContent></Card>
          ))}
        </div>
        
        <div className="flex gap-4">
          <div className={`${selectedJob ? 'w-1/3' : 'w-full'} transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><h2 className="font-semibold">Applications</h2>{filter !== 'all' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilter('all')}>{filter} <X className="w-3 h-3 ml-1" /></Badge>}</div>
              <Button size="sm" onClick={() => setShowAddJob(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            {loading ? 
                <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                </div>
            : filteredJobs.length === 0 ? 
                <Card>
                    <CardContent className="py-8 text-center">
                        <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm">No jobs found</p>
                    </CardContent>
                </Card>
            : <div className="space-y-2">{filteredJobs.map(job => (
                <Card key={job.id} className={`cursor-pointer hover:shadow-md ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedJob(job)}>
                    <CardContent className="py-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium text-sm">{job.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {job.company} {job.location && `• ${job.location}`} 
                                    <span className='text-red-500'>{job.closingDate && ` • Closing Date: ${job.closingDate}`}</span>
                                </p>
                            </div>
                            <Badge className={statusColors[job.status]}>{job.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
              ))}</div>}
          </div>
          {selectedJob && <div className="w-2/3"><Card className="h-[calc(100vh-220px)] overflow-hidden"><JobDetailsPanel job={selectedJob} token={token} userProfile={user} onUpdate={(u) => { setJobs(jobs.map(j => j.id === u.id ? u : j)); setSelectedJob(u); }} onClose={() => setSelectedJob(null)} onDelete={() => handleDeleteJob(selectedJob.id)} /></Card></div>}
        </div>
      </div>
      
      <Dialog open={showAddJob} onOpenChange={setShowAddJob}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader><JobForm token={token} userProfile={user} onSave={(nj) => { setJobs([nj, ...jobs]); setShowAddJob(false); setSelectedJob(nj); }} onCancel={() => setShowAddJob(false)} /></DialogContent></Dialog>
      <Dialog open={showProfile} onOpenChange={setShowProfile}><DialogContent className="max-w-6xl max-h-[90vh]"><DialogHeader><DialogTitle>Profile & Resume Data</DialogTitle><DialogDescription>Your data is used as template for AI-generated resumes</DialogDescription></DialogHeader><ProfileEditor user={user} token={token} onSave={(u) => { localStorage.setItem('user', JSON.stringify(u)); onUserUpdate(u); setShowProfile(false); }} onCancel={() => setShowProfile(false)} /></DialogContent></Dialog>
    </div>
  )
}
