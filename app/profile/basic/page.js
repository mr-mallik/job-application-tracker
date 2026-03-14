'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/document/RichTextEditor';
import { ensureSlate, slateToText, slateFromText } from '@/lib/slateUtils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Link2,
  Briefcase,
  Sparkles,
  Upload,
  RefreshCw,
  Save,
  Award,
} from 'lucide-react';

export default function BasicInformationPage() {
  const [profile, setProfile] = useState({
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
  });
  const [achievements, setAchievements] = useState(slateFromText(''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.user.name || '',
          headline: data.user.profile?.headline || '',
          email: data.user.email || '',
          phone: data.user.profile?.phone || '',
          location: data.user.profile?.location || '',
          linkedin: data.user.profile?.linkedin || '',
          portfolio: data.user.profile?.portfolio || '',
          summary: data.user.profile?.summary || '',
        });
        // Load achievements as Slate value
        const achievementsText = data.user.profile?.achievements || '';
        setAchievements(slateFromText(achievementsText));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({ title: 'Error', description: 'Failed to load profile data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          profile: {
            headline: profile.headline,
            phone: profile.phone,
            location: profile.location,
            linkedin: profile.linkedin,
            portfolio: profile.portfolio,
            summary: profile.summary,
            achievements: slateToText(achievements),
          },
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Basic information saved successfully' });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to save profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Error', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }

    setParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Content = event.target.result.split(',')[1];

        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/parse-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ base64Content }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = data.profileData;

          // Update basic information fields
          setProfile((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            headline: parsed.headline || prev.headline,
            phone: parsed.phone || prev.phone,
            location: parsed.location || prev.location,
            linkedin: parsed.linkedin || prev.linkedin,
            portfolio: parsed.portfolio || prev.portfolio,
            summary: parsed.summary || prev.summary,
          }));

          // Update achievements if parsed
          if (parsed.achievements) {
            setAchievements(slateFromText(parsed.achievements));
          }

          toast({
            title: 'Success',
            description:
              'Resume parsed! Basic information fields updated. Check other sections for more data.',
          });
        } else {
          const data = await response.json();
          toast({
            title: 'Error',
            description: data.error || 'Failed to parse resume',
            variant: 'destructive',
          });
        }

        setParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Parse error:', error);
      toast({ title: 'Error', description: 'Failed to parse resume', variant: 'destructive' });
      setParsing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Basic Information</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal details and professional summary
        </p>
      </div>

      {/* AI Import Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Import Resume with AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your PDF resume to auto-populate all profile fields using AI
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            Personal Details
          </CardTitle>
          <CardDescription>Your name and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="John Doe"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" value={profile.email} disabled className="pl-10 bg-muted/50" />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after registration
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="San Francisco, CA"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            Professional Information
          </CardTitle>
          <CardDescription>Your headline and online presence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="headline"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="Senior Software Engineer | Full-Stack Developer"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A brief title that describes your professional identity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="linkedin"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/johndoe"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio / Website</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="portfolio"
                  value={profile.portfolio}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              placeholder="A brief overview of your professional background, key skills, and career objectives..."
              rows={6}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Write 3-4 sentences highlighting your experience, strengths, and what you&apos;re
              looking for
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements & Awards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            Achievements & Awards
          </CardTitle>
          <CardDescription>
            Notable accomplishments, certifications, publications, and recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="achievements">Achievements</Label>
          <div className="border rounded-md p-3 bg-background min-h-[200px]">
            <RichTextEditor
              value={achievements}
              onChange={setAchievements}
              placeholder="• AWS Certified Solutions Architect - Professional (2024)\n• Published author: 'Modern Web Development' - O'Reilly Media\n• Winner of Best Innovation Award at TechCon 2023\n• Speaker at React Summit, JSConf, and Node.js Interactive\n\nUse bullet points or formatted text to list your achievements, awards, certifications, publications, speaking engagements, or other notable accomplishments."
              className="min-h-[180px]"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            List your professional achievements, certifications, awards, publications, conference
            talks, or other career highlights. Use the formatting toolbar for bold, italic, links,
            and bullet points.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pb-6">
        <Button onClick={handleSave} disabled={saving || !profile.name} className="min-w-[140px]">
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
