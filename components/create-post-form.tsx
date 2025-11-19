"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CreatePostForm({ userId }: { userId: string }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert("Please select an image");
      return;
    }

    setLoading(true);
    try {
      // Upload image to Supabase Storage
      const fileName = `${userId}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("posts").getPublicUrl(fileName);

      // Create post record
      const { error: postError } = await supabase.from("posts").insert({
        user_id: userId,
        caption,
        image_url: data.publicUrl,
      });

      if (postError) throw postError;

      router.push("/feed");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create Post</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          {preview ? (
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div>
              <p className="text-muted-foreground mb-4">
                Click or drag to upload image
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input">
                <Button type="button" variant="outline" asChild>
                  <span>Choose Image</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Posting..." : "Share Post"}
        </Button>
      </form>
    </Card>
  );
}
