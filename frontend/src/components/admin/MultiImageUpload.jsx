import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Label } from "@/components/ui/label";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function MultiImageUpload({ value, onChange, label = "Gallery" }) {
  const [uploading, setUploading] = useState(false);
  const images = value || [];

  const uploadOne = async (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`${file.name}: only JPEG, PNG, WebP or GIF allowed`);
      return null;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name}: too large (max 10MB)`);
      return null;
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/admin/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.url;
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadOne(file);
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i) => onChange(images.filter((_, j) => j !== i));

  const addUrl = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const url = e.target.value.trim();
    if (url) {
      onChange([...images, url]);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>

      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="h-20 w-28 border border-border object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-border bg-ink text-center transition-colors hover:border-brass hover:bg-surface">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brass" />
          ) : (
            <Upload className="h-4 w-4 text-brass" />
          )}
          <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading…" : "Add images"}</span>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <input
        type="text"
        onKeyDown={addUrl}
        placeholder="Or paste an image URL and press Enter"
        className="w-full border border-border bg-ink px-3 py-2 text-xs text-bone placeholder:text-muted-foreground focus:border-brass focus:outline-none"
      />
    </div>
  );
}
