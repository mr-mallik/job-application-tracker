'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import DocumentToolbar from './DocumentToolbar';
import BlockCanvas from './BlockCanvas';
import AIRefineDialog from './AIRefineDialog';

// PDFPreviewPanel directly imports @react-pdf/renderer templates — must be client-only
const PDFPreviewPanel = dynamic(() => import('./PDFPreviewPanel'), { ssr: false });

const AUTOSAVE_DELAY = 2000; // ms

export default function DocumentEditorPage({ documentId }) {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [doc, setDoc] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('ats');
  const [documentType, setDocumentType] = useState('resume');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const saveTimerRef = useRef(null);
  const dirtyRef = useRef(false);

  // ── Load document ─────────────────────────────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        toast({ title: 'Document not found', variant: 'destructive' });
        router.push('/document');
        return;
      }

      if (!res.ok) throw new Error('Failed to load document');

      const data = await res.json();
      const loaded = data.document;

      setDoc(loaded);
      setTitle(loaded.title || '');
      setTemplate(loaded.template || 'ats');
      setDocumentType(loaded.type || 'resume');
      setBlocks(loaded.blocks || []);
      setIsDirty(false);
      dirtyRef.current = false;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error loading document', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveNow = useCallback(
    async (currentBlocks, currentTitle, currentTemplate) => {
      if (!dirtyRef.current) return;
      setIsSaving(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            blocks: currentBlocks,
            title: currentTitle,
            template: currentTemplate,
          }),
        });

        if (!res.ok) throw new Error('Save failed');
        setIsDirty(false);
        dirtyRef.current = false;
      } catch (err) {
        console.error(err);
        toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    },
    [documentId, toast]
  );

  // Debounced autosave
  const scheduleAutosave = useCallback(
    (newBlocks, newTitle, newTemplate) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveNow(newBlocks, newTitle, newTemplate);
      }, AUTOSAVE_DELAY);
    },
    [saveNow]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const markDirty = () => {
    setIsDirty(true);
    dirtyRef.current = true;
  };

  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    markDirty();
    scheduleAutosave(newBlocks, title, template);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    markDirty();
    scheduleAutosave(blocks, newTitle, template);
  };

  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate);
    markDirty();
    scheduleAutosave(blocks, title, newTemplate);
  };

  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveNow(blocks, title, template);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header user={user} currentPath="/document" onLogout={handleLogout} />

      <DocumentToolbar
        title={title}
        documentType={documentType}
        template={template}
        blocks={blocks}
        isSaving={isSaving}
        isDirty={isDirty}
        onTitleChange={handleTitleChange}
        onTemplateChange={handleTemplateChange}
        onSave={handleManualSave}
        aiRefineSlot={
          <AIRefineDialog
            documentType={documentType}
            blocks={blocks}
            jobId={doc?.jobId || null}
            onApply={(newBlocks) => {
              handleBlocksChange(newBlocks);
            }}
          />
        }
      />

      {/* Editor + Preview split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block canvas (scrollable left panel) */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-6 transition-all',
            showPreview ? 'max-w-xl lg:max-w-2xl' : 'max-w-3xl mx-auto w-full'
          )}
        >
          <BlockCanvas blocks={blocks} documentType={documentType} onChange={handleBlocksChange} />
        </div>

        {/* Toggle button */}
        <div className="flex items-start pt-4 px-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={showPreview ? 'Hide preview' : 'Show preview'}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* PDF Preview panel */}
        {showPreview && (
          <div className="w-[480px] xl:w-[540px] shrink-0 border-l bg-muted/10 overflow-hidden">
            <PDFPreviewPanel blocks={blocks} template={template} />
          </div>
        )}
      </div>
    </div>
  );
}
