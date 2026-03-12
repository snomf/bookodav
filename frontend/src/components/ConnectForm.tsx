import { useState } from 'react';
import { BookOpen, Globe, User, Lock, ArrowRight, Loader2, AlertCircle, Server, Smartphone, BookMarked } from 'lucide-react';
import { ConnectionConfig } from '../types';

interface ConnectFormProps {
  onConnect: (config: ConnectionConfig) => void;
  loading: boolean;
  error: string | null;
  onSetup: () => void;
}

export function ConnectForm({ onConnect, loading, error, onSetup }: ConnectFormProps) {
  const [url, setUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin + '/dav';
    }
    return '';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !username || !password) return;
    onConnect({ url: url.trim(), username: username.trim(), password });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl shadow-amber-500/25 mb-6 animate-float">
              <BookOpen size={36} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Booko-DAV</span>
            </h1>
            <p className="text-slate-400 text-base">Your personal book cloud, powered by WebDAV</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { icon: Server, label: 'Self-Hosted', desc: 'Your data, your rules' },
              { icon: Smartphone, label: 'Sync Anywhere', desc: 'PC · Phone · E-reader' },
              { icon: BookMarked, label: 'Read In-Browser', desc: 'PDFs, images & more' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center group hover:bg-slate-800/50 hover:border-slate-600/30 transition-all">
                <Icon size={20} className="mx-auto mb-2 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                <p className="text-xs font-semibold text-slate-300">{label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {/* Supported formats */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8">
            {['PDF', 'EPUB', 'MOBI', 'AZW3', 'FB2', 'CBR', 'CBZ', 'DJVU', 'DOC', 'RTF', 'TXT', 'HTML'].map(fmt => (
              <span key={fmt} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-800/50 text-slate-500 border border-slate-700/30">
                {fmt}
              </span>
            ))}
            <span className="text-[9px] text-slate-600">& more</span>
          </div>

          {/* Connect Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm space-y-4">
              <h2 className="text-sm font-semibold text-white">Connect to WebDAV</h2>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">WebDAV URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://bookodav-worker.you.workers.dev/dav"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Username</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Username"
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !url || !username || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Connect</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Don't have a server?{' '}
              <button onClick={onSetup} className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Setup Guide →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
