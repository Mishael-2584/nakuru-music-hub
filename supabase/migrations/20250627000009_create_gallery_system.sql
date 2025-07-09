-- Migration to create gallery system with albums and images

-- Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  cover_image_filename TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  image_path TEXT NOT NULL,
  image_filename TEXT NOT NULL,
  alt_text VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_album_id ON public.gallery_images(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_sort_order ON public.gallery_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_albums_sort_order ON public.albums(sort_order);
CREATE INDEX IF NOT EXISTS idx_albums_is_featured ON public.albums(is_featured);

-- Enable RLS on both tables
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums table
-- Allow public read access to albums
CREATE POLICY "Allow public read access to albums" ON public.albums
FOR SELECT USING (true);

-- Allow authenticated users with admin role to insert albums
CREATE POLICY "Allow admin insert albums" ON public.albums
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Allow authenticated users with admin role to update albums
CREATE POLICY "Allow admin update albums" ON public.albums
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Allow authenticated users with admin role to delete albums
CREATE POLICY "Allow admin delete albums" ON public.albums
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- RLS Policies for gallery_images table
-- Allow public read access to gallery images
CREATE POLICY "Allow public read access to gallery images" ON public.gallery_images
FOR SELECT USING (true);

-- Allow authenticated users with admin role to insert gallery images
CREATE POLICY "Allow admin insert gallery images" ON public.gallery_images
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Allow authenticated users with admin role to update gallery images
CREATE POLICY "Allow admin update gallery images" ON public.gallery_images
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Allow authenticated users with admin role to delete gallery images
CREATE POLICY "Allow admin delete gallery images" ON public.gallery_images
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Create storage policies for gallery images in the 'images' bucket
-- Policy to allow authenticated users to upload gallery images
CREATE POLICY "Allow authenticated users to upload gallery images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gallery' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Policy to allow public read access to gallery images
CREATE POLICY "Allow public read access to gallery images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gallery'
);

-- Policy to allow authenticated users to update gallery images
CREATE POLICY "Allow authenticated users to update gallery images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gallery' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Policy to allow authenticated users to delete gallery images
CREATE POLICY "Allow authenticated users to delete gallery images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gallery' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 