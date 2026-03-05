'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  ExternalLink,
  FileText,
  Sparkles,
  RefreshCw,
  Briefcase,
  Bell,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  FileCheck,
  Info,
} from 'lucide-react';

export function JobForm({ job, onSave, onCancel, token, userProfile }) {
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [extractionMode, setExtractionMode] = useState('url');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    salary: job?.salary || '',
    closingDate: job?.closingDate || '',
    appliedDate: job?.appliedDate || new Date().toISOString().split('T')[0],
    status: job?.status || 'saved',
    url: job?.url || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    benefits: job?.benefits || '',
    notes: job?.notes || '',
    reminder: {
      enabled: job ? (job.reminder?.enabled ?? false) : true,
      daysBefore: job?.reminder?.daysBefore || null,
    },
  });

  const handleScrape = async () => {
    if (!formData.url) {
      toast.error('Please enter a job URL first');
      return;
    }
    setScraping(true);
    try {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: formData.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData((prev) => ({
        ...prev,
        title: data.jobDetails.title || prev.title,
        company: data.jobDetails.company || prev.company,
        location: data.jobDetails.location || prev.location,
        salary: data.jobDetails.salary || prev.salary,
        closingDate: data.jobDetails.closingDate || prev.closingDate,
        description: data.jobDetails.description || prev.description,
        requirements: data.jobDetails.requirements || prev.requirements,
        benefits: data.jobDetails.benefits || prev.benefits,
      }));
      toast.success('Job details extracted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to extract job details');
    } finally {
      setScraping(false);
    }
  };

  const handleExtractFromText = async () => {
    if (!jobDescriptionText.trim()) {
      toast.error('Please paste a job description first');
      return;
    }
    setScraping(true);
    try {
      const res = await fetch('/api/jobs/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: jobDescriptionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData((prev) => ({
        ...prev,
        title: data.jobDetails.title || prev.title,
        company: data.jobDetails.company || prev.company,
        location: data.jobDetails.location || prev.location,
        salary: data.jobDetails.salary || prev.salary,
        closingDate: data.jobDetails.closingDate || prev.closingDate,
        description: data.jobDetails.description || prev.description,
        requirements: data.jobDetails.requirements || prev.requirements,
        benefits: data.jobDetails.benefits || prev.benefits,
      }));
      toast.success('Job details extracted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to extract job details');
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(job ? `/api/jobs/${job.id}` : '/api/jobs', {
        method: job ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(job ? 'Job updated successfully!' : 'Job added successfully!');
      onSave(data.job);
    } catch (error) {
      toast.error(error.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset
        disabled={scraping}
        className={`block space-y-6 border-0 p-0 m-0 min-w-0 transition-opacity duration-200${scraping ? ' opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {/* AI Extraction Section */}
        <Card className="border-2 border-dashed bg-accent/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">AI-Powered Job Extraction</h3>
                <p className="text-xs text-muted-foreground">
                  Automatically extract job details using AI
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={extractionMode === 'url' ? 'default' : 'outline'}
                onClick={() => setExtractionMode('url')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                From URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={extractionMode === 'text' ? 'default' : 'outline'}
                onClick={() => setExtractionMode('text')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </Button>
            </div>

            {extractionMode === 'url' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="job-url" className="text-sm font-medium">
                    Job Posting URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="job-url"
                      className="flex-1"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <Button
                      type="button"
                      onClick={handleScrape}
                      disabled={scraping}
                      className="shadow-sm"
                    >
                      {scraping ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Extract
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Supports LinkedIn, Indeed, Glassdoor, and more
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="job-text" className="text-sm font-medium">
                    Paste Job Description
                  </Label>
                  <Textarea
                    id="job-text"
                    className="min-h-[140px] font-mono text-sm"
                    placeholder="Paste the full job description here...

Include all details like:
• Job title and company name
• Location and salary (if mentioned)
• Job description and responsibilities
• Requirements and qualifications
• Benefits and perks
• Application deadline"
                    value={jobDescriptionText}
                    onChange={(e) => setJobDescriptionText(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="w-full shadow-sm"
                    onClick={handleExtractFromText}
                    disabled={scraping}
                  >
                    {scraping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Extracting with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Extract Job Details with AI
                      </>
                    )}
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="optional-url" className="text-xs text-muted-foreground">
                    Job URL (Optional)
                  </Label>
                  <Input
                    id="optional-url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Job Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-3 h-3" />
                Job Title *
              </Label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Company *
              </Label>
              <Input
                id="company"
                placeholder="e.g., Tech Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY or Remote"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Salary
              </Label>
              <Input
                id="salary"
                placeholder="e.g., $80k - $120k"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closing-date" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Closing Date
              </Label>
              <Input
                id="closing-date"
                type="date"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applied-date" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Applied Date
              </Label>
              <Input
                id="applied-date"
                type="date"
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">💾 Saved</SelectItem>
                  <SelectItem value="applied">📤 Applied</SelectItem>
                  <SelectItem value="interview">🎯 Interview</SelectItem>
                  <SelectItem value="offer">🎉 Offer</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="withdrawn">↩️ Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reminder Settings */}
        <Card className="border-2 bg-muted/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Checkbox
                id="reminder-enabled"
                checked={formData.reminder.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminder: { ...formData.reminder, enabled: checked } })
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <Label
                      htmlFor="reminder-enabled"
                      className="cursor-pointer font-semibold text-base"
                    >
                      Email Reminder
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications before the application deadline
                  </p>
                </div>

                {formData.reminder.enabled && (
                  <div className="pt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="days-before" className="text-sm font-medium">
                      Days Before Deadline (Optional)
                    </Label>
                    <Input
                      id="days-before"
                      type="number"
                      min="1"
                      placeholder="Leave empty for defaults (7 & 1 day before)"
                      value={formData.reminder.daysBefore || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminder: {
                            ...formData.reminder,
                            daysBefore: e.target.value ? parseInt(e.target.value) : null,
                          },
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {formData.reminder.daysBefore
                        ? `Reminder will be sent ${formData.reminder.daysBefore} day${formData.reminder.daysBefore === 1 ? '' : 's'} before the deadline`
                        : 'Default: Reminders at 7 days and 1 day before deadline'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Additional Details
          </h3>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Job Description
            </Label>
            <Textarea
              id="description"
              className="min-h-[100px] resize-y font-sans"
              placeholder="Describe the role, responsibilities, and what you'll be doing..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements" className="text-sm font-medium">
              Requirements & Qualifications
            </Label>
            <Textarea
              id="requirements"
              className="min-h-[80px] resize-y font-sans"
              placeholder="List the required skills, experience, education, etc..."
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits" className="text-sm font-medium">
              Benefits & Perks (Optional)
            </Label>
            <Textarea
              id="benefits"
              className="min-h-[60px] resize-y font-sans"
              placeholder="Health insurance, 401k, remote work, etc..."
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Personal Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              className="min-h-[60px] resize-y font-sans"
              placeholder="Add your own notes, contacts, follow-up reminders, etc..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="shadow-md min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : job ? (
              'Update Job'
            ) : (
              'Add Job'
            )}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
