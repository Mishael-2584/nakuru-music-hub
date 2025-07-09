import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Crop, RotateCw, Download } from "lucide-react";
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { createImageWithCORS } from "@/lib/corsConfig";
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  maxSize?: number;
  className?: string;
  aspectRatio?: number; // width/height ratio
}

const ImageUpload = ({
  value,
  onChange,
  label = "Image",
  placeholder = "Upload an image",
  maxSize = 5,
  className = "",
  aspectRatio = 16 / 9 // Default to 16:9 aspect ratio
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isEditing, setIsEditing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Test storage bucket connection on component mount
  useEffect(() => {
    const testStorageConnection = async () => {
      try {
        console.log("Testing storage bucket connection...");
        
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("Authentication error:", authError);
          toast({
            title: "Authentication Required",
            description: "You must be logged in to upload images.",
            variant: "destructive",
          });
          return;
        }
        
        console.log("User authenticated:", user.email);
        
        // Test if we can list files in the bucket
        const { data, error } = await supabase.storage
          .from("images")
          .list("", { limit: 1 });

        if (error) {
          console.error("Storage bucket test failed:", error);
          
          // Check if it's a bucket not found error
          if (error.message.includes("not found") || error.message.includes("does not exist")) {
            toast({
              title: "Storage Bucket Missing",
              description: "The 'images' bucket doesn't exist. Please create it in your Supabase dashboard under Storage.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Storage Error",
              description: `Cannot access storage bucket: ${error.message}`,
              variant: "destructive",
            });
          }
        } else {
          console.log("Storage bucket connection successful");
        }
      } catch (error) {
        console.error("Storage connection test error:", error);
      }
    };

    testStorageConnection();
  }, [toast]);

  const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    )
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Define supported image MIME types
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml'
    ];

    if (!supportedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `File type "${file.type}" is not supported. Supported types: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG`,
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL for editing
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);
    setPreview(previewUrl);
    setIsEditing(true);
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, rotation = 0): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Use the CORS helper to load the image properly
    return createImageWithCORS(image.src).then((img) => {
      return new Promise((resolve, reject) => {
        try {
          // Calculate the actual crop dimensions based on the image's natural size
          const imageAspectRatio = img.naturalWidth / img.naturalHeight;
          const displayAspectRatio = image.width / image.height;
          
          // Calculate the scale factor between natural and displayed image
          const scaleX = img.naturalWidth / image.width;
          const scaleY = img.naturalHeight / image.height;
          
          // Convert crop coordinates from display size to natural size
          const naturalCropX = crop.x * scaleX;
          const naturalCropY = crop.y * scaleY;
          const naturalCropWidth = crop.width * scaleX;
          const naturalCropHeight = crop.height * scaleY;
          
          // Set canvas size to the crop dimensions
          canvas.width = naturalCropWidth;
          canvas.height = naturalCropHeight;
          
          // Clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply rotation if needed
          if (rotation !== 0) {
            // For rotation, we need a larger canvas to accommodate the rotated image
            const maxSize = Math.max(naturalCropWidth, naturalCropHeight);
            const rotatedCanvas = document.createElement('canvas');
            const rotatedCtx = rotatedCanvas.getContext('2d');
            
            if (!rotatedCtx) {
              reject(new Error('Failed to create rotated canvas context'));
              return;
            }
            
            rotatedCanvas.width = maxSize;
            rotatedCanvas.height = maxSize;
            
            // Move to center and rotate
            rotatedCtx.translate(maxSize / 2, maxSize / 2);
            rotatedCtx.rotate((rotation * Math.PI) / 180);
            rotatedCtx.translate(-maxSize / 2, -maxSize / 2);
            
            // Draw the full image
            rotatedCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, maxSize, maxSize);
            
            // Get the rotated image data
            const rotatedData = rotatedCtx.getImageData(0, 0, maxSize, maxSize);
            
            // Create final canvas with crop dimensions
            canvas.width = naturalCropWidth;
            canvas.height = naturalCropHeight;
            
            // Draw the cropped portion from the rotated image
            ctx.putImageData(rotatedData, -naturalCropX, -naturalCropY);
          } else {
            // No rotation - direct crop
            ctx.drawImage(
              img,
              naturalCropX, naturalCropY, naturalCropWidth, naturalCropHeight,
              0, 0, naturalCropWidth, naturalCropHeight
            );
          }
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.9);
          
        } catch (error) {
          console.error('Error during cropping:', error);
          reject(new Error('Failed to crop image: ' + error.message));
        }
      });
    }).catch((error) => {
      throw new Error('Failed to load image for cropping: ' + error.message);
    });
  };

  const handleSaveCrop = async () => {
    if (!imgRef.current || !completedCrop) {
      toast({
        title: "No crop selected",
        description: "Please select an area to crop",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, rotation);
      
      // Check authentication before upload
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to upload images.",
          variant: "destructive",
        });
        return;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `images/${fileName}`;

      console.log("Attempting upload of cropped image to:", filePath);

      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, croppedBlob, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error("Upload error details:", error);
        toast({
          title: "Upload failed",
          description: `Error: ${error.message || "Unknown error occurred"}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Upload successful:", data);

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      onChange(publicUrl);
      setPreview(publicUrl);
      setIsEditing(false);
      setOriginalImage(null);

      toast({
        title: "Success",
        description: "Image cropped and uploaded successfully",
      });

    } catch (error) {
      console.error("Unexpected error:", error);
      
      // Check if it's a CORS error
      if (error instanceof Error && error.message.includes('tainted')) {
        toast({
          title: "CORS Error",
          description: "Cannot edit this image due to security restrictions. Try uploading a new image instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setOriginalImage(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    setOriginalImage(null);
    setIsEditing(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreview(url);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isEditing}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
          {value && !isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Editor */}
      {isEditing && originalImage && (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Edit Image</h4>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center gap-1"
              >
                <RotateCw className="h-3 w-3" />
                Rotate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveCrop}
                disabled={isUploading || !completedCrop}
                size="sm"
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                {isUploading ? "Saving..." : "Save & Upload"}
              </Button>
            </div>
          </div>
          
          <div className="max-w-md mx-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={100}
              minHeight={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={originalImage}
                crossOrigin="anonymous"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
          
          <div className="text-sm text-gray-600 text-center">
            <p>Drag to reposition • Resize handles to scale • Aspect ratio: {aspectRatio.toFixed(2)}:1</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && !isEditing && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-w-xs h-auto rounded-lg border"
            onError={() => setPreview(null)}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOriginalImage(preview);
                setIsEditing(true);
                setRotation(0);
                setCrop(undefined);
                setCompletedCrop(undefined);
              }}
              className="flex items-center gap-1"
            >
              <Crop className="h-3 w-3" />
              Edit Image
            </Button>
          </div>
        </div>
      )}

      {!preview && !isEditing && (
        <div className="w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No image selected</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
 