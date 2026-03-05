'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  File,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  ArrowUpFromLine,
  Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DOC_TYPES = [
  {
    type: 'resume',
    label: 'Resume',
    icon: File,
    legacyKey: 'resume',
    defaultTemplate: 'ats',
  },
  {
    type: 'coverLetter',
    label: 'Cover Letter',
    icon: FileSpreadsheet,
    legacyKey: 'coverLetter',
    defaultTemplate: 'formal',
  },
  {
    type: 'supportingStatement',
    label: 'Supporting Statement',
    icon: FileText,
    legacyKey: 'supportingStatement',
    defaultTemplate: 'formal',
  },
];

const TEMPLATE_LABELS = { ats: 'ATS', modern: 'Modern', creative: 'Creative', formal: 'Formal' };

function hasLegacyContent(job, legacyKey) {
  const field = job?.[legacyKey];
  return !!(field?.content?.trim() || field?.refinedContent?.trim());
}

export function JobDocumentsTab({ job, token }) {
  const router = useRouter();
  const [documents, setDocuments] = useState(job.documents || []);
  const [loadingDocId, setLoadingDocId] = useState(null); // documentId being migrated/loaded
  const [migratingType, setMigratingType] = useState(null);

  // Re-sync if parent job updates
  useEffect(() => {
    if (job.documents) setDocuments(job.documents);
  }, [job.documents]);

  // Fetch latest linked docs (the job list endpoint omits versions but includes the rest)
  useEffect(() => {
    let cancelled = false;
    async function fetchDocs() {
      try {
        const res = await fetch(`/api/documents/job/${job.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch {
        // silently ignore
      }
    }
    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [job.id, token]);

  const handleMigrate = async (documentType) => {
    setMigratingType(documentType);
    try {
      const res = await fetch('/api/documents/migrate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id, documentType }),
      });
      if (!res.ok) throw new Error('Migration failed');
      const data = await res.json();
      // Navigate to the new (or existing) document
      router.push(`/document/${data.document.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setMigratingType(null);
    }
  };

  const handleOpenDoc = (docId) => {
    router.push(`/document/${docId}`);
  };

  return (
    <div className="space-y-6">
      {DOC_TYPES.map(({ type, label, icon: Icon, legacyKey }) => {
        const linked = documents.filter((d) => d.type === type);
        const legacy = hasLegacyContent(job, legacyKey);
        const isMigrating = migratingType === type;

        return (
          <section key={type}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {label}
                {linked.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {linked.length}
                  </Badge>
                )}
              </h4>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
                <Link href={`/document/create?jobId=${job.id}&type=${type}`}>
                  <PlusCircle className="w-3 h-3" />
                  New
                </Link>
              </Button>
            </div>

            {/* Existing linked documents */}
            {linked.length > 0 && (
              <div className="space-y-2 mb-3">
                {linked.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/30 hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDoc(doc.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {TEMPLATE_LABELS[doc.template] || doc.template}
                        {doc.updatedAt && (
                          <>
                            {' '}
                            · {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDoc(doc.id);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy migration card — only show if legacy content exists and no linked docs yet */}
            {legacy && linked.length === 0 && (
              <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2">
                  Legacy {label.toLowerCase()} content found
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Migrate the existing content into the new block editor to keep editing it.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 border-amber-400/60 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  onClick={() => handleMigrate(type)}
                  disabled={isMigrating}
                >
                  {isMigrating ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-3 h-3" />
                  )}
                  {isMigrating ? 'Migrating…' : 'Migrate & Open'}
                </Button>
              </div>
            )}

            {/* Empty state (no legacy, no docs) */}
            {!legacy && linked.length === 0 && (
              <p className="text-xs text-muted-foreground pl-1">
                No {label.toLowerCase()} yet.{' '}
                <Link
                  href={`/document/create?jobId=${job.id}&type=${type}`}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Create one
                </Link>
                .
              </p>
            )}

            <Separator className="mt-4" />
          </section>
        );
      })}
    </div>
  );
}
