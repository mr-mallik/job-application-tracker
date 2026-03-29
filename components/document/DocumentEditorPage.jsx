'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RefreshCw, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import DocumentToolbar from './DocumentToolbar';
import DocumentCanvas from './DocumentCanvas';
import FloatingDocToolbar from './FloatingDocToolbar';
import AIRefineDialog from './AIRefineDialog';
import { migrateBlocks, getStarterBlocks, blocksToPreview } from '@/lib/blockSchema';
import { slateToText, ensureSlate } from '@/lib/slateUtils';

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
  const [styleOverrides, setStyleOverrides] = useState({});

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewBlocks, setPreviewBlocks] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selection
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // Undo / Redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyPast = useRef([]); // Block[][] — snapshots before each change
  const historyFuture = useRef([]); // Block[][] — snapshots after undos

  // AI refine state
  const [isRefining, setIsRefining] = useState(false);

  // Drag mode state
  const [isDragMode, setIsDragMode] = useState(false);

  // Ref to DocumentCanvas imperative API
  const canvasRef = useRef(null);

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
      const migratedBlocks = migrateBlocks(loaded.blocks || []);

      setDoc(loaded);
      setTitle(loaded.title || '');
      setTemplate(loaded.template || 'ats');
      setDocumentType(loaded.type || 'resume');
      setStyleOverrides(loaded.styleOverrides || {});
      setBlocks(migratedBlocks);
      setPreviewBlocks(migratedBlocks);
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
    async (currentBlocks, currentTitle, currentTemplate, currentStyleOverrides) => {
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
            styleOverrides: currentStyleOverrides,
          }),
        });

        if (!res.ok) throw new Error('Save failed');
        setPreviewBlocks(currentBlocks); // sync preview after every save
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
    (newBlocks, newTitle, newTemplate, newStyleOverrides) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveNow(newBlocks, newTitle, newTemplate, newStyleOverrides);
      }, AUTOSAVE_DELAY);
    },
    [saveNow]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const markDirty = () => {
    setIsDirty(true);
    dirtyRef.current = true;
  };

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const pushHistory = useCallback((snapshot) => {
    historyPast.current.push(snapshot);
    if (historyPast.current.length > 80) historyPast.current.shift();
    historyFuture.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (!historyPast.current.length) return;
    const prev = historyPast.current.pop();
    historyFuture.current.push(blocks);
    setBlocks(prev);
    setSelectedBlockId(null);
    setCanUndo(historyPast.current.length > 0);
    setCanRedo(true);
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const handleRedo = useCallback(() => {
    if (!historyFuture.current.length) return;
    const next = historyFuture.current.pop();
    historyPast.current.push(blocks);
    setBlocks(next);
    setSelectedBlockId(null);
    setCanUndo(true);
    setCanRedo(historyFuture.current.length > 0);
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNow(blocks, title, template, styleOverrides);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo, saveNow, blocks, title, template, styleOverrides]);

  const handleBlocksChange = (newBlocks) => {
    pushHistory(blocks);
    setBlocks(newBlocks);
    markDirty();
    scheduleAutosave(newBlocks, title, template, styleOverrides);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    markDirty();
    scheduleAutosave(blocks, newTitle, template, styleOverrides);
  };

  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate);
    markDirty();
    scheduleAutosave(blocks, title, newTemplate, styleOverrides);
  };

  const handleStyleChange = (newStyleOverrides) => {
    setStyleOverrides(newStyleOverrides);
    markDirty();
    scheduleAutosave(blocks, title, template, newStyleOverrides);
  };

  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveNow(blocks, title, template, styleOverrides);
  };

  const handleFetchFromProfile = () => {
    const userData = localStorage.getItem('user');
    console.log('Fetched user data from localStorage for profile population:', userData);
    const profile = userData ? JSON.parse(userData).profile : null;
    // Add .name to profile for personalized greetings in templates
    if (profile && !profile.name && JSON.parse(userData).name) {
      profile.name = JSON.parse(userData).name;
    }
    // for email
    if (profile && !profile.email && JSON.parse(userData).email) {
      profile.email = JSON.parse(userData).email;
    }
    console.log('Fetched profile for document population:', profile);
    const newBlocks = getStarterBlocks('resume', profile);
    handleBlocksChange(newBlocks);
    toast({
      title: 'Profile data loaded',
      description: 'Document has been populated from your profile.',
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleDocumentDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/document');
    } catch (err) {
      console.error(err);
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ── Canvas proxy helpers (delegate to DocumentCanvas imperative API) ───────
  const handleAddBlock = useCallback(
    (type) => {
      // canvasRef.current.addBlock inserts after selectedBlockId (or at end)
      // and internally calls onChange + selects the new block
      canvasRef.current?.addBlock(type, selectedBlockId);
    },
    [selectedBlockId]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedBlockId) return;
    canvasRef.current?.deleteBlock(selectedBlockId);
  }, [selectedBlockId]);

  const handleMoveUp = useCallback(() => {
    if (!selectedBlockId) return;
    canvasRef.current?.moveUp(selectedBlockId);
  }, [selectedBlockId]);

  const handleMoveDown = useCallback(() => {
    if (!selectedBlockId) return;
    canvasRef.current?.moveDown(selectedBlockId);
  }, [selectedBlockId]);

  // ── AI refine selected block ──────────────────────────────────────────────
  const handleAIRefineBlock = useCallback(
    async (instructions) => {
      if (!selectedBlockId || isRefining) return;
      const block = canvasRef.current?.getBlock(selectedBlockId);
      if (!block) return;

      // Extract plain text from the block
      const slateVal = block.data?.slateContent;
      const plainText = slateVal ? slateToText(slateVal) : block.data?.text || '';
      if (!plainText.trim()) {
        toast({ title: 'Block has no text to refine', variant: 'destructive' });
        return;
      }

      setIsRefining(true);
      try {
        const token = localStorage.getItem('token');

        // Fetch job description for context if available
        let jobDescription = '';
        if (doc?.jobId) {
          try {
            const jobRes = await fetch(`/api/jobs/${doc.jobId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (jobRes.ok) {
              const jobData = await jobRes.json();
              jobDescription = jobData.job?.description || '';
            }
          } catch {
            /* ignore, context is optional */
          }
        }

        const res = await fetch('/api/documents/refine-block', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: plainText, instructions, jobDescription }),
        });

        if (!res.ok) throw new Error('Refine request failed');
        const data = await res.json();

        // Apply refined text back to the block.
        // updateSelectedBlock → onChange → handleBlocksChange, which already
        // calls pushHistory(blocks) before applying the change.
        canvasRef.current?.updateSelectedBlock((b) => ({
          ...b,
          data: {
            ...b.data,
            text: data.refinedText,
            slateContent: ensureSlate(data.refinedText),
            // keep slateContent alias for TEXT/BULLET; plain `text` for others
            ...(b.data?.slateContent !== undefined
              ? { slateContent: ensureSlate(data.refinedText) }
              : {}),
          },
        }));

        toast({ title: 'Block refined', description: 'AI improvements applied.' });
      } catch (err) {
        console.error(err);
        toast({ title: 'Refine failed', description: err.message, variant: 'destructive' });
      } finally {
        setIsRefining(false);
      }
    },
    [selectedBlockId, isRefining, blocks, doc, toast]
  );

  // ── Toggle drag mode ──────────────────────────────────────────────────────
  const handleToggleDragMode = useCallback(() => {
    canvasRef.current?.toggleDragMode();
    setIsDragMode(canvasRef.current?.isDragMode ?? false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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
          onFetchFromProfile={documentType === 'resume' ? handleFetchFromProfile : undefined}
          onDeleteClick={() => setDeleteOpen(true)}
          styleOverrides={styleOverrides}
          jobId={doc?.jobId || null}
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

        {/* Editor: A4 canvas fills remaining space, scrollable */}
        <div className="flex flex-1 overflow-hidden">
          {/* Floating toolbar — left side */}
          <FloatingDocToolbar
            selectedBlock={blocks.find((b) => b.id === selectedBlockId) ?? null}
            selectedBlockIdx={blocks.findIndex((b) => b.id === selectedBlockId)}
            totalBlocks={blocks.length}
            documentType={documentType}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAddBlock={handleAddBlock}
            onDeleteSelected={handleDeleteSelected}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onAIRefine={handleAIRefineBlock}
            isRefining={isRefining}
            jobId={doc?.jobId || null}
            resumeText={documentType === 'resume' ? blocksToPreview(blocks, 8000) : ''}
            isDragMode={isDragMode}
            onToggleDragMode={handleToggleDragMode}
            styleOverrides={styleOverrides}
            onStyleChange={handleStyleChange}
          />

          {/* Scrollable A4 canvas area */}
          <div
            className="flex-1 overflow-y-auto bg-muted/30 p-8"
            onClick={() => setSelectedBlockId(null)}
          >
            <DocumentCanvas
              ref={canvasRef}
              blocks={blocks}
              documentType={documentType}
              onChange={handleBlocksChange}
              jobId={doc?.jobId || null}
              selectedBlockId={selectedBlockId}
              onSelectionChange={setSelectedBlockId}
              userProfile={user ? { name: user.name, email: user.email, ...user.profile } : null}
              styleOverrides={styleOverrides}
            />
          </div>

          {/* Toggle button */}
          <div className="flex items-start pt-4 px-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={showPreview ? 'Hide PDF preview' : 'Show PDF preview'}
              onClick={() => {
                if (!showPreview) setPreviewBlocks([...blocks]); // refresh preview on open
                setShowPreview((v) => !v);
              }}
            >
              {showPreview ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* PDF Preview panel — only re-renders when previewBlocks changes */}
          {showPreview && (
            <div className="w-[480px] xl:w-[540px] shrink-0 border-l bg-muted/10 overflow-hidden">
              <PDFPreviewPanel
                blocks={previewBlocks}
                template={template}
                styleOverrides={styleOverrides}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Document Confirmation Dialog ──────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription className="pt-1">
              <strong>&ldquo;{title || 'Untitled'}&rdquo;</strong> will be permanently deleted. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDocumentDelete}
              disabled={isDeleting}
            >
              {isDeleting && <RefreshCw className="w-3 h-3 mr-2 animate-spin" />}
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
