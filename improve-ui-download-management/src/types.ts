export interface WebDAVFile {
  href: string;
  name: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  contentType: string;
}

export interface BookMetadata {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  files: string[];
}

export interface BookodavMeta {
  categories: Category[];
  fileMetadata: Record<string, BookMetadata>;
  version: number;
}

export interface ConnectionConfig {
  url: string;
  username: string;
  password: string;
}

export type ViewMode = 'grid' | 'list';
export type AppView = 'library' | 'categories' | 'setup';
export type FileFilter = 'all' | 'books' | 'comics' | 'images' | 'documents' | 'archives' | 'other';
export type SortBy = 'name' | 'size' | 'date' | 'type';
export type SortOrder = 'asc' | 'desc';

export const BOOK_EXTENSIONS = [
  '.pdf', '.epub', '.mobi', '.azw', '.azw3', '.fb2', '.djvu', '.lit',
  '.doc', '.docx', '.rtf',
] as const;

export const COMIC_EXTENSIONS = ['.cbr', '.cbz'] as const;

export const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico', '.tiff', '.tif',
] as const;

export const DOCUMENT_EXTENSIONS = [
  '.txt', '.html', '.htm', '.md', '.csv', '.json', '.xml', '.css', '.js', '.ts',
  '.yaml', '.yml', '.log',
] as const;

export const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz'] as const;

export const FILE_EXTENSIONS: Record<string, readonly string[]> = {
  books: BOOK_EXTENSIONS,
  comics: COMIC_EXTENSIONS,
  images: IMAGE_EXTENSIONS,
  documents: DOCUMENT_EXTENSIONS,
  archives: ARCHIVE_EXTENSIONS,
};

export function getFileCategory(name: string): FileFilter {
  const lower = name.toLowerCase();
  for (const [cat, exts] of Object.entries(FILE_EXTENSIONS)) {
    if ((exts as readonly string[]).some((ext: string) => lower.endsWith(ext))) return cat as FileFilter;
  }
  return 'other';
}

export interface FormatInfo {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  gradient: string;
}

