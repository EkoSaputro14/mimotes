"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImageDocument {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string | null;
  status: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  ocrText: string | null;
  caption: string | null;
  imageSummary: string | null;
  imageUrl: string | null;
}

interface PaginatedImages {
  images: ImageDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ImagesPage() {
  const [data, setData] = useState<PaginatedImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      setLoading(true);
      const res = await fetch("/api/knowledge/images");
      if (!res.ok) throw new Error("Failed to fetch images");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <DashboardShell title="Images">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Image Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            View uploaded images with OCR text, AI captions, and summaries
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-40 bg-muted rounded mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Error loading images: {error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && data.images.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium mb-1">No images uploaded yet</p>
              <p className="text-sm">Upload images (PNG, JPG, JPEG, WebP) to see them here with OCR and AI captions.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && data.images.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={image.caption || image.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(image.status)}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium text-sm truncate" title={image.title}>
                      {image.title}
                    </h3>

                    {image.caption && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-medium text-foreground">Caption: </span>
                        {image.caption}
                      </p>
                    )}

                    {image.ocrText && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">OCR: </span>
                        <span className="line-clamp-3">{image.ocrText}</span>
                      </div>
                    )}

                    {image.imageSummary && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Summary: </span>
                        <span className="line-clamp-2">{image.imageSummary}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                      <span className="uppercase">{image.fileType}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="text-center text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
                {" "}({data.pagination.total} images total)
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
