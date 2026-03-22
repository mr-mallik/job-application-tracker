'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, X, RefreshCw, Save, Mail, TrendingUp, Briefcase } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function JobSearchPage() {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const savedKeywords = data.user.profile?.jobSearchKeywords || [];
        const savedAutoSearch = data.user.profile?.autoJobSearchEnabled ?? true;
        setKeywords(savedKeywords);
        setAutoSearchEnabled(savedAutoSearch);
      }
    } catch (error) {
      console.error('Failed to load keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job search keywords',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) {
      toast({
        title: 'Invalid Keyword',
        description: 'Please enter a keyword',
        variant: 'destructive',
      });
      return;
    }

    if (keywords.includes(trimmed)) {
      toast({
        title: 'Duplicate Keyword',
        description: 'This keyword already exists',
        variant: 'destructive',
      });
      return;
    }

    setKeywords([...keywords, trimmed]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSave = async () => {
    if (keywords.length === 0) {
      toast({
        title: 'No Keywords',
        description: 'Please add at least one job search keyword',
        variant: 'destructive',
      });
      return;
    }

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
          profile: {
            jobSearchKeywords: keywords,
            autoJobSearchEnabled: autoSearchEnabled,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data.user));

        toast({
          title: 'Success',
          description: 'Job search preferences saved successfully',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automated Job Search</h1>
        <p className="text-muted-foreground mt-2">
          Configure keywords to automatically discover and receive job opportunities daily
        </p>
      </div>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Our system searches multiple job boards daily using your keywords and emails you
          personalized job matches. Save time and never miss an opportunity!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Job Search Keywords
              </CardTitle>
              <CardDescription>
                Add keywords related to job titles, skills, or industries you&apos;re interested in
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-search" className="text-sm font-normal cursor-pointer">
                Enable Daily Search
              </Label>
              <Switch
                id="auto-search"
                checked={autoSearchEnabled}
                onCheckedChange={setAutoSearchEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="new-keyword">Add New Keyword</Label>
            <div className="flex gap-2">
              <Input
                id="new-keyword"
                placeholder="e.g., Full Stack Developer, React, Python, Data Analyst"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleAddKeyword} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Press Enter or click + to add a keyword</p>
          </div>

          {/* Keywords Display */}
          {keywords.length > 0 ? (
            <div className="space-y-2">
              <Label>Your Keywords ({keywords.length})</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg min-h-[100px]">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    <Briefcase className="w-3 h-3" />
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed rounded-lg">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No keywords added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add keywords above to start receiving job recommendations
              </p>
            </div>
          )}

          {/* Email Notification Info */}
          {autoSearchEnabled && keywords.length > 0 && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>Daily Email Notifications</AlertTitle>
              <AlertDescription>
                You&apos;ll receive an email with up to 50 new job matches daily based on your
                keywords. Jobs are automatically filtered to avoid duplicates.
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-semibold">Tips for better results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                Use specific job titles (e.g., &quot;Senior React Developer&quot; vs
                &quot;Developer&quot;)
              </li>
              <li>
                Include key technologies or skills (e.g., &quot;Machine Learning&quot;,
                &quot;AWS&quot;)
              </li>
              <li>Add industry terms (e.g., &quot;Fintech&quot;, &quot;Healthcare IT&quot;)</li>
              <li>Mix broad and specific terms for comprehensive coverage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
