import { useState, useEffect } from 'react';
import ePub from 'epubjs';
import { BookOpen, Loader2 } from 'lucide-react';
import { BookMetadata } from '../types';

interface BookPreviewProps {
  href: string;
  getFileBlob: (href: string) => Promise<Blob | null>;
  className?: string;
  storedMetadata?: BookMetadata;
  onMetadataExtracted?: (meta: BookMetadata) => void;
}

export function BookPreview({ href, getFileBlob, className, storedMetadata, onMetadataExtracted }: BookPreviewProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(storedMetadata?.coverUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storedMetadata?.coverUrl) {
      setCoverUrl(storedMetadata.coverUrl);
      return;
    }

    let cancelled = false;
    const loadCover = async () => {
      if (!href.toLowerCase().endsWith('.epub')) return;

      setLoading(true);
      try {
        const blob = await getFileBlob(href);
        if (cancelled || !blob) return;

        const buffer = await blob.arrayBuffer();
        const book = ePub(buffer);

        const [url, meta] = await Promise.all([
          book.coverUrl(),
          book.loaded.metadata
        ]);

        if (!cancelled) {
          let base64Cover = '';
          if (url && url.startsWith('blob:')) {
             // Convert blob to base64 for storage
             const response = await fetch(url);
             const coverBlob = await response.blob();
             base64Cover = await new Promise((resolve) => {
               const reader = new FileReader();
               reader.onloadend = () => resolve(reader.result as string);
               reader.readAsDataURL(coverBlob);
             });
          }

          const newMeta: BookMetadata = {
            title: (meta as any).title,
            author: (meta as any).creator,
            coverUrl: base64Cover || url || undefined
          };

          setCoverUrl(base64Cover || url || null);
          onMetadataExtracted?.(newMeta);
        }
      } catch (err) {
        console.error('Failed to load EPUB metadata:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCover();
    return () => { cancelled = true; };
  }, [href, getFileBlob, storedMetadata, onMetadataExtracted]);

  if (coverUrl) {
    return <img src={coverUrl} alt="Cover" className={`object-cover w-full h-full ${className}`} />;
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-800/30 ${className}`}>
        <Loader2 size={16} className="text-amber-500/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-slate-800/50 ${className}`}>
      <BookOpen size={24} className="text-slate-600" />
    </div>
  );
}
