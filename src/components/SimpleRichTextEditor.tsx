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
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  className = ""
}) => {
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const editorRef = React.useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl.trim()) {
      execCommand('createLink', linkUrl);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
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
      
      range.surroundContents(blockquote);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
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
      code.style.padding = '0.5rem';
      code.style.borderRadius = '0.375rem';
      code.style.fontFamily = 'monospace';
      code.style.fontSize = '0.875rem';
      
      pre.appendChild(code);
      range.surroundContents(code);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  React.useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
        <div className="flex flex-wrap items-center gap-1">
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
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        style={{
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
        data-placeholder={placeholder}
      />

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
