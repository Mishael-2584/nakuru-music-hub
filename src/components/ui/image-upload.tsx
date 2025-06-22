import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  maxSize?: number;
  className?: string;
}

const ImageUpload = ({
  value,
  onChange,
  label = "Image",
  placeholder = "Upload an image",
  maxSize = 5,
  className = ""
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    setIsUploading(true);

    try {
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

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      console.log("Attempting upload to:", filePath);
      console.log("File details for upload:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error("Upload error details:", error);
        console.error("Error code:", error.statusCode);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        
        // Check for specific MIME type errors
        if (error.message.includes("mime type") || error.message.includes("content type")) {
          toast({
            title: "File Type Error",
            description: `The file type "${file.type}" is not allowed by your storage bucket. Please check your Supabase storage settings.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload failed",
            description: `Error: ${error.message || "Unknown error occurred"}`,
            variant: "destructive",
          });
        }
        return;
      }

      console.log("Upload successful:", data);

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      onChange(publicUrl);
      setPreview(publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setPreview(url);
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
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
          {value && (
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

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-w-xs h-auto rounded-lg border"
            onError={() => setPreview(null)}
          />
        </div>
      )}

      {!preview && (
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