export const FORMAT_MAP: Record<string, FormatInfo> = {
  '.pdf':  { label: 'PDF',  color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)',  description: 'Portable Document', gradient: 'from-red-500/20 to-red-900/20' },
  '.epub': { label: 'EPUB', color: '#a855f7', bgColor: 'rgba(168,85,247,0.12)', description: 'Electronic Publication', gradient: 'from-purple-500/20 to-purple-900/20' },
  '.mobi': { label: 'MOBI', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)', description: 'Mobipocket eBook', gradient: 'from-violet-500/20 to-violet-900/20' },
  '.azw':  { label: 'AZW',  color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', description: 'Amazon Kindle', gradient: 'from-orange-500/20 to-orange-900/20' },
  '.azw3': { label: 'AZW3', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', description: 'Kindle Format 8', gradient: 'from-orange-500/20 to-orange-900/20' },
  '.fb2':  { label: 'FB2',  color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)',  description: 'FictionBook', gradient: 'from-cyan-500/20 to-cyan-900/20' },
  '.djvu': { label: 'DJVU', color: '#14b8a6', bgColor: 'rgba(20,184,166,0.12)', description: 'DjVu Document', gradient: 'from-teal-500/20 to-teal-900/20' },
  '.cbr':  { label: 'CBR',  color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)', description: 'Comic Book RAR', gradient: 'from-pink-500/20 to-pink-900/20' },
  '.cbz':  { label: 'CBZ',  color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)', description: 'Comic Book ZIP', gradient: 'from-pink-500/20 to-pink-900/20' },
  '.lit':  { label: 'LIT',  color: '#6366f1', bgColor: 'rgba(99,102,241,0.12)', description: 'MS Literature', gradient: 'from-indigo-500/20 to-indigo-900/20' },
  '.doc':  { label: 'DOC',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', description: 'Word Document', gradient: 'from-blue-500/20 to-blue-900/20' },
  '.docx': { label: 'DOCX', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', description: 'Word Document', gradient: 'from-blue-500/20 to-blue-900/20' },
  '.rtf':  { label: 'RTF',  color: '#0ea5e9', bgColor: 'rgba(14,165,233,0.12)', description: 'Rich Text', gradient: 'from-sky-500/20 to-sky-900/20' },
  '.txt':  { label: 'TXT',  color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)', description: 'Plain Text', gradient: 'from-slate-400/20 to-slate-700/20' },
  '.html': { label: 'HTML', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', description: 'HTML Document', gradient: 'from-orange-500/20 to-orange-900/20' },
  '.htm':  { label: 'HTM',  color: '#f97316', bgColor: 'rgba(249,115,22,0.12)', description: 'HTML Document', gradient: 'from-orange-500/20 to-orange-900/20' },
  '.md':   { label: 'MD',   color: '#64748b', bgColor: 'rgba(100,116,139,0.12)', description: 'Markdown', gradient: 'from-slate-500/20 to-slate-800/20' },
  '.zip':  { label: 'ZIP',  color: '#eab308', bgColor: 'rgba(234,179,8,0.12)',  description: 'ZIP Archive', gradient: 'from-yellow-500/20 to-yellow-900/20' },
  '.rar':  { label: 'RAR',  color: '#eab308', bgColor: 'rgba(234,179,8,0.12)',  description: 'RAR Archive', gradient: 'from-yellow-500/20 to-yellow-900/20' },
  '.jpg':  { label: 'JPG',  color: '#10b981', bgColor: 'rgba(16,185,129,0.12)', description: 'JPEG Image', gradient: 'from-emerald-500/20 to-emerald-900/20' },
  '.jpeg': { label: 'JPEG', color: '#10b981', bgColor: 'rgba(16,185,129,0.12)', description: 'JPEG Image', gradient: 'from-emerald-500/20 to-emerald-900/20' },
  '.png':  { label: 'PNG',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', description: 'PNG Image', gradient: 'from-blue-500/20 to-blue-900/20' },
  '.gif':  { label: 'GIF',  color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', description: 'GIF Image', gradient: 'from-amber-500/20 to-amber-900/20' },
  '.svg':  { label: 'SVG',  color: '#a855f7', bgColor: 'rgba(168,85,247,0.12)', description: 'SVG Vector', gradient: 'from-purple-500/20 to-purple-900/20' },
  '.webp': { label: 'WEBP', color: '#84cc16', bgColor: 'rgba(132,204,22,0.12)', description: 'WebP Image', gradient: 'from-lime-500/20 to-lime-900/20' },
  '.json': { label: 'JSON', color: '#eab308', bgColor: 'rgba(234,179,8,0.12)',  description: 'JSON Data', gradient: 'from-yellow-500/20 to-yellow-900/20' },
  '.xml':  { label: 'XML',  color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)',  description: 'XML Document', gradient: 'from-green-500/20 to-green-900/20' },
  '.css':  { label: 'CSS',  color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', description: 'Stylesheet', gradient: 'from-blue-500/20 to-blue-900/20' },
  '.csv':  { label: 'CSV',  color: '#10b981', bgColor: 'rgba(16,185,129,0.12)', description: 'Spreadsheet', gradient: 'from-emerald-500/20 to-emerald-900/20' },
};

export function getFormatInfo(name: string): FormatInfo {
  const ext = getFileExtension(name);
  return FORMAT_MAP[ext] || {
    label: ext.replace('.', '').toUpperCase() || '?',
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.1)',
    description: 'Unknown format',
    gradient: 'from-slate-500/20 to-slate-800/20',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0 || isNaN(bytes)) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > -1 ? name.substring(idx).toLowerCase() : '';
}

export function isViewableInBrowser(name: string): boolean {
  const ext = getFileExtension(name);
  return [
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp',
    '.txt', '.html', '.htm', '.md', '.json', '.xml', '.css', '.js', '.ts', '.csv', '.yaml', '.yml',
  ].includes(ext);
}

export function isBookFormat(name: string): boolean {
  const ext = getFileExtension(name);
  return ([...BOOK_EXTENSIONS, ...COMIC_EXTENSIONS] as readonly string[]).some(f => f === ext);
}

export function getMimeType(name: string): string {
  const ext = getFileExtension(name);
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.webp': 'image/webp',
    '.bmp': 'image/bmp', '.ico': 'image/x-icon',
    '.txt': 'text/plain', '.html': 'text/html', '.htm': 'text/html',
    '.md': 'text/markdown', '.json': 'application/json',
    '.xml': 'application/xml', '.css': 'text/css',
    '.js': 'text/javascript', '.ts': 'text/typescript',
    '.csv': 'text/csv', '.yaml': 'text/yaml', '.yml': 'text/yaml',
    '.epub': 'application/epub+zip',
    '.mobi': 'application/x-mobipocket-ebook',
    '.azw': 'application/vnd.amazon.ebook',
    '.azw3': 'application/vnd.amazon.ebook',
    '.fb2': 'application/x-fictionbook+xml',
    '.djvu': 'image/vnd.djvu',
    '.cbr': 'application/x-cbr',
    '.cbz': 'application/x-cbz',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.rtf': 'application/rtf',
    '.lit': 'application/x-ms-reader',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/** Parse "Author - Title" or "Title (Year)" patterns from filename */
export function parseFilenameMetadata(name: string): BookMetadata {
  const nameNoExt = name.replace(/\.[^.]+$/, '');
  // Pattern: "Author - Title"
  const dashMatch = nameNoExt.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return { author: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }
  // Pattern: "Title (Year)" or "Title [Year]"
  const yearMatch = nameNoExt.match(/^(.+?)\s*[\(\[](\d{4})[\)\]]$/);
  if (yearMatch) {
    return { title: yearMatch[1].trim() };
  }
  return { title: nameNoExt };
}

export const CATEGORY_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9', '#22c55e',
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fiction', name: 'Fiction', color: '#8b5cf6', files: [] },
  { id: 'non-fiction', name: 'Non-Fiction', color: '#3b82f6', files: [] },
  { id: 'technical', name: 'Technical', color: '#10b981', files: [] },
  { id: 'academic', name: 'Academic', color: '#f59e0b', files: [] },
  { id: 'comics', name: 'Comics & Manga', color: '#ef4444', files: [] },
  { id: 'magazines', name: 'Magazines', color: '#ec4899', files: [] },
];
