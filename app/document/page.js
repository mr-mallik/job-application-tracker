'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, FileText, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const [jobsMap, setJobsMap] = useState({});
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
      const [docsRes, jobsRes] = await Promise.all([
        fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!docsRes.ok) throw new Error('Failed to load documents');
      const docsData = await docsRes.json();
      setDocuments(docsData.documents || []);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const map = {};
        for (const job of jobsData.jobs || []) {
          map[job.id] = { title: job.title, company: job.company };
        }
        setJobsMap(map);
      }
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
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-36">Type</TableHead>
                  <TableHead className="w-24">Template</TableHead>
                  <TableHead className="w-36">Last Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const linkedJob = doc.jobId ? jobsMap[doc.jobId] : null;
                  return (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <TableCell className="font-medium">
                        {doc.title}
                        {linkedJob ? (
                          <div className="flex items-start gap-1.5 text-xs mt-2 text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">{linkedJob.title}</span>
                              {linkedJob.company && (
                                <span className="text-muted-foreground ml-1">
                                  · {linkedJob.company}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : doc.jobId ? (
                          <span className="text-xs text-muted-foreground">Linked to job</span>
                        ) : (
                          <span className="text-xs text-muted-foreground"></span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[doc.type] || doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {TEMPLATE_LABELS[doc.template] || doc.template || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.updatedAt
                          ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(doc.id, e)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </>
  );
}
