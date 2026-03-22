'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Header } from '@/components/Header';

export default function DiscoveredJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      setUser(data.user);
      await loadJobs(token);
    } catch (err) {
      console.error('Auth error:', err);
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  const loadJobs = async (token) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs/discovered', {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load discovered jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadJobs();
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((job) => job.id)));
    }
  };

  const handleSelectJob = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/jobs/discovered?id=${jobToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove from list
      setJobs(jobs.filter((j) => j.id !== jobToDelete.id));
      setSelectedJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobToDelete.id);
        return newSet;
      });
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.message);
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedJobs.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const deletePromises = Array.from(selectedJobs).map((jobId) =>
        fetch(`/api/jobs/discovered?id=${jobId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      await Promise.all(deletePromises);

      // Remove all deleted jobs from list
      setJobs(jobs.filter((j) => !selectedJobs.has(j.id)));
      setSelectedJobs(new Set());
    } catch (err) {
      console.error('Error deleting jobs:', err);
      setError(err.message);
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const handleDiscoverNewJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/jobs/discover-now', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to discover jobs');
      }

      const data = await response.json();

      // Refresh the jobs list to show newly discovered jobs
      await loadJobs(token);

      // Show success message
      if (data.jobsFound > 0) {
        setError(''); // Clear any previous errors
        // You could add a success toast here if you have a toast component
        console.log(`Successfully discovered ${data.jobsFound} new jobs!`);
      } else {
        setError('No new jobs found. Try again later or update your search keywords.');
      }
    } catch (err) {
      console.error('Error discovering jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} currentPath="/discovered" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Discovered Jobs</h1>
              <p className="text-muted-foreground mt-2">
                Jobs automatically discovered based on your search keywords
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} disabled={loading} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleDiscoverNewJobs} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Discover New Jobs
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedJobs.size > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button
                  onClick={handleBulkDeleteClick}
                  variant="destructive"
                  size="sm"
                  disabled={selectedJobs.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jobs Discovered Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Set up your job search keywords in your profile, and we&apos;ll automatically
                  discover relevant jobs for you.
                </p>
                <Button onClick={() => router.push('/profile/job-search')} className="mt-4">
                  Configure Job Search
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Jobs List */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {/* Select All Bar */}
              <div className="flex items-center gap-2 px-2">
                <Checkbox
                  checked={selectedJobs.size === jobs.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Select all {jobs.length} job{jobs.length > 1 ? 's' : ''}
                </label>
              </div>

              {/* Job Cards */}
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className={`transition-all ${
                    selectedJobs.has(job.id) ? 'border-primary shadow-sm' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onCheckedChange={() => handleSelectJob(job.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              <span className="font-medium">{job.company}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(job.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(job)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Discovered {formatDate(job.discoveredAt)}</span>
                          </div>
                        </div>

                        {/* Matched Keywords */}
                        {job.matchedKeywords && job.matchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.matchedKeywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {job.description && (
                    <CardContent>
                      <CardDescription className="line-clamp-3">{job.description}</CardDescription>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{jobToDelete?.title}&quot; at &quot;
              {jobToDelete?.company}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedJobs.size} Jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedJobs.size} selected job
              {selectedJobs.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
