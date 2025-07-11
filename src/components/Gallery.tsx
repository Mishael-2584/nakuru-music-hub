
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Image, FolderOpen, Star, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_image_path: string | null;
  cover_image_filename: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_count?: number;
}

interface GalleryImage {
  id: string;
  album_id: string;
  title: string | null;
  description: string | null;
  image_path: string;
  image_filename: string;
  alt_text: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const DynamicGallery = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [featuredImages, setFeaturedImages] = useState<GalleryImage[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  const [modalImages, setModalImages] = useState<GalleryImage[]>([]);
  const [modalAlbumName, setModalAlbumName] = useState<string>("");

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch albums with image count
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select(`
          *,
          gallery_images(count)
        `)
        .order('sort_order', { ascending: true });

      if (albumsError) throw albumsError;

      // Transform albums to include image count
      const albumsWithCount = albumsData?.map(album => ({
        ...album,
        image_count: album.gallery_images?.[0]?.count || 0
      })) || [];

      console.log('🖼️ Gallery - Albums fetched:', albumsWithCount);
      console.log('🖼️ Gallery - Sample album:', albumsWithCount[0]);

      setAlbums(albumsWithCount);

      // Fetch all gallery images
      const { data: imagesData, error: imagesError } = await supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;
      setGalleryImages(imagesData || []);

      // Get featured images
      const featured = imagesData?.filter(img => img.is_featured) || [];
      setFeaturedImages(featured);

    } catch (error) {
      console.error('Error fetching gallery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlbumImages = (albumId: string) => {
    return galleryImages.filter(img => img.album_id === albumId);
  };

  const getAlbumName = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    return album?.name || "Unknown Album";
  };

  const openImageModal = (image: GalleryImage, images: GalleryImage[], startIndex: number = 0) => {
    setModalImages(images);
    setModalImageIndex(startIndex);
    setModalImage(`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${image.image_path}`);
    setModalAlt(image.alt_text || image.title || "Gallery image");
    setModalAlbumName(getAlbumName(image.album_id));
  };

  const openAlbumCoverModal = (album: Album) => {
    const albumImages = getAlbumImages(album.id);
    if (album.cover_image_path) {
      setModalImages(albumImages);
      setModalImageIndex(0);
      setModalImage(`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${album.cover_image_path}`);
      setModalAlt(album.name);
      setModalAlbumName(album.name);
    }
  };

  const nextImage = () => {
    if (modalImageIndex < modalImages.length - 1) {
      const nextIndex = modalImageIndex + 1;
      const nextImage = modalImages[nextIndex];
      setModalImageIndex(nextIndex);
      setModalImage(`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${nextImage.image_path}`);
      setModalAlt(nextImage.alt_text || nextImage.title || "Gallery image");
    }
  };

  const previousImage = () => {
    if (modalImageIndex > 0) {
      const prevIndex = modalImageIndex - 1;
      const prevImage = modalImages[prevIndex];
      setModalImageIndex(prevIndex);
      setModalImage(`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${prevImage.image_path}`);
      setModalAlt(prevImage.alt_text || prevImage.title || "Gallery image");
    }
  };

  const closeModal = () => {
    setModalImage(null);
    setModalAlt("");
    setModalImageIndex(0);
    setModalImages([]);
    setModalAlbumName("");
  };

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading gallery...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Our Musical Journey
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the vibrant atmosphere of Damon Music Academy through moments captured in our studios and classrooms
          </p>
        </div>

