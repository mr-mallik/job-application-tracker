'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Download,
  Check,
  FileEdit,
  Eye,
  ZoomIn,
  ZoomOut,
  Type,
  List,
  Heading,
  Bold,
  Italic,
  Link as LinkIcon,
  User,
  HelpCircle,
  FileText,
  History,
  AlertCircle,
} from 'lucide-react';
import { parseResumeMarkdown, parseDocumentMarkdown } from '@/lib/pdfParser';
import {
  RESUME_TEMPLATES,
  COVER_LETTER_TEMPLATES,
  generateResumeFromProfile,
  generateCoverLetterTemplate,
  generateSupportingStatementTemplate,
} from '@/lib/templates';
import { handleEditorShortcut, EDITOR_SHORTCUTS, getDefaultTemplate } from '@/lib/editorHelpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  saveVersion,
  getVersionHistory,
  restoreVersion,
  formatVersionTimestamp,
} from '@/lib/versionHistory';
import PDFErrorBoundary from './PDFErrorBoundary';

// Dynamic imports for react-pdf (client-side only)
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      Loading PDF viewer...
    </div>
  ),
});

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

// Direct imports for templates (dynamic imports break react-pdf rendering)
import ATSResumeTemplate from '@/components/pdf-templates/ATSResumeTemplate';
import ModernResumeTemplate from '@/components/pdf-templates/ModernResumeTemplate';
import CreativeResumeTemplate from '@/components/pdf-templates/CreativeResumeTemplate';
import CoverLetterTemplate from '@/components/pdf-templates/CoverLetterTemplate';

