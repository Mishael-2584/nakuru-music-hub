import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, Trash2, Download, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileAttachment {
  id?: string;
  file?: File;
  file_name: string;
  file_url?: string;
  file_size: number;
  file_type: string;
  uploaded?: boolean;
}

interface PostFileUploadProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  postId?: string;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string;
  showUploadedFiles?: boolean;
}

export const PostFileUpload: React.FC<PostFileUploadProps> = ({
  attachments,
  onAttachmentsChange,
  postId,
  disabled = false,
  maxFiles = 5,
  acceptedTypes = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.zip,.rar,.ppt,.pptx,.pps,.ppsx",
  showUploadedFiles = true
}) => {
  const [uploading, setUploading] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate clean file name without timestamp prefix
  const generateCleanFileName = (originalName: string): string => {
    // Remove any existing timestamp prefix
    const cleanName = originalName.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/, '');
    
    // Sanitize filename - remove special characters except dots and dashes
    const sanitized = cleanName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Ensure unique filename by adding random suffix if needed
    const nameParts = sanitized.split('.');
    const extension = nameParts.pop();
    const baseName = nameParts.join('.');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${baseName}_${randomSuffix}.${extension}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (attachments.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive'
      });
      return;
    }

    const newAttachments: FileAttachment[] = files.map(file => ({
      file,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded: false
    }));

    onAttachmentsChange([...attachments, ...newAttachments]);
    
    // Clear the input
    event.target.value = '';
  };

  const uploadFile = async (attachment: FileAttachment, index: number) => {
    if (!attachment.file || attachment.uploaded) return;

    const fileId = `${index}-${attachment.file_name}`;
    setUploading(prev => [...prev, fileId]);

    try {
      const cleanFileName = generateCleanFileName(attachment.file_name);
      const contentType = attachment.file.type || undefined;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('classroom-files')
        .upload(cleanFileName, attachment.file, {
          upsert: false, // Don't overwrite existing files
          contentType,
        });

      if (uploadError) {
        // If file exists, try with a different name
        if (uploadError.message.includes('already exists')) {
          const retryFileName = generateCleanFileName(attachment.file_name);
          const { data: retryData, error: retryError } = await supabase.storage
            .from('classroom-files')
            .upload(retryFileName, attachment.file, { contentType });
          
          if (retryError) throw retryError;
          uploadData.path = retryData.path;
        } else {
          throw uploadError;
        }
      }

      const { data: urlData } = supabase.storage
        .from('classroom-files')
        .getPublicUrl(uploadData.path);

      // Update attachment with upload info
      const updatedAttachments = [...attachments];
      updatedAttachments[index] = {
        ...attachment,
        file_name: attachment.file_name, // Keep original display name
        file_url: urlData.publicUrl,
        uploaded: true
      };

      onAttachmentsChange(updatedAttachments);

      toast({
        title: 'File uploaded',
        description: `${attachment.file_name} uploaded successfully`
      });

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${attachment.file_name}`,
        variant: 'destructive'
      });
    } finally {
      setUploading(prev => prev.filter(id => id !== fileId));
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* File Upload Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        <div className="text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600 mb-2">
            Drop files here or click to browse
          </div>
          <Input
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={handleFileSelect}
            disabled={disabled || attachments.length >= maxFiles}
            className="cursor-pointer"
          />
          <div className="text-xs text-gray-500 mt-2">
            Max {maxFiles} files • {formatFileSize(10 * 1024 * 1024)} per file
          </div>
        </div>
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Attached Files ({attachments.length}/{maxFiles})
          </h4>
          
          <div className="space-y-2">
            {attachments.map((attachment, index) => {
              const fileId = `${index}-${attachment.file_name}`;
              const isUploading = uploading.includes(fileId);
              
              return (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getFileIcon(attachment.file_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {attachment.file_name}
                          </p>
                          {attachment.uploaded && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✓ Uploaded
                            </span>
                          )}
                          {isUploading && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Uploading...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)} • {attachment.file_type}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!attachment.uploaded && attachment.file && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => uploadFile(attachment, index)}
                            disabled={isUploading || disabled}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {isUploading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        {attachment.uploaded && attachment.file_url && showUploadedFiles && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(attachment.file_url, '_blank')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAttachment(index)}
                          disabled={disabled}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Upload All Button */}
          {attachments.some(a => !a.uploaded && a.file) && (
            <Button
              onClick={() => {
                attachments.forEach((attachment, index) => {
                  if (!attachment.uploaded && attachment.file) {
                    uploadFile(attachment, index);
                  }
                });
              }}
              disabled={disabled || uploading.length > 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload All Files
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
