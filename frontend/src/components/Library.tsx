import { useState, useRef, useCallback } from 'react';
import {
  Search, Grid3X3, List, Upload, FolderPlus, ChevronRight, Home,
  Folder, FileText, Image, BookOpen, File, MoreVertical, Trash2,
  Tag, Eye, RefreshCw, Loader2, AlertCircle,
  ArrowUpDown, X, CheckCircle, BookMarked, Archive
} from 'lucide-react';
import { BookPreview } from './BookPreview';
import {
  WebDAVFile, Category, ViewMode, FileFilter, SortBy, SortOrder,
  getFileCategory, formatFileSize, formatDate, getFileExtension,
  getFormatInfo, isBookFormat, parseFilenameMetadata,
} from '../types';

interface LibraryProps {
  files: WebDAVFile[];
  loading: boolean;
  error: string | null;
  currentPath: string;
  viewMode: ViewMode;
  searchQuery: string;
  fileFilter: FileFilter;
  categories: Category[];
  uploading: boolean;
  uploadProgress: string | null;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: FileFilter) => void;
  onFileSelect: (file: WebDAVFile) => void;
  onUpload: (file: File) => void;
  onDelete: (path: string) => void;
  onDeleteMultiple: (paths: string[]) => void;
  onNavigateUp: () => void;
  onCreateDirectory: (name: string) => void;
  onAssignCategory: (filePath: string, categoryId: string) => void;
  onRefresh: () => void;
  getFileBlob: (path: string) => Promise<Blob | null>;
  fileMetadata: Record<string, BookMetadata>;
  onUpdateMetadata: (href: string, meta: BookMetadata) => void;
}

function getFileCategoryIcon(cat: FileFilter) {
  switch (cat) {
    case 'books': return BookMarked;
    case 'comics': return BookOpen;
    case 'images': return Image;
    case 'documents': return FileText;
    case 'archives': return Archive;
    default: return File;
  }
}

const FILTER_TABS: { id: FileFilter; label: string; icon: typeof File }[] = [
  { id: 'all', label: 'All', icon: Grid3X3 },
  { id: 'books', label: 'Books', icon: BookMarked },
  { id: 'comics', label: 'Comics', icon: BookOpen },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'documents', label: 'Docs', icon: FileText },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'other', label: 'Other', icon: File },
];