export function FullScreenDocumentEditor({
  job,
  documentType,
  token,
  onUpdate,
  userProfile,
  onClose,
}) {
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 },
  };
  const config = docConfig[documentType];

  const [content, setContent] = useState(job[documentType]?.content || '');
  const [refinedContent, setRefinedContent] = useState(job[documentType]?.refinedContent || '');
  const [preferences, setPreferences] = useState('');
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRefined, setShowRefined] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    documentType === 'resume' ? 'ats' : 'formal'
  );
  const [zoom, setZoom] = useState(100);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versions, setVersions] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pdfPreviewContent, setPdfPreviewContent] = useState(job[documentType]?.content || '');

  const previewContent = showRefined && refinedContent ? refinedContent : content;

  // Initialize PDF preview content on mount
  useEffect(() => {
    setPdfPreviewContent(previewContent);
  }, []);

  // Load version history on mount
  useEffect(() => {
    setVersions(getVersionHistory(job.id, documentType));
  }, [job.id, documentType]);

  // Calculate character and word counts
  const stats = useMemo(() => {
    const text = previewContent;
    return {
      characters: text.length,
      words: text.trim().split(/\s+/).filter(Boolean).length,
      lines: text.split('\n').length,
    };
  }, [previewContent]);

  // Refresh PDF preview manually
  const handleRefreshPreview = useCallback(() => {
    setPdfPreviewContent(previewContent);
    setRefreshTrigger((prev) => prev + 1);
    toast.success('Preview refreshed!');
  }, [previewContent]);

  // Parse content for PDF rendering with validation
  const parsedData = useMemo(() => {
    try {
      if (!pdfPreviewContent || pdfPreviewContent.trim().length === 0) {
        return null;
      }

      if (documentType === 'resume') {
        const parsed = parseResumeMarkdown(pdfPreviewContent);

        // Validate structure and content
        if (!parsed || !parsed.sections || !Array.isArray(parsed.sections)) {
          console.error('❌ Invalid parsed structure:', parsed);
          return null;
        }
        // Ensure sections have valid content
        const validSections = parsed.sections.filter((s) => s && s.title && Array.isArray(s.items));

        if (validSections.length === 0) {
          console.error('❌ No valid sections after filtering');
          return null;
        }
        // Ensure all items have content property
        validSections.forEach((section) => {
          const beforeCount = section.items.length;
          section.items = section.items.filter(
            (item) => item && item.content && typeof item.content === 'string'
          );
          const afterCount = section.items.length;
          if (beforeCount !== afterCount) {
          }
        });

        const result = { ...parsed, sections: validSections };

        return result;
      } else {
        const parsed = parseDocumentMarkdown(pdfPreviewContent);

        // Validate structure and content
        if (!parsed || !parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
          console.error('❌ Invalid paragraph structure');
          return null;
        }
        // Ensure paragraphs have valid content
        const validParagraphs = parsed.paragraphs.filter(
          (p) => p && p.content && typeof p.content === 'string'
        );

        if (validParagraphs.length === 0) {
          console.error('❌ No valid paragraphs');
          return null;
        }
        const result = { ...parsed, paragraphs: validParagraphs };

        return result;
      }
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      return null;
    }
  }, [pdfPreviewContent, documentType, refreshTrigger]);

  // Select appropriate template component
  const TemplateComponent = useMemo(() => {
    if (documentType === 'resume') {
      switch (selectedTemplate) {
        case 'modern':
          return ModernResumeTemplate;
        case 'creative':
          return CreativeResumeTemplate;
        default:
          return ATSResumeTemplate;
      }
    } else {
      return CoverLetterTemplate;
    }
  }, [documentType, selectedTemplate]);

  const handleRefine = async () => {
    if (!content && documentType !== 'resume') {
      toast.error('Please enter content first');
      return;
    }
    if (!job.description) {
      toast.error('Job description required');
      return;
    }

    setRefining(true);
    try {
      const res = await fetch('/api/documents/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType,
          content: documentType === 'resume' ? JSON.stringify(userProfile) : content,
          jobDescription: job.description + '\n\nRequirements:\n' + job.requirements,
          userPreferences: preferences,
          userProfile: documentType === 'resume' ? userProfile : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRefinedContent(data.refinedContent);
      setShowRefined(true);
      toast.success('Refined!');
      // Auto-refresh preview to show refined content
      setTimeout(() => {
        setPdfPreviewContent(data.refinedContent);
        setRefreshTrigger((prev) => prev + 1);
      }, 100);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRefining(false);
    }
  };

  const handleSave = useCallback(
    async (silent = false) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ [documentType]: { content, refinedContent } }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!silent) toast.success('Saved!');

        // Save to version history
        if (content) {
          saveVersion(job.id, documentType, content);
          setVersions(getVersionHistory(job.id, documentType));
        }

        setHasUnsavedChanges(false);
        onUpdate(data.job);
      } catch (error) {
        if (!silent) toast.error(error.message);
      } finally {
        setSaving(false);
      }
    },
    [job.id, documentType, content, refinedContent, token, onUpdate]
  );

  const useRefinedContent = () => {
    setContent(refinedContent);
    setRefinedContent('');
    setShowRefined(false);
    toast.success('Applied');
    // Auto-refresh preview after applying refined content
    setTimeout(() => {
      setPdfPreviewContent(refinedContent);
      setRefreshTrigger((prev) => prev + 1);
    }, 100);
  };

  const generateFromProfile = useCallback(() => {
    if (!userProfile) {
      console.error('❌ userProfile is null/undefined');
      toast.error('Profile data not available');
      return;
    }

    let generated = '';
    if (documentType === 'resume') {
      generated = generateResumeFromProfile(userProfile, selectedTemplate);
    } else if (documentType === 'coverLetter') {
      generated = generateCoverLetterTemplate(userProfile, job);
    } else if (documentType === 'supportingStatement') {
      generated = generateSupportingStatementTemplate(userProfile, job);
    }

    setContent(generated);
    toast.success('Generated from profile!');
    // Auto-refresh preview after generating
    setTimeout(() => {
      setPdfPreviewContent(generated);
      setRefreshTrigger((prev) => prev + 1);
    }, 100);
  }, [userProfile, documentType, selectedTemplate, job]);

  const loadTemplate = () => {
    const template = getDefaultTemplate(documentType);

    setContent(template);
    toast.success('Template loaded!');
    // Auto-refresh preview after loading template
    setTimeout(() => {
      setPdfPreviewContent(template);
      setRefreshTrigger((prev) => prev + 1);
    }, 100);
  };

  const handleRestoreVersion = (versionId) => {
    const restoredContent = restoreVersion(job.id, documentType, versionId);
    if (restoredContent) {
      setContent(restoredContent);
      toast.success('Version restored!');
      // Auto-refresh preview after restoring
      setTimeout(() => {
        setPdfPreviewContent(restoredContent);
        setRefreshTrigger((prev) => prev + 1);
      }, 100);
    } else {
      toast.error('Failed to restore version');
    }
  };

  // Markdown toolbar actions
  const insertMarkdown = useCallback(
    (syntax, placeholder = 'text') => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end) || placeholder;

      let newText = content;
      let newCursorPos = start;

      switch (syntax) {
        case 'bold':
          newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
          newCursorPos = start + 2;
          break;
        case 'italic':
          newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
          newCursorPos = start + 1;
          break;
        case 'heading':
          const lineStart = content.lastIndexOf('\n', start - 1) + 1;
          newText = content.substring(0, lineStart) + '# ' + content.substring(lineStart);
          newCursorPos = lineStart + 2;
          break;
        case 'bullet':
          const bulletLineStart = content.lastIndexOf('\n', start - 1) + 1;
          newText =
            content.substring(0, bulletLineStart) + '- ' + content.substring(bulletLineStart);
          newCursorPos = bulletLineStart + 2;
          break;
        case 'link':
          newText = content.substring(0, start) + `[${selectedText}](url)` + content.substring(end);
          newCursorPos = start + selectedText.length + 3;
          break;
        default:
          return;
      }

      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content]
  );

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave(true); // Silent save
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, handleSave]);

  // Auto-refresh preview when template changes
  useEffect(() => {
    if (documentType === 'resume') {
      setPdfPreviewContent(previewContent);
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [selectedTemplate]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleEditorShortcut(e, {
        bold: () => insertMarkdown('bold', 'bold text'),
        italic: () => insertMarkdown('italic', 'italic text'),
        heading: () => insertMarkdown('heading', 'Section Title'),
        link: () => insertMarkdown('link', 'link text'),
        bullet: () => insertMarkdown('bullet', 'List item'),
        save: () => handleSave(false),
        generate: generateFromProfile,
        refresh: handleRefreshPreview,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [insertMarkdown, handleSave, generateFromProfile, handleRefreshPreview]);

  // Track changes
  useEffect(() => {
    const originalContent = job[documentType]?.content || '';
    const originalRefined = job[documentType]?.refinedContent || '';
    if (content !== originalContent || refinedContent !== originalRefined) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [content, refinedContent, job, documentType]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-semibold">
              {config.label} for {job.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {job.company} • Max {config.maxPages} A4 pages
              {hasUnsavedChanges && <span className="text-orange-600"> • Unsaved changes</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Template Selector */}
          {documentType === 'resume' && (
            <>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RESUME_TEMPLATES).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <Input
            placeholder="AI Instructions (optional)..."
            className="w-64"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
          <Button
            onClick={handleRefine}
            disabled={refining}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {refining ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            {refining ? 'Refining...' : 'Refine with AI'}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(previewContent).then(() => toast.success('Copied!'))
            }
          >
            <Copy className="w-4 h-4" />
          </Button>

          {/* PDF Download Link using react-pdf */}
          {typeof window !== 'undefined' &&
            parsedData &&
            previewContent?.trim() &&
            TemplateComponent && (
              <PDFDownloadLink
                document={
                  documentType === 'resume' ? (
                    <TemplateComponent data={parsedData} />
                  ) : (
                    <TemplateComponent data={parsedData} userProfile={userProfile || {}} />
                  )
                }
                fileName={`${job.company.replace(/[^a-z0-9]/gi, '-')}-${config.label.replace(/\s+/g, '-')}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" size="sm" disabled={loading}>
                    {loading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            )}

          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Markdown Editor */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <FileEdit className="w-4 h-4" />
              Markdown Editor
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {stats.characters} chars • {stats.words} words • {stats.lines} lines
              </span>
              {refinedContent && (
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant={!showRefined ? 'default' : 'outline'}
                    className="h-7"
                    onClick={() => setShowRefined(false)}
                  >
                    Original
                  </Button>
                  <Button
                    size="sm"
                    variant={showRefined ? 'default' : 'outline'}
                    className="h-7"
                    onClick={() => setShowRefined(true)}
                  >
                    Refined
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Markdown Toolbar */}
          <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={generateFromProfile}
                title="Generate from Profile (Ctrl+G)"
              >
                <User className="w-4 h-4 mr-1" />
                <span className="text-xs">Profile</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={loadTemplate}
                title="Load Template"
              >
                <FileText className="w-4 h-4 mr-1" />
                <span className="text-xs">Template</span>
              </Button>

              {/* Version History Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    title="Version History"
                    disabled={versions.length === 0}
                  >
                    <History className="w-4 h-4 mr-1" />
                    <span className="text-xs">History</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Version History</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {versions.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                      No saved versions yet
                    </div>
                  ) : (
                    versions.map((version, idx) => (
                      <DropdownMenuItem
                        key={version.id}
                        onClick={() => handleRestoreVersion(version.id)}
                        className="flex flex-col items-start py-2"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-medium">
                            Version {versions.length - idx}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatVersionTimestamp(version.timestamp)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {version.preview}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertMarkdown('bold', 'bold text')}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertMarkdown('italic', 'italic text')}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertMarkdown('heading', 'Section Title')}
                title="Heading (Ctrl+H)"
              >
                <Heading className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertMarkdown('bullet', 'List item')}
                title="Bullet List (Ctrl+Shift+L)"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => insertMarkdown('link', 'link text')}
                title="Insert Link (Ctrl+L)"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Refresh Preview Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleRefreshPreview}
              title="Refresh Preview (Ctrl+R)"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              <span className="text-xs">Refresh</span>
            </Button>

            {/* Help Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-64">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Keyboard Shortcuts</p>
                    {EDITOR_SHORTCUTS.map((shortcut, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{shortcut.action}</span>
                        <kbd className="px-2 py-0.5 bg-muted rounded text-xs">{shortcut.key}</kbd>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {showRefined && refinedContent ? (
              <div className="h-full flex flex-col">
                <Textarea
                  className="flex-1 font-mono text-sm bg-purple-50 resize-none"
                  value={refinedContent}
                  onChange={(e) => setRefinedContent(e.target.value)}
                  spellCheck={false}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-fit"
                  onClick={useRefinedContent}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Apply to Original
                </Button>
              </div>
            ) : (
              <>
                {!content ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md">
                      <FileEdit className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          Start Creating Your {config.label}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose how you&apos;d like to begin:
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={generateFromProfile} variant="default" className="w-full">
                          <User className="w-4 h-4 mr-2" />
                          Generate from Profile
                        </Button>
                        <Button onClick={loadTemplate} variant="outline" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Load Template
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Or start typing in the editor (Ctrl+H for heading, Ctrl+B for bold)
                      </p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder={
                      documentType === 'resume'
                        ? '# PROFESSIONAL SUMMARY\nYour professional summary...\n\n# WORK EXPERIENCE\n**Job Title | Company, Location | mm/yyyy - mm/yyyy**\n- Achievement 1\n- Achievement 2\n\n# EDUCATION\n**Degree** - Institution | Graduation Date\n\n# SKILLS\nSkill 1, Skill 2, Skill 3'
                        : `Enter your ${config.label.toLowerCase()} content...\n\nUse markdown formatting:\n# for headings\n**text** for bold\n- for bullet points`
                    }
                    className="h-full font-mono text-sm resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="w-1/2 flex flex-col bg-gray-100">
          <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              PDF Preview
            </Label>
            {/* <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                disabled={zoom >= 150}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div> */}
          </div>
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
            <PDFErrorBoundary>
              {!previewContent || !previewContent.trim() ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground max-w-md">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Start typing or generate content to see the PDF preview
                    </p>
                  </div>
                </div>
              ) : !parsedData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Unable to parse content. Check your markdown formatting.
                    </p>
                  </div>
                </div>
              ) : documentType !== 'resume' && !userProfile ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground max-w-md">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">User profile is required to preview this document</p>
                  </div>
                </div>
              ) : typeof window !== 'undefined' && parsedData && TemplateComponent ? (
                <div className="w-full h-full overflow-auto flex justify-center">
                  <div style={{ width: `${zoom}%`, minWidth: '595px' }}>
                    <PDFViewer
                      width="100%"
                      height="842"
                      showToolbar={false}
                      className="border-0 rounded shadow-lg"
                    >
                      {documentType === 'resume' ? (
                        <TemplateComponent data={parsedData} />
                      ) : (
                        <TemplateComponent data={parsedData} userProfile={userProfile || {}} />
                      )}
                    </PDFViewer>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Loading preview...</p>
                  </div>
                </div>
              )}
            </PDFErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
