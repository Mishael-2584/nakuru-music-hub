import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Star, MoveUp, MoveDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductImage {
  id?: string;
  image_url: string;
  image_filename: string;
  display_order: number;
  is_primary: boolean;
  file?: File;
  preview?: string;
}

interface ProductImageUploaderProps {
  productId?: string;
  existingImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
}

export default function ProductImageUploader({ 
  productId, 
  onImagesChange,
  existingImages = []
}: ProductImageUploaderProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<ProductImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductImages();
    }
  }, [productId]);

  const loadProductImages = async () => {
    if (!productId) return;

    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading product images:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // File size limit: 50MB (Supabase storage bucket limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    const oversizedFiles: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    // Show error for oversized files
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File Size Error',
        description: `The following files exceed 50MB limit: ${oversizedFiles.join(', ')}. Please compress or resize them.`,
        variant: 'destructive'
      });
    }

    // Only add valid files
    if (validFiles.length > 0) {
      const newImages: ProductImage[] = validFiles.map((file, index) => ({
        image_url: '',
        image_filename: file.name,
        display_order: images.length + index,
        is_primary: images.length === 0 && index === 0,
        file,
        preview: URL.createObjectURL(file)
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    }

    // Reset input
    event.target.value = '';
  };

  const uploadImage = async (file: File): Promise<{ url: string; filename: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `shop-products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        // Check for specific error types
        if (uploadError.message.includes('size') || uploadError.message.includes('exceeded')) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          toast({
            title: 'File Too Large',
            description: `${file.name} (${fileSizeMB}MB) exceeds the storage limit. Please compress or resize the image to under 50MB.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Upload Failed',
            description: `Failed to upload ${file.name}: ${uploadError.message}`,
            variant: 'destructive'
          });
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        filename: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    try {
      const uploadPromises = images.map(async (image) => {
        if (image.file && !image.id) {
          const result = await uploadImage(image.file);
          if (result) {
            // If product exists, save to database
            if (productId) {
              const { data, error } = await supabase
                .from('product_images')
                .insert({
                  product_id: productId,
                  image_url: result.url,
                  image_filename: result.filename,
                  display_order: image.display_order,
                  is_primary: image.is_primary
                })
                .select()
                .single();

              if (error) throw error;
              return { ...image, ...data, file: undefined, preview: undefined };
            } else {
              // Product doesn't exist yet, just store the uploaded URL
              // Use a temporary ID to mark as "uploaded"
              return { 
                ...image, 
                id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
                image_url: result.url, 
                image_filename: result.filename,
                file: undefined, 
                preview: result.url 
              };
            }
          }
        }
        return image;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(uploadedImages);
      onImagesChange?.(uploadedImages);
      
      // Count successfully uploaded images
      const successCount = uploadedImages.filter(img => img.image_url && !img.file).length;
      const totalCount = images.filter(img => img.file && !img.id).length;
      
      if (successCount === totalCount) {
        toast({ 
          title: 'Success', 
          description: `All ${successCount} image${successCount !== 1 ? 's' : ''} uploaded successfully` 
        });
      } else if (successCount > 0) {
        toast({ 
          title: 'Partial Success', 
          description: `${successCount} of ${totalCount} images uploaded. Some files may have been too large or failed.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ title: 'Error', description: 'Failed to upload images', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    
    if (image.id) {
      try {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', image.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting image:', error);
        toast({ title: 'Error', description: 'Failed to delete image', variant: 'destructive' });
        return;
      }
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const setPrimaryImage = async (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));

    if (productId) {
      try {
        // Update all images in database
        await Promise.all(
          updatedImages.map((img) =>
            img.id
              ? supabase
                  .from('product_images')
                  .update({ is_primary: img.is_primary })
                  .eq('id', img.id)
              : Promise.resolve()
          )
        );
      } catch (error) {
        console.error('Error updating primary image:', error);
      }
    }

    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updatedImages = [...images];
    [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
    
    // Update display order
    updatedImages.forEach((img, i) => {
      img.display_order = i;
    });

    if (productId) {
      try {
        await Promise.all(
          updatedImages.map((img) =>
            img.id
              ? supabase
                  .from('product_images')
                  .update({ display_order: img.display_order })
                  .eq('id', img.id)
              : Promise.resolve()
          )
        );
      } catch (error) {
        console.error('Error updating image order:', error);
      }
    }

    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Images (Multiple)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Upload multiple images. Click the star to set primary image.
        </p>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('multiple-image-upload')?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Images
          </Button>
          
          {images.some(img => img.file && !img.id) && (
            <Button
              type="button"
              onClick={handleUploadAll}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          )}
        </div>

        <input
          id="multiple-image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group border rounded-lg overflow-hidden">
              <img
                src={image.preview || image.image_url}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              
              {/* Badges and Controls */}
              <div className="absolute top-2 left-2 flex gap-1">
                {image.is_primary && (
                  <Badge variant="default" className="text-xs">
                    Primary
                  </Badge>
                )}
                {image.file && !image.id && (
                  <Badge variant="secondary" className="text-xs">
                    Not Uploaded
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPrimaryImage(index)}
                  className="h-6 w-6 p-0"
                  title="Set as primary"
                >
                  <Star className={`w-3 h-3 ${image.is_primary ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Order Controls */}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => moveImage(index, 'up')}
                    className="h-6 w-6 p-0"
                  >
                    <MoveUp className="w-3 h-3" />
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => moveImage(index, 'down')}
                    className="h-6 w-6 p-0"
                  >
                    <MoveDown className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="p-2 bg-gray-50">
                <p className="text-xs truncate">{image.image_filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
