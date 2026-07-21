"use client";

import { useRef, useState, useTransition } from "react";
import {
  uploadAdminImage,
  type TaxonomyImageFolder,
} from "@/actions/admin-uploads";

type ImageUploadFieldProps = {
  folder: TaxonomyImageFolder;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
};

/**
 * Compact single-image uploader for admin taxonomy forms (categories, brands, cars).
 */
export default function ImageUploadField({
  folder,
  value,
  onChange,
  label = "تصویر",
  className = "",
}: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, startUpload] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  function uploadFile(file: File | undefined) {
    if (!file || file.size === 0) return;
    setError("");
    startUpload(async () => {
      const form = new FormData();
      form.set("image", file);
      const result = await uploadAdminImage(folder, form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange(result.data.url);
    });
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-silver-light">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5.5-5.5L9 17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFile(e.dataTransfer.files?.[0]);
            }}
            className={[
              "rounded-xl border border-dashed px-3 py-2.5 text-center transition-colors cursor-pointer",
              dragOver
                ? "border-accent bg-amber-50"
                : "border-gray-200 bg-white hover:border-accent/60 hover:bg-amber-50/30",
              uploading ? "opacity-60 pointer-events-none" : "",
            ].join(" ")}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                uploadFile(e.target.files?.[0]);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <p className="text-xs font-bold text-charcoal">
              {uploading ? "در حال آپلود…" : value ? "تغییر تصویر" : "آپلود تصویر"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">jpg، png، webp — تا ۲ مگابایت</p>
          </div>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] font-semibold text-gray-400 hover:text-red-600 transition-colors"
            >
              حذف تصویر
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

/** Small square thumbnail for admin index tables. */
export function AdminThumb({
  src,
  alt = "",
}: {
  src: string | null | undefined;
  alt?: string;
}) {
  if (!src) {
    return (
      <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded-lg object-cover border border-gray-200 bg-white"
    />
  );
}
