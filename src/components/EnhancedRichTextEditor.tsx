import React from 'react';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Code, 
  Quote,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EnhancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
  showPreview = true
}) => {
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);
      heading.style.fontWeight = 'bold';
      heading.style.fontSize = level === 1 ? '1.875rem' : level === 2 ? '1.5rem' : '1.25rem';
      heading.style.lineHeight = '1.2';
      heading.style.margin = '1rem 0 0.5rem 0';
      
      try {
        range.surroundContents(heading);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (e) {
        // If selection spans multiple elements, insert at cursor position
        heading.textContent = 'New Heading';
        range.insertNode(heading);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    }
  };

  const insertLink = () => {
    if (linkUrl.trim()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText || linkUrl;
        link.style.color = '#2563eb';
        link.style.textDecoration = 'underline';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        range.deleteContents();
        range.insertNode(link);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      execCommand('insertOrderedList');
    } else {
      execCommand('insertUnorderedList');
    }
  };

  const insertQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const blockquote = document.createElement('blockquote');
      blockquote.style.borderLeft = '4px solid #e5e7eb';
      blockquote.style.paddingLeft = '1rem';
      blockquote.style.margin = '1rem 0';
      blockquote.style.fontStyle = 'italic';
      blockquote.style.color = '#6b7280';
      blockquote.style.backgroundColor = '#f9fafb';
      blockquote.style.padding = '0.75rem 1rem';
      blockquote.style.borderRadius = '0.375rem';
      
      try {
        range.surroundContents(blockquote);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (e) {
        // If selection spans multiple elements, insert at cursor position
        blockquote.textContent = 'Quote text here...';
        range.insertNode(blockquote);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    }
  };

  const insertCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.style.backgroundColor = '#f3f4f6';
      code.style.padding = '0.75rem';
      code.style.borderRadius = '0.375rem';
      code.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
      code.style.fontSize = '0.875rem';
      code.style.display = 'block';
      code.style.whiteSpace = 'pre-wrap';
      code.style.border = '1px solid #e5e7eb';
      
      pre.appendChild(code);
      
      try {
        range.surroundContents(code);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (e) {
        // If selection spans multiple elements, insert at cursor position
        code.textContent = 'Code goes here...';
        range.insertNode(pre);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    }
  };

  const formatText = (format: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      
      switch (format) {
        case 'highlight':
          span.style.backgroundColor = '#fef3c7';
          span.style.padding = '0.125rem 0.25rem';
          span.style.borderRadius = '0.25rem';
          break;
        case 'underline':
          span.style.textDecoration = 'underline';
          break;
      }
      
      try {
        range.surroundContents(span);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (e) {
        console.error('Could not apply formatting:', e);
      }
    }
  };

  React.useEffect(() => {
    if (editorRef.current && !isPreviewMode) {
      editorRef.current.innerHTML = content;
      // Force LTR on mount and content changes
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
      editorRef.current.style.unicodeBidi = 'bidi-override';
    }
  }, [content, isPreviewMode]);

  // Additional effect to ensure LTR is maintained
  React.useEffect(() => {
    const element = editorRef.current;
    if (element) {
      const observer = new MutationObserver(() => {
        element.style.direction = 'ltr';
        element.style.textAlign = 'left';
        element.style.unicodeBidi = 'bidi-override';
      });
      observer.observe(element, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isPreviewMode) {
      // Force LTR direction on input
      const element = e.currentTarget;
      element.style.direction = 'ltr';
      element.style.textAlign = 'left';
      element.style.unicodeBidi = 'bidi-override';
      onChange(element.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ensure cursor behavior is LTR
    const element = e.currentTarget;
    element.style.direction = 'ltr';
    element.style.textAlign = 'left';
  };

  return (
    <div className={`enhanced-editor border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant={!isPreviewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPreviewMode(false)}
              className="text-xs"
            >
              Edit
            </Button>
            {showPreview && (
              <Button
                variant={isPreviewMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsPreviewMode(true)}
                className="text-xs"
              >
                Preview
              </Button>
            )}
          </div>

          {!isPreviewMode && (
            <>
              {/* Headings */}
              <Select onValueChange={(value) => insertHeading(parseInt(value))}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1</SelectItem>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Text Formatting */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('bold')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('italic')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('underline')}
                title="Underline"
              >
                <Type className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Lists */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertList(false)}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertList(true)}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Code and Quote */}
              <Button
                variant="ghost"
                size="sm"
                onClick={insertCode}
                title="Code Block"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertQuote}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Link */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Undo/Redo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('undo')}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('redo')}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor/Preview */}
      {isPreviewMode ? (
        <div 
          className="min-h-[200px] p-4 prose prose-sm max-w-none bg-white"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            direction: 'ltr',
            textAlign: 'left',
            '--tw-prose-body': '#374151',
            '--tw-prose-headings': '#111827',
            '--tw-prose-links': '#2563eb',
            '--tw-prose-bold': '#111827',
            '--tw-prose-counters': '#6b7280',
            '--tw-prose-bullets': '#d1d5db',
            '--tw-prose-hr': '#e5e7eb',
            '--tw-prose-quotes': '#111827',
            '--tw-prose-quote-borders': '#e5e7eb',
            '--tw-prose-captions': '#6b7280',
            '--tw-prose-code': '#111827',
            '--tw-prose-pre-code': '#e5e7eb',
            '--tw-prose-pre-bg': '#1f2937',
            '--tw-prose-th-borders': '#d1d5db',
            '--tw-prose-td-borders': '#e5e7eb',
          } as React.CSSProperties}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] p-4 focus:outline-none bg-white"
          onInput={handleInput}
          onBlur={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            e.currentTarget.style.direction = 'ltr';
            e.currentTarget.style.textAlign = 'left';
          }}
          dir="ltr"
          lang="en"
          style={{
            direction: 'ltr',
            textAlign: 'left',
            unicodeBidi: 'bidi-override',
            writingMode: 'horizontal-tb',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#374151'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      )}

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    insertLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
          .enhanced-editor [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            direction: ltr;
            text-align: left;
            unicode-bidi: bidi-override;
          }
          .enhanced-editor [contenteditable] {
            direction: ltr !important;
            text-align: left !important;
            unicode-bidi: bidi-override !important;
            writing-mode: horizontal-tb !important;
            font-family: Inter, system-ui, -apple-system, sans-serif !important;
          }
          .enhanced-editor [contenteditable] * {
            direction: ltr !important;
            unicode-bidi: bidi-override !important;
            writing-mode: horizontal-tb !important;
          }
          .enhanced-editor [contenteditable] p,
          .enhanced-editor [contenteditable] div,
          .enhanced-editor [contenteditable] span {
            direction: ltr !important;
            text-align: left !important;
            unicode-bidi: bidi-override !important;
          }
        `
      }} />
    </div>
  );
};
