'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, FileText, FileEdit, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_LABELS = {
  resume: 'Resume',
  coverLetter: 'Cover Letter',
  supportingStatement: 'Supporting Statement',
};

const TEMPLATE_LABELS = {
  ats: 'ATS',
  modern: 'Modern',
  creative: 'Creative',
  formal: 'Formal',
};

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(docId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const filtered =
    filterType === 'all' ? documents : documents.filter((d) => d.type === filterType);

  return (
    <>
      <Header user={user} currentPath="/document" onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">
              All your resumes, cover letters and supporting statements
            </p>
          </div>
          <Button asChild>
            <Link href="/document/create">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Document
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="resume">Resumes</SelectItem>
              <SelectItem value="coverLetter">Cover Letters</SelectItem>
              <SelectItem value="supportingStatement">Supporting Statements</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} document(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm mt-1">Create your first document to get started.</p>
            <Button asChild className="mt-4">
              <Link href="/document/create">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Document
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <Link key={doc.id} href={`/document/${doc.id}`} className="group">
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight line-clamp-2">
                        {doc.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => handleDelete(doc.id, e)}
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-destructive" />
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {TYPE_LABELS[doc.type] || doc.type}
                      </Badge>
                      {doc.template && (
                        <Badge variant="secondary" className="ml-1 mt-1 text-xs">
                          {TEMPLATE_LABELS[doc.template] || doc.template}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      {doc.blocks?.length || 0} block(s)
                      {doc.updatedAt && (
                        <>
                          {' · '}
                          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </>
                      )}
                    </p>
                    {doc.jobId && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Linked to job
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
