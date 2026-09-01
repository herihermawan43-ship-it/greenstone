import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Label } from "@/components/ui/label";

export default function ImageUpload({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images allowed");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/admin/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data.url;
      onChange(imageUrl);
      setPreview(imageUrl);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </Label>

      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-32 w-48 border border-border object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-3 border-2 border-dashed border-border bg-ink px-6 py-8 transition-colors hover:border-brass hover:bg-surface">
          <Upload className="h-5 w-5 text-brass" />
          <div className="text-center">
            <p className="text-sm text-bone">{uploading ? "Uploading…" : "Click to upload"}</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF (max 10MB)</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {/* Also allow URL input as fallback */}
      <div className="mt-3">
        <p className="text-xs text-muted-foreground mb-2">Or paste image URL:</p>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value);
          }}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-border bg-ink px-3 py-2 text-xs text-bone placeholder:text-muted-foreground focus:border-brass focus:outline-none"
        />
      </div>
    </div>
  );
}
