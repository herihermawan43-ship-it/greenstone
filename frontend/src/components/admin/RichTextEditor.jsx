import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  LinkIcon, ImageIcon, Undo, Redo,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Label } from "@/components/ui/label";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? "border-brass bg-brass/15 text-brass" : "border-transparent text-muted-foreground hover:border-border hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, label = "Content" }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow" } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-stone max-w-none min-h-[280px] px-3 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when switching to a different post (new editor instance would
  // be cleaner, but this covers the common case of the same instance being reused).
  useEffect(() => {
    if (editor && value !== editor.getHTML() && document.activeElement?.closest(".ProseMirror") == null) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const addImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP or GIF allowed");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/admin/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      editor.chain().focus().setImage({ src: res.data.url }).run();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <div className="border border-border bg-ink">
        <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
          <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-bone" title="Insert image">
            <ImageIcon className="h-4 w-4" />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={addImage} className="hidden" />
          </label>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} data-testid="post-form-content" />
      </div>
    </div>
  );
}