export function Library({
  files, loading, error, currentPath, viewMode, searchQuery, fileFilter,
  categories, uploading, uploadProgress, onViewModeChange, onSearchChange,
  onFilterChange, onFileSelect, onUpload, onDelete, onDeleteMultiple, onNavigateUp,
  onCreateDirectory, onAssignCategory, onRefresh, getFileBlob, fileMetadata, onUpdateMetadata
}: LibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ file: WebDAVFile; x: number; y: number } | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showCategoryMenu, setShowCategoryMenu] = useState<string | null>(null);
  const [selectedHrefs, setSelectedHrefs] = useState<string[]>([]);

  // Filter and sort files
  const filteredFiles = files
    .filter(file => {
      // Hide internal metadata files
      if (file.name === '.bookodav-meta.json') return false;

      if (searchQuery) {
        if (!file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (fileFilter !== 'all' && !file.isDirectory) {
        if (getFileCategory(file.name) !== fileFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'size': cmp = a.size - b.size; break;
        case 'date':
          cmp = new Date(a.lastModified || 0).getTime() - new Date(b.lastModified || 0).getTime();
          break;
        case 'type':
          cmp = getFileExtension(a.name).localeCompare(getFileExtension(b.name));
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const stats = {
    total: files.filter(f => !f.isDirectory && f.name !== '.bookodav-meta.json').length,
    books: files.filter(f => !f.isDirectory && getFileCategory(f.name) === 'books').length,
    comics: files.filter(f => !f.isDirectory && getFileCategory(f.name) === 'comics').length,
    images: files.filter(f => !f.isDirectory && getFileCategory(f.name) === 'images').length,
    documents: files.filter(f => !f.isDirectory && getFileCategory(f.name) === 'documents').length,
    folders: files.filter(f => f.isDirectory).length,
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(file => onUpload(file));
  }, [onUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach(file => onUpload(file));
    }
    e.target.value = '';
  }, [onUpload]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateDirectory(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const getFileCategories = (filePath: string) => {
    return categories.filter(c => c.files.includes(filePath));
  };

  const handleToggleSelect = (href: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedHrefs(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedHrefs.length === 0) return;
    if (confirm(`Delete ${selectedHrefs.length} selected item(s)?`)) {
      onDeleteMultiple(selectedHrefs);
      setSelectedHrefs([]);
    }
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => { setContextMenu(null); setShowCategoryMenu(null); }}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="p-12 rounded-3xl border-2 border-dashed border-amber-400/50 bg-amber-500/5 text-center">
            <Upload size={48} className="mx-auto mb-4 text-amber-400" />
            <p className="text-xl font-semibold text-white">Drop files to upload</p>
            <p className="text-sm text-slate-400 mt-1">Supports all book formats</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="shrink-0 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-1 text-sm flex-1 min-w-0">
            <button
              onClick={() => { onSearchChange(''); onFilterChange('all'); onNavigateUp(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all shrink-0"
            >
              <Home size={15} />
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 text-slate-500 min-w-0">
                <ChevronRight size={12} className="shrink-0" />
                <span className={`truncate text-xs ${i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {crumb}
                </span>
              </span>
            ))}
            {breadcrumbs.length === 0 && (
              <>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="text-white font-medium text-xs">Root</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onRefresh} disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all disabled:opacity-50" title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowNewFolder(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="New Folder">
              <FolderPlus size={15} />
            </button>
            {selectedHrefs.length > 0 && (
              <button onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 hover:bg-red-500/20 transition-all animate-scale-in">
                <Trash2 size={14} />
                <span>Delete ({selectedHrefs.length})</span>
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 disabled:opacity-50 transition-all">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span className="hidden sm:inline">Upload</span>
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileInput} className="hidden" />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 bg-slate-800/30 rounded-lg p-0.5 border border-slate-700/20 overflow-x-auto">
            {FILTER_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = fileFilter === tab.id;
              return (
                <button key={tab.id} onClick={() => onFilterChange(tab.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                    isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
                  }`}>
                  <Icon size={11} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (sortOrder === 'asc') setSortOrder('desc');
              else {
                setSortOrder('asc');
                const opts: SortBy[] = ['name', 'size', 'date', 'type'];
                setSortBy(opts[(opts.indexOf(sortBy) + 1) % opts.length]);
              }
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all border border-slate-700/20"
            title={`Sort: ${sortBy} ${sortOrder}`}
          >
            <ArrowUpDown size={11} />
            <span className="hidden xl:inline capitalize">{sortBy}</span>
          </button>

          <div className="flex items-center bg-slate-800/30 rounded-lg p-0.5 border border-slate-700/20">
            <button onClick={() => onViewModeChange('grid')}
              className={`p-1 rounded-md transition-all ${viewMode === 'grid' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-white'}`}>
              <Grid3X3 size={13} />
            </button>
            <button onClick={() => onViewModeChange('list')}
              className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-white'}`}>
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress && (
        <div className="shrink-0 px-5 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-3 animate-slide-up">
          <Loader2 size={13} className="text-amber-400 animate-spin" />
          <p className="text-[11px] text-amber-300">{uploadProgress}</p>
        </div>
      )}

      {/* New folder input */}
      {showNewFolder && (
        <div className="shrink-0 px-5 py-3 bg-slate-800/30 border-b border-slate-700/30 flex items-center gap-3 animate-slide-up">
          <FolderPlus size={15} className="text-amber-400" />
          <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
            placeholder="Folder name..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            autoFocus
          />
          <button onClick={handleCreateFolder} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-400 transition-all">Create</button>
          <button onClick={() => setShowNewFolder(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><X size={13} /></button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="shrink-0 px-5 py-2.5 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2 animate-slide-up">
          <AlertCircle size={13} className="text-red-400" />
          <p className="text-[11px] text-red-300 flex-1">{error}</p>
        </div>
      )}

      {/* Stats bar */}
      <div className="shrink-0 px-5 py-2 flex items-center gap-3 text-[10px] text-slate-500 border-b border-slate-800/30">
        <span>{stats.total} files</span>
        {stats.folders > 0 && <span className="text-slate-700">•</span>}
        {stats.folders > 0 && <span>{stats.folders} folders</span>}
        {stats.books > 0 && <><span className="text-slate-700">•</span><span className="text-purple-400/70">{stats.books} books</span></>}
        {stats.comics > 0 && <><span className="text-slate-700">•</span><span className="text-pink-400/70">{stats.comics} comics</span></>}
        {stats.images > 0 && <><span className="text-slate-700">•</span><span className="text-emerald-400/70">{stats.images} images</span></>}
        {stats.documents > 0 && <><span className="text-slate-700">•</span><span className="text-blue-400/70">{stats.documents} docs</span></>}
      </div>

      {/* File grid/list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center animate-float">
              {searchQuery ? <Search size={24} className="text-slate-600" /> : <Upload size={24} className="text-slate-600" />}
            </div>
            <p className="text-sm font-medium text-slate-300">
              {searchQuery ? 'No files match your search' : 'No files here yet'}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Try a different search term' : 'Upload books or drag & drop files'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {/* Go up */}
            {currentPath !== '/' && (
              <button onClick={onNavigateUp}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-800/50 hover:border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-slate-700/30 flex items-center justify-center group-hover:bg-slate-700/50 transition-all">
                  <ChevronRight size={18} className="text-slate-500 rotate-180" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">..</span>
              </button>
            )}

            {filteredFiles.map((file, i) => {
              const isSelected = selectedHrefs.includes(file.href);
              if (file.isDirectory) {
                return (
                  <div
                    key={file.href + i}
                    className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all duration-200 animate-fade-in ${
                      isSelected ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800/40 hover:border-amber-500/20 bg-slate-800/20 hover:bg-slate-800/40'
                    }`}
                    style={{ animationDelay: `${i * 20}ms` }}
                    onClick={() => onFileSelect(file)}
                  >
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(file.href)}
                         onClick={e => e.stopPropagation()} className="accent-amber-500" />
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center transition-all group-hover:scale-110">
                      <Folder size={22} className="text-amber-400" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-200 truncate w-full text-center" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                );
              }

              // File card — book-style for books, regular for others
              const fmt = getFormatInfo(file.name);
              const fileCats = getFileCategories(file.href);
              const isBook = isBookFormat(file.name);
              const meta = isBook ? parseFilenameMetadata(file.name) : null;

              return (
                <div
                  key={file.href + i}
                  className={`book-card group relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 animate-fade-in overflow-hidden ${
                    isSelected ? 'border-amber-500/50 ring-1 ring-amber-500/50' : ''
                  } ${
                    isBook && !isSelected
                      ? 'border-slate-800/40 hover:border-slate-600/50 bg-gradient-to-br ' + fmt.gradient
                      : isSelected ? 'bg-amber-500/5' : 'border-slate-800/40 hover:border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/40'
                  }`}
                  style={{ animationDelay: `${i * 20}ms` }}
                  onClick={() => onFileSelect(file)}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ file, x: e.clientX, y: e.clientY }); }}
                >
                  {/* Selection checkbox */}
                  <div className={`absolute top-2 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(file.href)}
                      onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 accent-amber-500" />
                  </div>
                  {/* Book spine accent */}
                  {isBook && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: fmt.color + '80' }} />
                  )}

                  {/* Category dots */}
                  {fileCats.length > 0 && (
                    <div className="absolute top-2 left-3 flex gap-1 z-10">
                      {fileCats.slice(0, 3).map(c => (
                        <div key={c.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} title={c.name} />
                      ))}
                    </div>
                  )}

                  {/* More menu */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setContextMenu({ file, x: e.clientX, y: e.clientY }); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-600 hover:text-white hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <MoreVertical size={12} />
                  </button>

                  {/* Card content */}
                  <div className={`flex flex-col items-center gap-1.5 p-4 ${isBook ? 'pt-5 pb-3' : 'py-4'} h-full`}>
                    {/* Format badge */}
                    <span className="format-badge z-10" style={{ backgroundColor: fmt.bgColor, color: fmt.color }}>
                      {fmt.label}
                    </span>

                    {/* Icon / Preview */}
                    <div className={`rounded shadow-sm overflow-hidden flex items-center justify-center my-1 transition-all ${isBook ? 'w-full flex-1 min-h-[120px]' : 'w-10 h-10'}`}
                      style={{ backgroundColor: fmt.bgColor }}>
                      {isBook && getFileExtension(file.name) === '.epub' ? (
                        <BookPreview
                          href={file.href}
                          getFileBlob={getFileBlob}
                          className="w-full h-full object-contain"
                          storedMetadata={fileMetadata[file.href]}
                          onMetadataExtracted={(meta) => onUpdateMetadata(file.href, meta)}
                        />
                      ) : (
                        (() => {
                          const Icon = getFileCategoryIcon(getFileCategory(file.name));
                          return <Icon size={isBook ? 48 : 20} style={{ color: fmt.color }} />;
                        })()
                      )}
                    </div>

                    {/* Title */}
                    <div className="text-center w-full">
                      <p className="text-[11px] font-semibold text-slate-200 truncate w-full" title={file.name}>
                        {meta?.title || file.name.replace(/\.[^.]+$/, '')}
                      </p>
                      {meta?.author && (
                        <p className="text-[9px] text-slate-400 truncate w-full mt-0.5">{meta.author}</p>
                      )}
                      <p className="text-[9px] text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-0.5">
            {currentPath !== '/' && (
              <button onClick={onNavigateUp}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-slate-700/30 flex items-center justify-center">
                  <ChevronRight size={14} className="text-slate-500 rotate-180" />
                </div>
                <span className="text-xs text-slate-500 font-medium">..</span>
              </button>
            )}
            {filteredFiles.map((file, i) => {
              const fmt = getFormatInfo(file.name);
              const fileCats = getFileCategories(file.href);
              const isBook = isBookFormat(file.name);
              const meta = isBook ? parseFilenameMetadata(file.name) : null;
              const CatIcon = file.isDirectory ? Folder : getFileCategoryIcon(getFileCategory(file.name));
              const isSelected = selectedHrefs.includes(file.href);

              return (
                <div
                  key={file.href + i}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all animate-fade-in ${
                    isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'
                  }`}
                  style={{ animationDelay: `${i * 10}ms` }}
                  onClick={() => onFileSelect(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!file.isDirectory) setContextMenu({ file, x: e.clientX, y: e.clientY });
                  }}
                >
                  {/* Selection checkbox */}
                  <div className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(file.href)}
                      onClick={e => e.stopPropagation()} className="accent-amber-500" />
                  </div>

                  {/* Icon / Preview */}
                  <div className="w-8 h-10 rounded overflow-hidden flex items-center justify-center shrink-0"
                    style={{ backgroundColor: file.isDirectory ? 'rgba(251,191,36,0.1)' : fmt.bgColor }}>
                    {!file.isDirectory && getFileExtension(file.name) === '.epub' ? (
                      <BookPreview
                        href={file.href}
                        getFileBlob={getFileBlob}
                        className="w-full h-full"
                        storedMetadata={fileMetadata[file.href]}
                        onMetadataExtracted={(meta) => onUpdateMetadata(file.href, meta)}
                      />
                    ) : (
                      <CatIcon size={15} style={{ color: file.isDirectory ? '#fbbf24' : fmt.color }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {meta?.title || file.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {meta?.author && (
                        <span className="text-[9px] text-slate-500">{meta.author}</span>
                      )}
                      {fileCats.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-0.5 text-[9px]">
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: c.color }} />
                          <span style={{ color: c.color }}>{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {!file.isDirectory && (
                    <>
                      <span className="format-badge shrink-0" style={{ backgroundColor: fmt.bgColor, color: fmt.color }}>
                        {fmt.label}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 w-14 text-right hidden sm:block">{formatFileSize(file.size)}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 w-16 text-right hidden md:block">{formatDate(file.lastModified)}</span>
                    </>
                  )}

                  {file.isDirectory && (
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                  )}

                  {!file.isDirectory && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setContextMenu({ file, x: e.clientX, y: e.clientY }); }}
                      className="p-1 rounded-lg text-slate-600 hover:text-white hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <MoreVertical size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed z-50 animate-scale-in" style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}>
          <div className="w-48 py-1.5 rounded-xl bg-slate-800 border border-slate-700/50 shadow-2xl shadow-black/50">
            <button
              onClick={() => { onFileSelect(contextMenu.file); setContextMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <Eye size={13} /> View / Read
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryMenu(showCategoryMenu === contextMenu.file.href ? null : contextMenu.file.href);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <Tag size={13} /> Categorize
                <ChevronRight size={11} className="ml-auto text-slate-500" />
              </button>
              {showCategoryMenu === contextMenu.file.href && (
                <div className="absolute left-full top-0 ml-1 w-44 py-1.5 rounded-xl bg-slate-800 border border-slate-700/50 shadow-2xl animate-scale-in">
                  {categories.map(cat => {
                    const isAssigned = cat.files.includes(contextMenu.file.href);
                    return (
                      <button key={cat.id}
                        onClick={() => onAssignCategory(contextMenu.file.href, cat.id)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 text-left">{cat.name}</span>
                        {isAssigned && <CheckCircle size={12} className="text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="my-1 border-t border-slate-700/30" />
            <button
              onClick={() => {
                if (confirm(`Delete "${contextMenu.file.name}"?`)) onDelete(contextMenu.file.href);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