        {/* Featured Images Section */}
        {featuredImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">
              <Star className="inline w-6 h-6 mr-2 text-yellow-500" />
              Featured Moments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredImages.slice(0, 6).map((image) => (
                <Card 
                  key={image.id} 
                  className="group overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${image.image_path}`}
                        alt={image.alt_text || image.title || "Gallery image"}
                        className="w-full h-64 sm:h-72 lg:h-80 object-contain bg-gray-100 transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                        onClick={() => {
                          openImageModal(image, getAlbumImages(image.album_id), getAlbumImages(image.album_id).findIndex(img => img.id === image.id));
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
                          {image.title || "Featured Image"}
                        </h3>
                        <p className="text-white/90 text-sm sm:text-base">
                          {image.description || image.alt_text || "A special moment from our academy"}
                        </p>
                        <p className="text-white/70 text-xs mt-2">
                          Album: {getAlbumName(image.album_id)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Albums Section */}
        {albums.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6 text-center">
              <FolderOpen className="inline w-6 h-6 mr-2 text-primary" />
              Photo Albums
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {albums.map((album) => {
                const albumImages = getAlbumImages(album.id);
                const coverImage = album.cover_image_path || (albumImages.length > 0 ? albumImages[0].image_path : null);
                
                console.log('🖼️ Gallery - Album:', album.name);
                console.log('🖼️ Gallery - Album cover_image_path:', album.cover_image_path);
                console.log('🖼️ Gallery - Album coverImage (final):', coverImage);
                console.log('🖼️ Gallery - Album images count:', albumImages.length);
                
                return (
                  <Card 
                    key={album.id} 
                    className="group overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer"
                    onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)}
                  >
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden">
                        {coverImage ? (
                          <img
                            src={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${coverImage}`}
                            alt={album.name}
                            className="w-full h-64 sm:h-72 lg:h-80 object-contain bg-gray-100 transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              console.error('🖼️ Gallery - Album cover image failed to load:', coverImage);
                              console.error('🖼️ Gallery - Full URL:', `https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${coverImage}`);
                            }}
                            onLoad={() => {
                              console.log('🖼️ Gallery - Album cover image loaded successfully:', coverImage);
                            }}
                          />
                        ) : (
                          <div className="w-full h-64 sm:h-72 lg:h-80 bg-muted flex items-center justify-center">
                            <Image className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
                              {album.name}
                            </h3>
                            {album.is_featured && (
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/90 text-sm sm:text-base mb-2">
                            {album.description || "A collection of musical moments"}
                          </p>
                          <p className="text-white/70 text-xs">
                            {album.image_count} images
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Album Detail View */}
            {selectedAlbum && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold">
                    {getAlbumName(selectedAlbum)}
                  </h4>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAlbum(null)}
                    className="flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Albums
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getAlbumImages(selectedAlbum).map((image) => (
                    <Card 
                      key={image.id} 
                      className="group overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <img
                            src={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${image.image_path}`}
                            alt={image.alt_text || image.title || "Gallery image"}
                            className="w-full h-64 sm:h-72 lg:h-80 object-contain bg-gray-100 transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                            onClick={() => {
                              openImageModal(image, getAlbumImages(image.album_id), getAlbumImages(image.album_id).findIndex(img => img.id === image.id));
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <h5 className="text-white font-bold text-sm mb-1">
                              {image.title || "Gallery Image"}
                            </h5>
                            {image.description && (
                              <p className="text-white/90 text-xs">
                                {image.description}
                              </p>
                            )}
                            {image.is_featured && (
                              <Badge variant="secondary" className="mt-1 bg-yellow-500 text-white text-xs">
                                <Star className="w-2 h-2 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {albums.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Albums Available</h3>
            <p className="text-muted-foreground">
              Gallery albums will be available soon. Check back later for updates.
            </p>
          </div>
        )}

        <div className="text-center mt-12 sm:mt-16">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-muted-foreground">Live at Damon Music Academy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full image view */}
      <Dialog open={!!modalImage} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
          <img
            src={modalImage || ""}
            alt={modalAlt}
            className="max-w-full max-h-[80vh] object-contain rounded shadow-lg"
            style={{ background: "#f3f4f6" }}
          />
          <div className="flex justify-between w-full px-4 mt-4">
            <Button variant="outline" onClick={previousImage} className="p-2 rounded-full hover:bg-gray-200">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Button>
            <span className="text-white text-lg font-medium">{modalAlbumName} - {modalImageIndex + 1} / {modalImages.length}</span>
            <Button variant="outline" onClick={nextImage} className="p-2 rounded-full hover:bg-gray-200">
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </Button>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
            onClick={closeModal}
          >
            Close
          </button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DynamicGallery;
