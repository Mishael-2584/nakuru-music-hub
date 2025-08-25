import { Textarea } from './textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function RichTextEditor({ value, onChange, label, required }: RichTextEditorProps) {
  return (
    <div>
      {label && <label className="block mb-1 font-medium">{label}{required && <span className="text-red-500">*</span>}</label>}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[160px]"
        placeholder="Enter your content here..."
      />
    </div>
  );
} 