import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from './button';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Highlighter } from 'lucide-react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function RichTextEditor({ value, onChange, label, required }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose min-h-[160px] p-2 border rounded-md bg-white focus:outline-none',
      },
    },
  });

  return (
    <div>
      {label && <label className="block mb-1 font-medium">{label}{required && <span className="text-red-500">*</span>}</label>}
      <div className="border rounded-md bg-white mb-2">
        <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-md">
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold" className={editor?.isActive('bold') ? 'bg-primary/10' : ''}><Bold className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic" className={editor?.isActive('italic') ? 'bg-primary/10' : ''}><Italic className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleUnderline().run()} aria-label="Underline" className={editor?.isActive('underline') ? 'bg-primary/10' : ''}><UnderlineIcon className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bullet List" className={editor?.isActive('bulletList') ? 'bg-primary/10' : ''}><List className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Ordered List" className={editor?.isActive('orderedList') ? 'bg-primary/10' : ''}><ListOrdered className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => {
            const url = window.prompt('Enter a URL');
            if (url) editor?.chain().focus().setLink({ href: url }).run();
          }} aria-label="Link"><LinkIcon className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().unsetLink().run()} aria-label="Remove Link">Unlink</Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().setTextAlign('left').run()} aria-label="Align Left"><AlignLeft className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().setTextAlign('center').run()} aria-label="Align Center"><AlignCenter className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().setTextAlign('right').run()} aria-label="Align Right"><AlignRight className="w-4 h-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => editor?.chain().focus().toggleHighlight().run()} aria-label="Highlight" className={editor?.isActive('highlight') ? 'bg-yellow-100' : ''}><Highlighter className="w-4 h-4" /></Button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
} 