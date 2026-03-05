'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PlusCircle, FileText, FileUser, Mail, ScrollText, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TYPE_CONFIG = {
  resume: {
    label: 'Resume',
    icon: FileUser,
    className:
      'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/40',
  },
  coverLetter: {
    label: 'Cover Letter',
    icon: Mail,
    className:
      'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/40',
  },
  supportingStatement: {
    label: 'Supporting Statement',
    icon: ScrollText,
    className:
      'text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:bg-violet-950/40',
  },
};

const TEMPLATE_LABELS = {
  ats: 'ATS',
  modern: 'Modern',
  creative: 'Creative',
  formal: 'Formal',
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg)
    return (
      <Badge variant="outline" className="text-xs">
        {type}
      </Badge>
    );
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-xs inline-flex items-center gap-1 ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [jobsMap, setJobsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/documents/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setDocuments((prev) => prev.filter((d) => !selected.has(d.id)));
      setSelected(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((d) => d.id)));
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

      <main className="max-w-7xl mx-auto px-4 py-8">
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
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setSelected(new Set());
            }}
          >
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

          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete {selected.size} selected
            </Button>
          )}
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
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-50">Type</TableHead>
                  <TableHead className="w-24">Template</TableHead>
                  <TableHead className="w-36">Last Updated</TableHead>
                  <TableHead className="w-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const linkedJob = doc.jobId ? jobsMap[doc.jobId] : null;
                  const isSelected = selected.has(doc.id);
                  return (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer"
                      data-state={isSelected ? 'selected' : undefined}
                      onClick={() => router.push(`/document/${doc.id}`)}
                    >
                      <TableCell className="pl-4" onClick={(e) => toggleSelect(doc.id, e)}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          aria-label={`Select ${doc.title}`}
                        />
                      </TableCell>
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
                        ) : (
                          <span className="text-xs text-muted-foreground"></span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={doc.type} />
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(new Set([doc.id]));
                            setBulkDeleteOpen(true);
                          }}
                          disabled={bulkDeleting}
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Bulk delete confirmation dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selected.size} document{selected.size !== 1 ? 's' : ''}?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {selected.size} document{selected.size !== 1 ? 's' : ''}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
