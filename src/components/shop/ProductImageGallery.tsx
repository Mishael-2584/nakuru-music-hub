import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImage {
  id: string;
  image_url: string;
  image_filename: string;
  display_order: number;
  is_primary: boolean;
}

interface ProductImageGalleryProps {
  productId?: string;
  fallbackImage?: string;
  className?: string;
  showControls?: boolean; // Show navigation arrows and dots
}

export default function ProductImageGallery({ 
  productId, 
  fallbackImage,
  className = "w-full h-48",
  showControls = true
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadImages();
    } else {
      setLoading(false);
    }
  }, [productId]);

  const loadImages = async () => {
    if (!productId) return;

    try {
      // Import supabase dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setImages(data);
        // Set current index to primary image
        const primaryIndex = data.findIndex(img => img.is_primary);
        setCurrentIndex(primaryIndex >= 0 ? primaryIndex : 0);
      }
    } catch (error) {
      console.error('Error loading product images:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // If no images loaded and no fallback, show placeholder
  if (!loading && images.length === 0 && !fallbackImage) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  // If no images but has fallback, show fallback
  if (!loading && images.length === 0 && fallbackImage) {
    return (
      <img 
        src={fallbackImage} 
        alt="Product" 
        className={`${className} object-cover`}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse`} />
    );
  }

  // Show image gallery
  const currentImage = images[currentIndex];

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image */}
      <img 
        src={currentImage?.image_url || fallbackImage} 
        alt={`Product image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows (only show if multiple images and controls enabled) */}
      {showControls && images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Image Counter (only show if controls enabled) */}
      {showControls && images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail Dots (only show if multiple images and controls enabled) */}
      {showControls && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
