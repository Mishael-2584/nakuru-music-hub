import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Code, 
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SimpleTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
  showPreview = true
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    onChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertLink = () => {
    if (linkUrl.trim()) {
      const displayText = linkText.trim() || linkUrl;
      insertText(`[${displayText}](`, ')', linkUrl);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering
    let html = text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Handle lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>');
    
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol style="margin: 8px 0; padding-left: 20px;">$1</ol>');

    // Handle quotes
    html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 12px; margin: 8px 0; color: #6b7280; font-style: italic;">$1</blockquote>');

    return html;
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
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
              {/* Text Formatting */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('**', '**', 'bold text')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('*', '*', 'italic text')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Lists */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('- ', '', 'list item')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('1. ', '', 'list item')}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Code and Quote */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('`', '`', 'code')}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('> ', '', 'quote text')}
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
            </>
          )}
        </div>
      </div>

      {/* Editor/Preview */}
      {isPreviewMode ? (
        <div 
          className="min-h-[200px] p-4 bg-white prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
          style={{
            direction: 'ltr',
            textAlign: 'left'
          }}
        />
      ) : (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] border-0 resize-none focus:ring-0 focus:border-0 rounded-none"
          style={{
            direction: 'ltr',
            textAlign: 'left'
          }}
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
    </div>
  );
};
