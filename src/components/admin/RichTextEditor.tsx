"use client";

/**
 * RTL/Persian-friendly TipTap editor for admin blog body.
 * Stores HTML string (same shape as seeded posts / storefront `.blog-body`).
 */

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors",
        active
          ? "bg-accent text-charcoal"
          : "text-gray-600 hover:bg-gray-100 hover:text-charcoal",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" aria-hidden />;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "متن مقاله را بنویسید…",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        lang: "fa",
        class: "rich-text-editor blog-body focus:outline-none min-h-[280px] px-4 py-3",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value (e.g. when switching edit targets) without resetting caret mid-edit.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next === current) return;
    if (next === "" && (current === "<p></p>" || current === "")) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white min-h-[340px] animate-pulse ${className}`}
      />
    );
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("آدرس لینک را وارد کنید:", prev ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${className}`}
      dir="rtl"
    >
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-silver-light/60">
        <ToolbarButton
          label="عنوان"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="زیرعنوان"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="درشت"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          ب
        </ToolbarButton>
        <ToolbarButton
          label="ایتالیک"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>ا</em>
        </ToolbarButton>
        <ToolbarButton
          label="زیرخط"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">ز</span>
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="لیست نقطه‌ای"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          label="لیست شماره‌دار"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          ۱.
        </ToolbarButton>
        <ToolbarButton
          label="نقل‌قول"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ”
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="لینک"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          لینک
        </ToolbarButton>
        <ToolbarButton
          label="حذف لینک"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          ✕
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton
          label="لغو"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          label="از نو"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
