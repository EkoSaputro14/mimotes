"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  Link2,
  CloudUpload,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckCircle2,
  Loader2,
  Clock,
  Trash2,
} from "lucide-react";

interface QueueItem {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "complete" | "pending" | "failed";
  stage?: number;
  fileRef?: File;
}

const STAGES = ["Upload", "Parse", "Chunk", "Embed", "Store"] as const;

function getFileIcon(name: string) {
  if (name.match(/\.(xlsx|xls|csv)$/i)) return FileSpreadsheet;
  if (name.match(/\.(png|jpg|jpeg|webp)$/i)) return FileImage;
  return FileText;
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const activeCount = queue.filter(
    (q) => q.status === "uploading" || q.status === "processing"
  ).length;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newItems: QueueItem[] = files.map((f, i) => ({
        id: `drop-${Date.now()}-${i}`,
        name: f.name,
        size: formatSize(f.size),
        status: "uploading" as const,
        stage: 1,
        fileRef: f,
      }));
      setQueue((prev) => [...newItems, ...prev]);
      files.forEach((file) => uploadFile(file));
    }
  }, []);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const itemId = `upload-${Date.now()}`;

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Dokumen "${data.title}" berhasil diupload.`);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "complete" as const, stage: 5 } : q
          )
        );
        setTimeout(() => router.refresh(), 2000);
      } else {
        toast.error(data.error || "Gagal mengupload dokumen");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "failed" as const } : q
          )
        );
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengupload");
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: "failed" as const } : q
        )
      );
    }
  }

  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    const itemId = `upload-${Date.now()}`;
    setQueue((prev) => [
      {
        id: itemId,
        name: file?.name || "Unknown",
        size: file ? formatSize(file.size) : "0 B",
        status: "uploading",
        stage: 1,
        fileRef: file || undefined,
      },
      ...prev,
    ]);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Dokumen "${data.title}" berhasil diupload.`);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? { ...q, status: "complete" as const, stage: 5 }
              : q
          )
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => router.refresh(), 2000);
      } else {
        toast.error(data.error || "Gagal mengupload dokumen");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "failed" as const } : q
          )
        );
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengupload");
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: "failed" as const } : q
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("url", url);

    const itemId = `url-${Date.now()}`;
    setQueue((prev) => [
      {
        id: itemId,
        name: url.split("/").pop() || url,
        size: "URL",
        status: "uploading",
        stage: 1,
      },
      ...prev,
    ]);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`URL "${data.title}" berhasil ditambahkan.`);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? { ...q, status: "complete" as const, stage: 5 }
              : q
          )
        );
        setUrl("");
        setTimeout(() => router.refresh(), 2000);
      } else {
        toast.error(data.error || "Gagal menambahkan URL");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "failed" as const } : q
          )
        );
      }
    } catch {
      toast.error("Terjadi kesalahan saat menambahkan URL");
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: "failed" as const } : q
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function retryFile(item: QueueItem) {
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
    if (item.fileRef) {
      uploadFile(item.fileRef);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Upload Dokumen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload dokumen atau impor URL untuk membangun knowledge base AI Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-8">
        <button
          onClick={() => setUploadType("file")}
          className={cn(
            "pb-3 text-sm font-medium px-1 transition-all border-b-2",
            uploadType === "file"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <Upload className="size-4" />
            File Upload
          </span>
        </button>
        <button
          onClick={() => setUploadType("url")}
          className={cn(
            "pb-3 text-sm font-medium px-1 transition-all border-b-2",
            uploadType === "url"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <Link2 className="size-4" />
            URL Import
          </span>
        </button>
      </div>

      {/* Upload Zone */}
      {uploadType === "file" ? (
        <form onSubmit={handleFileUpload} className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "w-full min-h-[280px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer group",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-primary/30 bg-card hover:border-primary hover:bg-card/80"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CloudUpload className="size-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Supported formats: PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP. Max 100MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
              required
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0];
                  setQueue((prev) => [
                    {
                      id: `input-${Date.now()}`,
                      name: file.name,
                      size: formatSize(file.size),
                      status: "uploading",
                      stage: 1,
                      fileRef: file,
                    },
                    ...prev,
                  ]);
                }
              }}
            />
            <button
              type="button"
              className="px-6 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select Files
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Mengupload..." : "Upload Dokumen"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUrlUpload} className="space-y-6">
          <div className="bg-card border border-border/20 rounded-xl p-6">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-foreground mb-2"
            >
              URL Website
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Masukkan URL halaman web untuk dijadikan sumber pengetahuan
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Menambahkan..." : "Tambahkan URL"}
          </button>
        </form>
      )}

      {/* Processing Queue */}
      <section aria-live="polite" aria-atomic="false">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-foreground">
            Processing Queue
          </h4>
          {activeCount > 0 && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium" role="status">
              {activeCount} active process{activeCount > 1 ? "es" : ""}
            </span>
          )}
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada file yang diupload
          </p>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => {
              const Icon = getFileIcon(item.name);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card border border-border/20 rounded-xl p-4 transition-opacity",
                    item.status === "pending" && "opacity-60 border-dashed",
                    item.status === "complete" && "opacity-80 hover:opacity-100"
                  )}
                >
                  {/* Queue Item Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Icon className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-foreground">
                          {item.name}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          {item.size}
                          {item.status === "complete" && " • Completed"}
                          {item.status === "pending" && " • Queued"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === "processing" && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Loader2 className="size-4 animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Processing
                          </span>
                        </div>
                      )}
                      {item.status === "uploading" && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Loader2 className="size-4 animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Uploading
                          </span>
                        </div>
                      )}
                      {item.status === "complete" && (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="size-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Successful
                          </span>
                        </div>
                      )}
                      {item.status === "pending" && (
                        <div className="flex items-center gap-1.5 text-muted-foreground/50">
                          <Clock className="size-4" />
                          <span className="text-xs uppercase tracking-wider">
                            Pending
                          </span>
                        </div>
                      )}
                      {item.status === "failed" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => retryFile(item)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors min-h-[32px]"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Coba Lagi
                          </button>
                        </div>
                      )}
                      {item.status === "complete" && (
                        <button className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Pipeline — only for active items */}
                  {(item.status === "uploading" || item.status === "processing") &&
                    item.stage && item.stage > 0 && (
                      <div className="flex justify-between items-start max-w-2xl mx-auto px-4 relative mt-2">
                        {STAGES.map((stage, idx) => {
                          const stageNum = idx + 1;
                          const isDone = stageNum < item.stage!;
                          const isActive = stageNum === item.stage!;
                          const isPending = stageNum > item.stage!;

                          return (
                            <div
                              key={stage}
                              className="flex flex-col items-center gap-1.5 relative z-10 flex-1"
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  isDone && "bg-primary",
                                  isActive &&
                                    "border-2 border-primary bg-background shadow-[0_0_12px_rgba(99,102,241,0.3)]",
                                  isPending &&
                                    "border border-border bg-card"
                                )}
                              >
                                {isDone && (
                                  <CheckCircle2 className="size-4 text-primary-foreground" />
                                )}
                                {isActive && (
                                  <Loader2 className="size-4 text-primary animate-spin" />
                                )}
                                {isPending && (
                                  <div className="w-2 h-2 rounded-full bg-border" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[11px] uppercase tracking-tighter font-medium",
                                  isDone && "text-primary",
                                  isActive && "text-foreground font-bold",
                                  isPending && "text-muted-foreground"
                                )}
                              >
                                {stage}
                              </span>
                              {idx < STAGES.length - 1 && (
                                <div
                                  className={cn(
                                    "absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-px",
                                    isDone ? "bg-primary" : "bg-border"
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
