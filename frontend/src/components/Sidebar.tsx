import {
  BookOpen, Library, Tag, HelpCircle, LogOut, Wifi, WifiOff,
  Menu, X, BookMarked, ImageIcon, FileText, Archive
} from 'lucide-react';
import { AppView, Category, WebDAVFile, getFileCategory } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  connected: boolean;
  onDisconnect: () => void;
  isOpen: boolean;
  onToggle: () => void;
  categories: Category[];
  files: WebDAVFile[];
}

export function Sidebar({
  currentView, onViewChange, connected, onDisconnect,
  isOpen, onToggle, categories, files,
}: SidebarProps) {
  const nonDirFiles = files.filter(f => !f.isDirectory);
  const bookCount = nonDirFiles.filter(f => getFileCategory(f.name) === 'books').length;
  const comicCount = nonDirFiles.filter(f => getFileCategory(f.name) === 'comics').length;
  const imageCount = nonDirFiles.filter(f => getFileCategory(f.name) === 'images').length;
  const docCount = nonDirFiles.filter(f => getFileCategory(f.name) === 'documents').length;
  const archiveCount = nonDirFiles.filter(f => getFileCategory(f.name) === 'archives').length;

  const navItems = [
    { id: 'library' as AppView, icon: Library, label: 'Library', badge: nonDirFiles.length > 0 ? nonDirFiles.length.toString() : undefined },
    { id: 'categories' as AppView, icon: Tag, label: 'Categories', badge: categories.length.toString() },
    { id: 'setup' as AppView, icon: HelpCircle, label: 'Setup Guide' },
  ];

  const formatStats = [
    { icon: BookMarked, label: 'Books', count: bookCount, color: 'text-purple-400' },
    { icon: BookOpen, label: 'Comics', count: comicCount, color: 'text-pink-400' },
    { icon: ImageIcon, label: 'Images', count: imageCount, color: 'text-emerald-400' },
    { icon: FileText, label: 'Docs', count: docCount, color: 'text-blue-400' },
    { icon: Archive, label: 'Archives', count: archiveCount, color: 'text-yellow-400' },
  ].filter(s => s.count > 0);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:text-white transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-40 h-full flex flex-col
          w-[260px] bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <BookOpen size={20} className="text-white" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Booko-DAV</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Book Cloud</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <Icon size={17} className={isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Format stats */}
          {formatStats.length > 0 && (
            <>
              <div className="pt-4">
                <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Collection</p>
              </div>
              {formatStats.map(stat => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500"
                  >
                    <Icon size={14} className={stat.color} />
                    <span className="flex-1 text-left text-xs">{stat.label}</span>
                    <span className="text-[10px] text-slate-600 font-mono">{stat.count}</span>
                  </div>
                );
              })}
            </>
          )}

          {/* Category shortcuts */}
          {categories.length > 0 && (
            <>
              <div className="pt-4">
                <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Categories</p>
              </div>
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onViewChange('categories');
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-left truncate text-xs">{cat.name}</span>
                  <span className="text-[10px] text-slate-600">{cat.files.length}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Connection Status */}
        <div className="p-3 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-2 py-2">
            {connected ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-slate-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-300 truncate">
                {connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            {connected && (
              <button
                onClick={onDisconnect}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Disconnect"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
