import { useState } from 'react';
import {
  Tag, Plus, Trash2, X, BookOpen, FileText, Image, File,
  ChevronRight, Folder, BookMarked, Archive
} from 'lucide-react';
import {
  Category, WebDAVFile, CATEGORY_COLORS, getFileCategory,
  formatFileSize, getFormatInfo, FileFilter,
} from '../types';

interface CategoryViewProps {
  categories: Category[];
  files: WebDAVFile[];
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onAssignCategory: (filePath: string, categoryId: string) => void;
  onFileSelect: (file: WebDAVFile) => void;
}

function getCatIcon(cat: FileFilter) {
  switch (cat) {
    case 'books': return BookMarked;
    case 'comics': return BookOpen;
    case 'images': return Image;
    case 'documents': return FileText;
    case 'archives': return Archive;
    default: return File;
  }
}

export function CategoryView({
  categories, files, onAddCategory, onDeleteCategory,
  onAssignCategory, onFileSelect,
}: CategoryViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  const handleAdd = () => {
    if (newName.trim()) {
      onAddCategory(newName.trim(), newColor);
      setNewName('');
      setNewColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
      setShowAddForm(false);
    }
  };

  const nonDirFiles = files.filter(f => !f.isDirectory);

  const getCategoryFiles = (cat: Category): WebDAVFile[] => {
    return nonDirFiles.filter(f => cat.files.includes(f.href));
  };

  const getUnassignedFiles = (): WebDAVFile[] => {
    const allAssigned = new Set(categories.flatMap(c => c.files));
    return nonDirFiles.filter(f => !allAssigned.has(f.href));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Tag size={20} className="text-amber-400" />
              Categories
            </h1>
            <p className="text-xs text-slate-400 mt-1">Organize your files into collections</p>
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 transition-all">
            <Plus size={14} /> New Category
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mb-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-slide-up">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 mb-1 ml-1 uppercase tracking-wider font-semibold">Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                  placeholder="e.g., Science Fiction"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  autoFocus />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 ml-1 uppercase tracking-wider font-semibold">Color</label>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/80 border border-slate-700/50">
                  {CATEGORY_COLORS.slice(0, 10).map(color => (
                    <button key={color} onClick={() => setNewColor(color)}
                      className={`w-5 h-5 rounded-md transition-all ${newColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-400 transition-all">Create</button>
              <button onClick={() => setShowAddForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* Category cards */}
        <div className="space-y-3">
          {categories.map((cat, i) => {
            const catFiles = getCategoryFiles(cat);
            const isExpanded = expandedCategory === cat.id;
            const isAssigning = showAssignModal === cat.id;

            return (
              <div key={cat.id} className="rounded-2xl border border-slate-800/50 bg-slate-800/20 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}>
                {/* Header */}
                <div className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-slate-800/30 transition-all"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '18' }}>
                    <Tag size={16} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-white">{cat.name}</h3>
                    <p className="text-[10px] text-slate-500">{catFiles.length} file{catFiles.length !== 1 ? 's' : ''}</p>
                  </div>

                  {catFiles.length > 0 && (
                    <div className="hidden sm:flex -space-x-1">
                      {catFiles.slice(0, 4).map((f, j) => {
                        const fmtInfo = getFormatInfo(f.name);
                        return (
                          <div key={j} className="w-5 h-5 rounded-md flex items-center justify-center border-2 border-slate-900"
                            style={{ backgroundColor: fmtInfo.bgColor }}>
                            <span className="text-[7px] font-bold" style={{ color: fmtInfo.color }}>{fmtInfo.label.slice(0, 2)}</span>
                          </div>
                        );
                      })}
                      {catFiles.length > 4 && (
                        <div className="w-5 h-5 rounded-md bg-slate-700/50 flex items-center justify-center border-2 border-slate-900">
                          <span className="text-[7px] text-slate-400">+{catFiles.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={(e) => { e.stopPropagation(); setShowAssignModal(isAssigning ? null : cat.id); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Add files">
                    <Plus size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${cat.name}"?`)) onDeleteCategory(cat.id); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                    <Trash2 size={12} />
                  </button>
                  <ChevronRight size={14} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Assign files */}
                {isAssigning && (
                  <div className="px-3.5 pb-3.5 animate-slide-up">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/30">
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Click to assign/unassign</p>
                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                        {nonDirFiles.length === 0 ? (
                          <p className="text-[10px] text-slate-500 py-2">No files available</p>
                        ) : (
                          nonDirFiles.map(file => {
                            const isAssigned = cat.files.includes(file.href);
                            const fmtInfo = getFormatInfo(file.name);
                            return (
                              <button key={file.href} onClick={() => onAssignCategory(file.href, cat.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                                  isAssigned ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-slate-800/50'
                                }`}>
                                <span className="format-badge" style={{ backgroundColor: fmtInfo.bgColor, color: fmtInfo.color }}>{fmtInfo.label}</span>
                                <span className="flex-1 text-[10px] text-slate-300 truncate">{file.name}</span>
                                <span className="text-[9px] text-slate-500">{formatFileSize(file.size)}</span>
                                {isAssigned && <span className="text-[10px] text-emerald-400">✓</span>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* File list */}
                {isExpanded && catFiles.length > 0 && (
                  <div className="px-3.5 pb-3.5 space-y-0.5 animate-slide-up">
                    {catFiles.map(file => {
                      const fmtInfo = getFormatInfo(file.name);
                      const Icon = getCatIcon(getFileCategory(file.name));
                      return (
                        <div key={file.href}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition-all group"
                          onClick={() => onFileSelect(file)}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: fmtInfo.bgColor }}>
                            <Icon size={13} style={{ color: fmtInfo.color }} />
                          </div>
                          <span className="flex-1 text-xs text-slate-300 truncate group-hover:text-white transition-colors">{file.name}</span>
                          <span className="format-badge" style={{ backgroundColor: fmtInfo.bgColor, color: fmtInfo.color }}>{fmtInfo.label}</span>
                          <span className="text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                          <button onClick={(e) => { e.stopPropagation(); onAssignCategory(file.href, cat.id); }}
                            className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" title="Remove">
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && catFiles.length === 0 && (
                  <div className="px-3.5 pb-3.5">
                    <div className="p-5 rounded-xl bg-slate-900/30 text-center">
                      <p className="text-xs text-slate-500">No files in this category</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">Right-click files in the library to categorize</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {(() => {
            const unassigned = getUnassignedFiles();
            if (unassigned.length === 0) return null;
            return (
              <div className="rounded-2xl border border-slate-800/30 bg-slate-800/10 overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-700/20 flex items-center justify-center">
                    <Folder size={16} className="text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-slate-400">Uncategorized</h3>
                    <p className="text-[10px] text-slate-600">{unassigned.length} file{unassigned.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/30 flex items-center justify-center mb-5 animate-float">
              <Tag size={28} className="text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">No categories yet</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-xs">Create categories to organize your books and files</p>
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold">
              <Plus size={14} /> Create Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
