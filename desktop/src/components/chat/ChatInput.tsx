"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppStore, type ImageAttachment } from "@/lib/store";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

interface ChatInputProps {
  onSend: (message: string, images?: ImageAttachment[]) => void;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

function readFileAsAttachment(file: File): Promise<ImageAttachment | null> {
  return new Promise((resolve) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 portion after "data:image/png;base64,"
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        resolve(null);
        return;
      }
      resolve({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        filename: file.name || `image.${file.type.split("/")[1]}`,
        mimeType: file.type,
        base64,
        sizeBytes: file.size,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ onSend, prefill, onPrefillConsumed }: ChatInputProps) {
  const t = useTranslations("Build");
  const tAttach = useTranslations("Attachments");
  const isStreaming = useAppStore((s) => s.isStreaming);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply prefill when it changes
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onPrefillConsumed?.();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [prefill, onPrefillConsumed]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (!imageError) return;
    const timer = setTimeout(() => setImageError(null), 3000);
    return () => clearTimeout(timer);
  }, [imageError]);

  const addImages = useCallback(
    async (files: File[]) => {
      setImageError(null);
      const imageFiles = files.filter((f) => ACCEPTED_TYPES.includes(f.type));

      if (imageFiles.length === 0 && files.length > 0) {
        setImageError(tAttach("unsupportedType"));
        return;
      }

      // Check size
      const tooBig = imageFiles.find((f) => f.size > MAX_IMAGE_SIZE);
      if (tooBig) {
        setImageError(tAttach("imageTooBig"));
        return;
      }

      // Check count
      if (pendingImages.length + imageFiles.length > MAX_IMAGES) {
        setImageError(tAttach("imageTooMany"));
        return;
      }

      const attachments = await Promise.all(imageFiles.map(readFileAsAttachment));
      const valid = attachments.filter((a): a is ImageAttachment => a !== null);
      if (valid.length > 0) {
        setPendingImages((prev) => [...prev, ...valid]);
      }
    },
    [pendingImages.length, tAttach]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasText = input.trim().length > 0;
    const hasImages = pendingImages.length > 0;
    if ((!hasText && !hasImages) || isStreaming) return;
    onSend(input.trim(), hasImages ? pendingImages : undefined);
    setInput("");
    setPendingImages([]);
    setImageError(null);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;

    e.preventDefault();
    const files = imageItems
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    addImages(files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) addImages(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addImages(files);
    // Reset so the same file can be selected again
    e.target.value = "";
  }

  function removeImage(id: string) {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  }

  const canSend = (input.trim().length > 0 || pendingImages.length > 0) && !isStreaming;

  return (
    <form
      onSubmit={handleSubmit}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-t-2 border-dummy-black/10 p-3"
    >
      {/* Image error toast */}
      {imageError && (
        <div className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
          {imageError}
        </div>
      )}

      {/* Image preview strip */}
      {pendingImages.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {pendingImages.map((img) => (
            <div key={img.id} className="group relative shrink-0">
              <img
                src={`data:${img.mimeType};base64,${img.base64}`}
                alt={img.filename}
                className="size-12 rounded-lg border-2 border-dummy-black/20 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                title={tAttach("removeImage")}
                className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-dummy-black text-dummy-yellow opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          title={tAttach("attachImage")}
          className="flex size-11 items-center justify-center rounded-xl text-dummy-black/50 transition-colors hover:bg-dummy-black/5 hover:text-dummy-black disabled:opacity-30"
        >
          <Paperclip className="size-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder={t("yourMessage")}
          disabled={isStreaming}
          className="flex-1 rounded-xl border-2 border-dummy-black/20 bg-dummy-white px-4 py-3 text-dummy-black placeholder:text-dummy-black/40 focus:border-dummy-black focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex size-11 items-center justify-center rounded-xl bg-dummy-black text-dummy-yellow transition-all hover:bg-dummy-black-light disabled:opacity-30"
        >
          <Send className="size-5" />
        </button>
      </div>
    </form>
  );
}
