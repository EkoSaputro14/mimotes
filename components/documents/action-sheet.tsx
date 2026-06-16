"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Folder {
  id: string;
  name: string;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onDelete: (id: string, title: string) => void;
  onMove: (docId: string, folderId: string | null) => void;
}

export default function ActionSheet({
  open,
  onClose,
  documentId,
  documentTitle,
  onDelete,
  onMove,
}: ActionSheetProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolders, setShowFolders] = useState(false);

  useEffect(() => {
    if (open) {
      setShowFolders(false);
      fetch("/api/folders")
        .then((res) => res.json())
        .then((data) => setFolders(data.folders || []))
        .catch(() => {});
    }
  }, [open]);

  function handleView() {
    window.location.href = `/knowledge/documents/${documentId}`;
  }

  function handleDelete() {
    if (confirm(`Hapus "${documentTitle}"?`)) {
      onDelete(documentId, documentTitle);
      onClose();
    }
  }

  function handleMove(folderId: string | null) {
    onMove(documentId, folderId);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl">
        <SheetHeader className="px-1">
          <SheetTitle className="text-sm truncate">{documentTitle}</SheetTitle>
        </SheetHeader>
        <div className="px-1 pb-4">
          {showFolders ? (
            <div className="space-y-1">
              <button
                onClick={() => handleMove(null)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Tanpa Folder
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMove(folder.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {folder.name}
                </button>
              ))}
              <button
                onClick={() => setShowFolders(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={handleView}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat Dokumen
              </button>
              <button
                onClick={() => setShowFolders(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Pindah ke Folder
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
