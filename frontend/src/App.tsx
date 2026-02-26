import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebDAV } from './hooks/useWebDAV';
import { Sidebar } from './components/Sidebar';
import { ConnectForm } from './components/ConnectForm';
import { Library } from './components/Library';
import { FileViewer } from './components/FileViewer';
import { CategoryView } from './components/CategoryView';
import { SetupGuide } from './components/SetupGuide';
import { WebDAVFile, Category, AppView, ViewMode, FileFilter, ConnectionConfig, DEFAULT_CATEGORIES } from './types';

export function App() {
  const webdav = useWebDAV();
  const [view, setView] = useState<AppView>('library');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFile, setSelectedFile] = useState<WebDAVFile | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('bookodav-categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });
  const [fileMetadata, setFileMetadata] = useState<Record<string, BookMetadata>>(() => {
    try {
      const saved = localStorage.getItem('bookodav-metadata');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage immediately
  useEffect(() => {
    localStorage.setItem('bookodav-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('bookodav-metadata', JSON.stringify(fileMetadata));
  }, [fileMetadata]);

  // Debounced save to WebDAV
  useEffect(() => {
    if (!webdav.connected) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      webdav.saveMetadata({
        version: 1,
        categories,
        fileMetadata,
      });
    }, 3000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [categories, fileMetadata, webdav.connected]);

  // Auto-connect + load metadata
  useEffect(() => {
    if (webdav.config && !webdav.connected && !webdav.loading) {
      webdav.connect(webdav.config).then(() => {
        // After connect, try to load metadata from server
        webdav.loadMetadata().then(meta => {
          if (meta?.categories && meta.categories.length > 0) {
            setCategories(meta.categories);
          }
          if (meta?.fileMetadata) {
            setFileMetadata(meta.fileMetadata);
          }
        });
      });
    }
  }, []);

  const handleConnect = useCallback(async (config: ConnectionConfig) => {
    await webdav.connect(config);
    // Try to load server-side categories
    const meta = await webdav.loadMetadata();
    if (meta?.categories && meta.categories.length > 0) {
      setCategories(meta.categories);
    }
    if (meta?.fileMetadata) {
      setFileMetadata(meta.fileMetadata);
    }
  }, [webdav]);

  const handleFileSelect = useCallback((file: WebDAVFile) => {
    if (file.isDirectory) {
      const newPath = file.href.endsWith('/') ? file.href : file.href + '/';
      webdav.listFiles(newPath);
    } else {
      setSelectedFile(file);
    }
  }, [webdav]);

  const handleCloseViewer = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleAddCategory = useCallback((name: string, color: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    setCategories(prev => [...prev, { id, name, color, files: [] }]);
  }, []);

  const handleDeleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleAssignCategory = useCallback((filePath: string, categoryId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        const files = c.files.includes(filePath)
          ? c.files.filter(f => f !== filePath)
          : [...c.files, filePath];
        return { ...c, files };
      }
      return c;
    }));
  }, []);

  const handleUpdateMetadata = useCallback((href: string, meta: BookMetadata) => {
    setFileMetadata(prev => {
      // Only update if metadata is different or missing
      if (prev[href]?.coverUrl === meta.coverUrl && prev[href]?.title === meta.title) return prev;
      return { ...prev, [href]: meta };
    });
  }, []);

  const handleNavigateUp = useCallback(() => {
    const parts = webdav.currentPath.replace(/\/$/, '').split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
    webdav.listFiles(parentPath);
  }, [webdav]);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={setView}
        connected={webdav.connected}
        onDisconnect={webdav.disconnect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        categories={categories}
        files={webdav.files}
      />

      <main className="flex-1 overflow-hidden">
        {!webdav.connected && view !== 'setup' ? (
          <ConnectForm
            onConnect={handleConnect}
            loading={webdav.loading}
            error={webdav.error}
            onSetup={() => setView('setup')}
          />
        ) : view === 'library' && webdav.connected ? (
          <Library
            files={webdav.files}
            loading={webdav.loading}
            error={webdav.error}
            currentPath={webdav.currentPath}
            viewMode={viewMode}
            searchQuery={searchQuery}
            fileFilter={fileFilter}
            categories={categories}
            uploading={webdav.uploading}
            uploadProgress={webdav.uploadProgress}
            onViewModeChange={setViewMode}
            onSearchChange={setSearchQuery}
            onFilterChange={setFileFilter}
            onFileSelect={handleFileSelect}
            onUpload={(file) => webdav.uploadFile(file, webdav.currentPath)}
            onDelete={webdav.deleteFile}
            onDeleteMultiple={webdav.deleteMultipleFiles}
            onNavigateUp={handleNavigateUp}
            onCreateDirectory={(name) => webdav.createDirectory(webdav.currentPath, name)}
            onAssignCategory={handleAssignCategory}
            onRefresh={() => webdav.listFiles(webdav.currentPath)}
            getFileBlob={webdav.getFileBlob}
            fileMetadata={fileMetadata}
            onUpdateMetadata={handleUpdateMetadata}
          />
        ) : view === 'categories' && webdav.connected ? (
          <CategoryView
            categories={categories}
            files={webdav.files}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAssignCategory={handleAssignCategory}
            onFileSelect={handleFileSelect}
          />
        ) : (
          <SetupGuide onBack={() => setView('library')} />
        )}
      </main>

      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={handleCloseViewer}
          getFileBlob={webdav.getFileBlob}
          categories={categories}
          onAssignCategory={handleAssignCategory}
          storedMetadata={fileMetadata[selectedFile.href]}
        />
      )}
    </div>
  );
}
