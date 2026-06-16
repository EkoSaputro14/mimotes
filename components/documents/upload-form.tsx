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
  rawSize: number;
  status: "uploading" | "processing" | "complete" | "pending" | "failed";
  progress: number;
  fileRef?: File;
}

function getFileIcon(name: string) {
  if (name.match(/\.(xlsx|xls|csv)$/i)) return FileSpreadsheet;
  if (name.match(/\.(png|jpg|jpeg|webp)$/i)) return FileImage;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      files.forEach((file) => uploadFile(file));
    }
  }, []);

  // Upload with progress tracking via XMLHttpRequest
  function uploadFile(file: File) {
    const itemId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const item: QueueItem = {
      id: itemId,
      name: file.name,
      size: formatSize(file.size),
      rawSize: file.size,
      status: "uploading",
      progress: 0,
      fileRef: file,
    };
    setQueue((prev) => [item, ...prev]);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setQueue((prev) =>
          prev.map((q) => (q.id === itemId ? { ...q, progress: pct } : q))
        );
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success(`Dokumen "${data.title}" berhasil diupload.`);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId ? { ...q, status: "processing" as const, progress: 100 } : q
            )
          );
          // Poll for processing completion
          pollProcessing(itemId, data.documentId || data.id);
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
        toast.error("Gagal memproses respons server");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "failed" as const } : q
          )
        );
      }
    };

    xhr.onerror = () => {
      toast.error("Terjadi kesalahan saat mengupload");
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: "failed" as const } : q
        )
      );
    };

    xhr.send(formData);
  }

  // Poll document status until ready/failed
  function pollProcessing(itemId: string, docId: string | undefined) {
    if (!docId) {
      // No docId — just mark as complete after a delay
      setTimeout(() => {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "complete" as const } : q
          )
        );
      }, 3000);
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "complete" as const } : q
          )
        );
        return;
      }
      try {
        const res = await fetch(`/api/documents/${docId}`);
        if (res.ok) {
          const doc = await res.json();
          if (doc.status === "ready") {
            clearInterval(interval);
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId ? { ...q, status: "complete" as const } : q
              )
            );
            router.refresh();
          } else if (doc.status === "failed") {
            clearInterval(interval);
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId ? { ...q, status: "failed" as const } : q
              )
            );
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);
  }

  async function handleFileUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(false);
  }

  async function handleUrlUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);

    const itemId = `url-${Date.now()}`;
    setQueue((prev) => [
      {
        id: itemId,
        name: url.split("/").pop() || url,
        size: "URL",
        rawSize: 0,
        status: "uploading",
        progress: 0,
      },
      ...prev,
    ]);

    const formData = new FormData();
    formData.append("url", url);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setQueue((prev) =>
          prev.map((q) => (q.id === itemId ? { ...q, progress: pct } : q))
        );
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success(`URL "${data.title}" berhasil ditambahkan.`);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId ? { ...q, status: "processing" as const, progress: 100 } : q
            )
          );
          pollProcessing(itemId, data.documentId || data.id);
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
        toast.error("Gagal memproses respons server");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, status: "failed" as const } : q
          )
        );
      }
    };

    xhr.onerror = () => {
      toast.error("Terjadi kesalahan saat menambahkan URL");
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: "failed" as const } : q
        )
      );
    };

    xhr.send(formData);
    setLoading(false);
  }

  function retryFile(item: QueueItem) {
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
    if (item.fileRef) {
      uploadFile(item.fileRef);
    }
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
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
              PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP. Max 10MB.
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
                  uploadFile(e.target.files[0]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
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
            <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
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
            Antrian Upload
          </h4>
          {activeCount > 0 && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium" role="status">
              {activeCount} sedang diproses
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
              const isActive = item.status === "uploading" || item.status === "processing";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card border border-border/20 rounded-xl p-4 transition-opacity",
                    item.status === "pending" && "opacity-60 border-dashed",
                    item.status === "complete" && "opacity-80 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-semibold text-foreground truncate">{item.name}</h5>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {item.status === "uploading" && (
                            <span className="text-xs font-medium text-primary">{item.progress}%</span>
                          )}
                          {item.status === "processing" && (
                            <div className="flex items-center gap-1.5 text-primary">
                              <Loader2 className="size-3.5 animate-spin" />
                              <span className="text-xs font-medium">Memproses...</span>
                            </div>
                          )}
                          {item.status === "complete" && (
                            <div className="flex items-center gap-1.5 text-emerald-500">
                              <CheckCircle2 className="size-3.5" />
                              <span className="text-xs font-medium">Selesai</span>
                            </div>
                          )}
                          {item.status === "failed" && (
                            <button
                              onClick={() => retryFile(item)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              Coba Lagi
                            </button>
                          )}
                          {!isActive && item.status !== "pending" && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar — single bar, no 5-stage pipeline */}
                      {isActive && (
                        <div className="mt-1.5">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${item.status === "processing" ? 100 : item.progress}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {item.status === "uploading"
                              ? `Mengupload ${formatSize(item.rawSize * item.progress / 100)} dari ${item.size}`
                              : "Memproses dokumen..."}
                          </p>
                        </div>
                      )}

                      {!isActive && item.status !== "pending" && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.size}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
