import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Download, ZoomIn, ZoomOut, RotateCw,
  FileText, Image, BookOpen, File, Loader2, AlertCircle, Tag,
  CheckCircle, BookMarked, Archive
} from 'lucide-react';
import {
  WebDAVFile, Category, formatFileSize, formatDate, getFileExtension,
  getFileCategory, getMimeType, isViewableInBrowser, isBookFormat,
  getFormatInfo, parseFilenameMetadata, FileFilter,
} from '../types';

interface FileViewerProps {
  file: WebDAVFile;
  onClose: () => void;
  getFileBlob: (path: string) => Promise<Blob | null>;
  categories: Category[];
  onAssignCategory: (filePath: string, categoryId: string) => void;
}

function getCategoryIcon(cat: FileFilter) {
  switch (cat) {
    case 'books': return BookMarked;
    case 'comics': return BookOpen;
    case 'images': return Image;
    case 'documents': return FileText;
    case 'archives': return Archive;
    default: return File;
  }
}

export function FileViewer({ file, onClose, getFileBlob, categories, onAssignCategory }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCategories, setShowCategories] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ext = getFileExtension(file.name);
  const fileCat = getFileCategory(file.name);
  const mime = getMimeType(file.name);
  const canView = isViewableInBrowser(file.name);
  const isBook = isBookFormat(file.name);
  const fmt = getFormatInfo(file.name);
  const meta = parseFilenameMetadata(file.name);

  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext);
  const isPdf = ext === '.pdf';
  const isText = ['.txt', '.md', '.json', '.xml', '.css', '.js', '.ts', '.csv', '.yaml', '.yml'].includes(ext);
  const isHtml = ['.html', '.htm'].includes(ext);

  useEffect(() => {
    let cancelled = false;
    const loadFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const blob = await getFileBlob(file.href);
        if (cancelled || !blob) {
          if (!cancelled && !blob) setError('Failed to load file');
          return;
        }

        if (isText) {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else if (isHtml) {
          const text = await blob.text();
          if (!cancelled) setTextContent(text);
        } else {
          const correctBlob = new Blob([blob], { type: mime });
          const url = URL.createObjectURL(correctBlob);
          if (!cancelled) setBlobUrl(url);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load file';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (canView) {
      loadFile();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [file.href, canView, isText, isHtml, mime, getFileBlob]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25));
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      a.click();
    } else {
      const blob = await getFileBlob(file.href);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }, [blobUrl, file, getFileBlob]);

  const fileCats = categories.filter(c => c.files.includes(file.href));
  const CategoryIcon = getCategoryIcon(fileCat);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b border-slate-800/50 bg-slate-900/50">
        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Format badge */}
          <span className="format-badge shrink-0" style={{ backgroundColor: fmt.bgColor, color: fmt.color }}>
            {fmt.label}
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-white truncate">{meta.title || file.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              {meta.author && <span>{meta.author}</span>}
              {meta.author && <span>·</span>}
              <span>{formatFileSize(file.size)}</span>
              <span>·</span>
              <span>{formatDate(file.lastModified)}</span>
              {fileCats.length > 0 && (
                <>
                  <span>·</span>
                  {fileCats.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span style={{ color: c.color }}>{c.name}</span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isImage && (
            <>
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="Zoom out">
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button onClick={() => setZoom(1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="Reset">
                <RotateCw size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
            </>
          )}

          <div className="relative">
            <button onClick={() => setShowCategories(!showCategories)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="Categorize">
              <Tag size={14} />
            </button>
            {showCategories && (
              <div className="absolute right-0 top-full mt-1 w-48 py-1.5 rounded-xl bg-slate-800 border border-slate-700/50 shadow-2xl z-10 animate-scale-in">
                <p className="px-3 py-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Category</p>
                {categories.map(cat => {
                  const isAssigned = cat.files.includes(file.href);
                  return (
                    <button key={cat.id} onClick={() => onAssignCategory(file.href, cat.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-left">{cat.name}</span>
                      {isAssigned && <CheckCircle size={12} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-all border border-slate-700/50">
            <Download size={13} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
        onClick={() => { if (showCategories) setShowCategories(false); }}>
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-amber-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading file...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm font-medium text-red-300">{error}</p>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all">
              <Download size={16} /> Download Instead
            </button>
          </div>
        ) : isPdf && blobUrl ? (
          <iframe src={blobUrl} className="w-full h-full rounded-xl border border-slate-800/50 bg-white" title={file.name} />
        ) : isImage && blobUrl ? (
          <div className="flex items-center justify-center w-full h-full overflow-auto">
            <img src={blobUrl} alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }} draggable={false} />
          </div>
        ) : isHtml && textContent ? (
          <iframe srcDoc={textContent} className="w-full h-full rounded-xl border border-slate-800/50 bg-white"
            title={file.name} sandbox="allow-same-origin" />
        ) : isText && textContent !== null ? (
          <div className="w-full max-w-4xl h-full overflow-auto">
            <pre className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/50 text-sm text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {textContent}
            </pre>
          </div>
        ) : (
          /* Non-viewable file — book info card (NEVER auto-downloads) */
          <div className="flex flex-col items-center gap-6 text-center max-w-md animate-slide-up">
            {/* Book-style cover placeholder */}
            <div className={`relative w-48 h-64 rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-black/30 border border-slate-700/30 bg-gradient-to-br ${fmt.gradient}`}>
              {/* Spine */}
              <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ backgroundColor: fmt.color + '60' }} />
              {/* Format */}
              <span className="format-badge text-xs mb-3" style={{ backgroundColor: fmt.bgColor, color: fmt.color }}>
                {fmt.label}
              </span>
              <CategoryIcon size={36} style={{ color: fmt.color }} className="mb-3 opacity-60" />
              <p className="text-sm font-semibold text-white px-4 line-clamp-2">{meta.title || file.name}</p>
              {meta.author && <p className="text-[10px] text-slate-400 mt-1 px-4">{meta.author}</p>}
            </div>

            {/* File info grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Size</p>
                <p className="text-sm font-semibold text-white mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Format</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: fmt.color }}>{fmt.description}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Modified</p>
                <p className="text-sm font-semibold text-white mt-0.5">{formatDate(file.lastModified)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Type</p>
                <p className="text-sm font-semibold text-white mt-0.5 capitalize">{isBook ? 'Book' : fileCat}</p>
              </div>
            </div>

            {/* Reader not available message */}
            <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20 w-full">
              <p className="text-[11px] text-slate-400">
                {ext === '.epub' && '📖 EPUB reader coming soon! For now, download and read with your favorite ebook app or KOReader.'}
                {ext === '.mobi' && '📱 MOBI files are best read on Kindle devices. Download and transfer via USB or email.'}
                {(ext === '.cbr' || ext === '.cbz') && '🎨 Comic reader coming soon! Download and read with a comic viewer app.'}
                {ext === '.fb2' && '📚 FB2 reader coming soon! Download and read with FBReader or KOReader.'}
                {ext === '.djvu' && '📄 DJVU files require a specialized viewer. Download to read.'}
                {ext === '.doc' || ext === '.docx' ? '📝 Word documents can be opened with Microsoft Word or LibreOffice.' : ''}
                {ext === '.rtf' && '📝 RTF files can be opened with most text editors.'}
                {ext === '.lit' && '📖 LIT is a legacy Microsoft format. Use Calibre to convert it.'}
                {ext === '.azw' || ext === '.azw3' ? '📱 Kindle format — transfer to your Kindle device to read.' : ''}
                {!isBook && ext !== '.doc' && ext !== '.docx' && ext !== '.rtf' && 'This file type cannot be previewed in the browser.'}
              </p>
            </div>

            {/* Categories */}
            {fileCats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {fileCats.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: c.color + '15', color: c.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            {/* Download button */}
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all">
              <Download size={18} /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
