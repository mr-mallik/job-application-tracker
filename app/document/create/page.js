'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getStarterBlocks } from '@/lib/blockSchema';

const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume' },
  { value: 'coverLetter', label: 'Cover Letter' },
  { value: 'supportingStatement', label: 'Supporting Statement' },
];

const TEMPLATES_BY_TYPE = {
  resume: [
    { value: 'ats', label: 'ATS Clean' },
    { value: 'modern', label: 'Modern' },
    { value: 'creative', label: 'Creative' },
  ],
  coverLetter: [{ value: 'formal', label: 'Formal' }],
  supportingStatement: [{ value: 'formal', label: 'Formal' }],
};

export default function CreateDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(searchParams.get('type') || 'resume');
  const [template, setTemplate] = useState('ats');
  const [jobId] = useState(searchParams.get('jobId') || null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Keep template in sync with type
  useEffect(() => {
    const templates = TEMPLATES_BY_TYPE[type] || [];
    if (templates.length > 0) {
      setTemplate(templates[0].value);
    }
  }, [type]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your document.');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const profile = userData ? JSON.parse(userData).profile : null;

      // Generate starter blocks from user profile
      const blocks = getStarterBlocks(type, profile);

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim(), type, template, blocks, jobId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create document');
      }

      const data = await res.json();
      router.push(`/document/${data.document.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const templates = TEMPLATES_BY_TYPE[type] || [];

  return (
    <>
      <Header user={user} currentPath="/document" onLogout={handleLogout} />
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/document">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Documents
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Document</CardTitle>
            <CardDescription>Choose a document type and template to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="e.g. Software Engineer Resume — Google"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templates.length > 1 && (
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {jobId && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                This document will be linked to job <code className="font-mono">{jobId}</code>.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                {creating ? 'Creating…' : 'Create Document'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/document">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
