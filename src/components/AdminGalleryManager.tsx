import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ui/image-upload";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  FolderOpen, 
  Star, 
  MoveUp, 
  MoveDown,
  Upload,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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

const AdminGalleryManager = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Album management state
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumForm, setAlbumForm] = useState({
    name: "",
    description: "",
    is_featured: false,
    sort_order: 0
  });
  const [albumCoverImage, setAlbumCoverImage] = useState<File | null>(null);
  const [albumCoverImageUrl, setAlbumCoverImageUrl] = useState<string | null>(null);

  // Image management state
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageForm, setImageForm] = useState({
    album_id: "",
    title: "",
    description: "",
    alt_text: "",
    is_featured: false,
    sort_order: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");

  // Modal for full image view
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  const [modalImages, setModalImages] = useState<GalleryImage[]>([]);
  const [modalAlbumName, setModalAlbumName] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      
      setAlbums(albumsWithCount);

      // Fetch all gallery images
      const { data: imagesData, error: imagesError } = await supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });

      if (imagesError) throw imagesError;
      
      setGalleryImages(imagesData || []);

    } catch (error) {
      console.error('Error fetching gallery data:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumSubmit = async () => {
    try {
      let coverImagePath = editingAlbum?.cover_image_path || null;
      let coverImageFilename = editingAlbum?.cover_image_filename || null;

      // Handle cover image upload from ImageUpload component
      if (albumCoverImageUrl) {
        // Extract the file path from the public URL
        // URL format: https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/gallery/album_covers/filename.jpg
        try {
          // Remove the base URL to get just the path
          const baseUrl = 'https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/';
          if (albumCoverImageUrl.startsWith(baseUrl)) {
            coverImagePath = albumCoverImageUrl.substring(baseUrl.length);
            // Decode URL-encoded characters
            coverImagePath = decodeURIComponent(coverImagePath);
            // Extract filename from the path
            const pathParts = coverImagePath.split('/');
            coverImageFilename = pathParts[pathParts.length - 1];
          }
        } catch (error) {
          console.error('🖼️ Admin - Error parsing cover image URL:', error);
        }
      }

      // Handle direct file upload (fallback)
      if (albumCoverImage) {
        const filename = `gallery/album_covers/${Date.now()}_${albumCoverImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filename, albumCoverImage);

        if (uploadError) throw uploadError;
        coverImagePath = filename;
        coverImageFilename = albumCoverImage.name;
      }

      const albumData = {
        name: albumForm.name,
        description: albumForm.description || null,
        cover_image_path: coverImagePath,
        cover_image_filename: coverImageFilename,
        is_featured: albumForm.is_featured,
        sort_order: albumForm.sort_order
      };

      if (editingAlbum) {
        // Update existing album
        const { error } = await supabase
          .from('albums')
          .update(albumData)
          .eq('id', editingAlbum.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Album updated successfully"
        });
      } else {
        // Create new album
        const { error } = await supabase
          .from('albums')
          .insert(albumData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Album created successfully"
        });
      }

      resetAlbumForm();
      fetchData();
    } catch (error) {
      console.error('Error saving album:', error);
      toast({
        title: "Error",
        description: "Failed to save album",
        variant: "destructive"
      });
    }
  };

  const handleImageSubmit = async () => {
    try {
      let imagePath = editingImage?.image_path || null;
      let imageFilename = editingImage?.image_filename || null;

      // Handle image upload from ImageUpload component
      if (imageUrl) {
        // Extract the file path from the public URL
        // URL format: https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/gallery/images/filename.jpg
        try {
          // Remove the base URL to get just the path
          const baseUrl = 'https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/';
          if (imageUrl.startsWith(baseUrl)) {
            imagePath = imageUrl.substring(baseUrl.length);
            // Decode URL-encoded characters
            imagePath = decodeURIComponent(imagePath);
            // Extract filename from the path
            const pathParts = imagePath.split('/');
            imageFilename = pathParts[pathParts.length - 1];
          }
        } catch (error) {
          console.error('🖼️ Admin - Error parsing image URL:', error);
        }
      }

      // Handle direct file upload (fallback)
      if (imageFile) {
        const filename = `gallery/images/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filename, imageFile);

        if (uploadError) throw uploadError;
        imagePath = filename;
        imageFilename = imageFile.name;
      }

      if (!imagePath) {
        toast({
          title: "Error",
          description: "Please select an image",
          variant: "destructive"
        });
        return;
      }

      const imageData = {
        album_id: imageForm.album_id,
        title: imageForm.title || null,
        description: imageForm.description || null,
        image_path: imagePath,
        image_filename: imageFilename,
        alt_text: imageForm.alt_text || null,
        is_featured: imageForm.is_featured,
        sort_order: imageForm.sort_order
      };

      if (editingImage) {
        // Update existing image
        const { error } = await supabase
          .from('gallery_images')
          .update(imageData)
          .eq('id', editingImage.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Image updated successfully"
        });
      } else {
        // Create new image
        const { error } = await supabase
          .from('gallery_images')
          .insert(imageData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
      }

      resetImageForm();
      fetchData();
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Error",
        description: "Failed to save image",
        variant: "destructive"
      });
    }
  };

  const deleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`Are you sure you want to delete the album "${albumName}"? This will also delete all images in the album.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album deleted successfully"
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({
        title: "Error",
        description: "Failed to delete album",
        variant: "destructive"
      });
    }
  };

  const deleteImage = async (imageId: string, imageTitle: string) => {
    if (!confirm(`Are you sure you want to delete the image "${imageTitle}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const resetAlbumForm = () => {
    setAlbumForm({
      name: "",
      description: "",
      is_featured: false,
      sort_order: 0
    });
    setAlbumCoverImage(null);
    setAlbumCoverImageUrl(null);
    setEditingAlbum(null);
    setShowAlbumDialog(false);
  };

  const resetImageForm = () => {
    setImageForm({
      album_id: "",
      title: "",
      description: "",
      alt_text: "",
      is_featured: false,
      sort_order: 0
    });
    setImageFile(null);
    setImageUrl(null);
    setEditingImage(null);
    setShowImageDialog(false);
  };

  const openAlbumDialog = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumForm({
        name: album.name,
        description: album.description || "",
        is_featured: album.is_featured,
        sort_order: album.sort_order
      });
      setAlbumCoverImageUrl(album.cover_image_path ? `https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${album.cover_image_path}` : null);
    } else {
      setEditingAlbum(null);
      resetAlbumForm();
    }
    setShowAlbumDialog(true);
  };

  const openImageDialog = (image?: GalleryImage) => {
    if (image) {
      setEditingImage(image);
      setImageForm({
        album_id: image.album_id,
        title: image.title || "",
        description: image.description || "",
        alt_text: image.alt_text || "",
        is_featured: image.is_featured,
        sort_order: image.sort_order
      });
      setImageUrl(`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${image.image_path}`);
    } else {
      setEditingImage(null);
      resetImageForm();
    }
    setShowImageDialog(true);
  };

  const filteredImages = selectedAlbum === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.album_id === selectedAlbum);

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
    const albumImages = galleryImages.filter(img => img.album_id === album.id);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gallery Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => openAlbumDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            New Album
          </Button>
          <Button onClick={() => openImageDialog()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>
      </div>

      <Tabs defaultValue="albums" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading albums...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((album) => {
                
                return (
                  <Card key={album.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{album.name}</CardTitle>
                        <div className="flex gap-1">
                          {album.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {album.image_count} images
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {album.cover_image_path ? (
                        <div className="relative mb-3">
                          <img
                            src={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${album.cover_image_path}`}
                            alt={album.name}
                            className="w-full h-32 object-contain bg-gray-100 rounded-md"
                            onError={(e) => {
                              console.error('🖼️ Admin - Album cover image failed to load:', album.cover_image_path);
                            }}
                            onLoad={() => {
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center mb-3">
                          <Image className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {album.description || "No description"}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAlbumDialog(album)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAlbum(album.id, album.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Order: {album.sort_order}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Albums</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading images...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="relative group">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/images/${image.image_path}`}
                        alt={image.alt_text || image.title || "Gallery image"}
                        className="w-full h-48 object-contain bg-gray-100 rounded-t-lg cursor-pointer"
                        onClick={() => openImageModal(image, filteredImages, filteredImages.findIndex(img => img.id === image.id))}
                        onError={(e) => {
                          console.error('🖼️ Image failed to load:', image.image_path);
                        }}
                        onLoad={() => {
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openImageDialog(image)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(image.id, image.title || "Untitled")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {image.is_featured && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-1">
                        {image.title || "Untitled"}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Album: {getAlbumName(image.album_id)}
                      </p>
                      {image.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {image.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Order: {image.sort_order}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Album Dialog */}
      <Dialog open={showAlbumDialog} onOpenChange={setShowAlbumDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlbum ? "Edit Album" : "Create New Album"}
            </DialogTitle>
            <DialogDescription>
              {editingAlbum ? "Update album details" : "Create a new album for organizing gallery images"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Album Name</label>
              <Input
                value={albumForm.name}
                onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                placeholder="Enter album name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                placeholder="Enter album description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <ImageUpload
                value={albumCoverImageUrl || ""}
                onChange={(url) => setAlbumCoverImageUrl(url)}
                className="w-full"
                uploadPath="gallery/album_covers"
                disableCrop={true}
              />
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  value={albumForm.sort_order}
                  onChange={(e) => setAlbumForm({ ...albumForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={albumForm.is_featured}
                  onChange={(e) => setAlbumForm({ ...albumForm, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm">Featured</label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetAlbumForm}>
              Cancel
            </Button>
            <Button onClick={handleAlbumSubmit}>
              {editingAlbum ? "Update Album" : "Create Album"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingImage ? "Edit Image" : "Upload New Image"}
            </DialogTitle>
            <DialogDescription>
              {editingImage ? "Update image details" : "Upload a new image to the gallery"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Album</label>
              <Select
                value={imageForm.album_id}
                onValueChange={(value) => setImageForm({ ...imageForm, album_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Image</label>
              <ImageUpload
                value={imageUrl || ""}
                onChange={(url) => setImageUrl(url)}
                className="w-full"
                uploadPath="gallery/images"
                disableCrop={true}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={imageForm.title}
                onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })}
                placeholder="Enter image title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={imageForm.description}
                onChange={(e) => setImageForm({ ...imageForm, description: e.target.value })}
                placeholder="Enter image description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alt Text</label>
              <Input
                value={imageForm.alt_text}
                onChange={(e) => setImageForm({ ...imageForm, alt_text: e.target.value })}
                placeholder="Enter alt text for accessibility"
              />
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  value={imageForm.sort_order}
                  onChange={(e) => setImageForm({ ...imageForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="image-featured"
                  checked={imageForm.is_featured}
                  onChange={(e) => setImageForm({ ...imageForm, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="image-featured" className="text-sm">Featured</label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={resetImageForm}>
              Cancel
            </Button>
            <Button onClick={handleImageSubmit}>
              {editingImage ? "Update Image" : "Upload Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default AdminGalleryManager; 