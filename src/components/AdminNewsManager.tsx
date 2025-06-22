import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react";
import ImageUpload from "@/components/ui/image-upload";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  status: string;
  is_featured: boolean | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

const AdminNewsManager = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    status: "draft",
    is_featured: false,
    image_url: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          id,
          title,
          content,
          excerpt,
          image_url,
          status,
          is_featured,
          slug,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
        toast({
          title: "Error",
          description: "Failed to fetch news articles",
          variant: "destructive",
        });
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const articleData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || null,
        status: formData.status,
        is_featured: formData.is_featured,
        image_url: formData.image_url || null,
        slug: slug,
      };

      let error;

      if (editingArticle) {
        const { error: updateError } = await supabase
          .from('news')
          .update(articleData)
          .eq('id', editingArticle.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('news')
          .insert([articleData]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving article:', error);
        toast({
          title: "Error",
          description: "Failed to save news article",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: editingArticle ? "Article updated successfully" : "Article created successfully",
      });

      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || "",
      status: article.status,
      is_featured: article.is_featured || false,
      image_url: article.image_url || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        toast({
          title: "Error",
          description: "Failed to delete article",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Article deleted successfully",
      });

      fetchArticles();
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      status: "draft",
      is_featured: false,
      image_url: ""
    });
    setEditingArticle(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading news articles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">News Management</h2>
        <Button 
          onClick={() => setIsEditing(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add News Article
        </Button>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <RichTextEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  label="Content"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image_url">Article Image</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  label="Article Image"
                  placeholder="Upload an image for this article"
                  maxSize={5}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  <Label htmlFor="is_featured">Featured Article</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                      {article.status}
                    </Badge>
                    {article.is_featured && (
                      <Badge className="bg-yellow-500">Featured</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-2 line-clamp-2">
                    {article.excerpt || article.content.substring(0, 150) + '...'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {article.image_url && (
                    <ImageIcon className="h-4 w-4 text-green-500" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(article)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No news articles found. Create your first article to get started.
        </div>
      )}
    </div>
  );
};

export default AdminNewsManager;