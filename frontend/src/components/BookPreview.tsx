import { useState, useEffect } from 'react';
import ePub from 'epubjs';
import { BookOpen } from 'lucide-react';

interface BookPreviewProps {
  href: string;
  getFileBlob: (href: string) => Promise<Blob | null>;
  className?: string;
}

export function BookPreview({ href, getFileBlob, className }: BookPreviewProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCover = async () => {
      if (!href.toLowerCase().endsWith('.epub')) return;

      setLoading(true);
      try {
        const blob = await getFileBlob(href);
        if (cancelled || !blob) return;

        const buffer = await blob.arrayBuffer();
        const book = ePub(buffer);
        const url = await book.coverUrl();

        if (!cancelled && url) {
          setCoverUrl(url);
        }
      } catch (err) {
        console.error('Failed to load EPUB cover:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCover();
    return () => { cancelled = true; };
  }, [href, getFileBlob]);

  if (coverUrl) {
    return <img src={coverUrl} alt="Cover" className={`object-cover w-full h-full ${className}`} />;
  }

  return (
    <div className={`flex items-center justify-center bg-slate-800/50 ${className}`}>
      <BookOpen size={24} className="text-slate-600" />
    </div>
  );
}
