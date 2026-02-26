import {
  ArrowLeft, ExternalLink, Cloud, Key, Github, Rocket,
  Shield, BookOpen, CheckCircle, ChevronRight,
  AlertTriangle, Globe
} from 'lucide-react';

interface SetupGuideProps {
  onBack: () => void;
}

export function SetupGuide({ onBack }: SetupGuideProps) {
  const steps = [
    {
      title: 'Set Up Cloudflare Account',
      icon: Cloud,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      content: [
        { type: 'text', value: 'Go to Cloudflare Dashboard and create an account (Google Sign-In available). If you already have an account, log in.' },
        { type: 'link', label: 'Open Cloudflare Dashboard', url: 'https://dash.cloudflare.com' },
        { type: 'text', value: 'In your dashboard sidebar, navigate to R2 Object Storage. Complete the billing details and submit.' },
        { type: 'text', value: 'Under R2 Object Storage, click "+ Create Bucket"' },
        { type: 'highlight', value: 'Name your bucket bookodav (this is case-sensitive!)' },
        { type: 'text', value: 'Keep the default options and create the bucket.' },
      ],
    },
    {
      title: 'Create API Token',
      icon: Key,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      content: [
        { type: 'text', value: 'Go to API Tokens via your profile menu in Cloudflare.' },
        { type: 'link', label: 'API Tokens Page', url: 'https://dash.cloudflare.com/profile/api-tokens' },
        { type: 'text', value: 'Click "Create Token" and select the "Edit Cloudflare Workers" template.' },
        { type: 'text', value: 'Select your account in the dropdown under Account Resources and "All Zones" under Zone Resources.' },
        { type: 'text', value: 'Create the token and save it securely.' },
        { type: 'highlight', value: 'Also save your Account ID from the dashboard URL: https://dash.cloudflare.com/{AccountId}/home' },
      ],
    },
    {
      title: 'Fork the Repository',
      icon: Github,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      content: [
        { type: 'text', value: 'Create or log into your GitHub account.' },
        { type: 'link', label: 'Visit the Booko-DAV Repository', url: 'https://github.com/joshuavrodrigues/bookodav' },
        { type: 'text', value: 'Fork the repository by clicking the "Fork" button.' },
        { type: 'text', value: 'Go to your fork\'s Settings → Secrets and Variables → Actions.' },
        { type: 'text', value: 'Click "New repository secret".' },
        { type: 'highlight', value: 'Add name as CF_API_TOKEN and paste your Cloudflare API token as the secret value.' },
        { type: 'text', value: 'Go to Actions tab and enable workflows.' },
        { type: 'text', value: 'Go to the "Deploy" workflow and click "Run workflow".' },
      ],
    },
    {
      title: 'Configure Access',
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      content: [
        { type: 'text', value: 'In Cloudflare Dashboard, go to Compute → Workers → bookodav-worker.' },
        { type: 'text', value: 'Under Settings → Variables, add two secrets:' },
        { type: 'highlight', value: 'USERNAME — Your chosen username (case-sensitive)' },
        { type: 'highlight', value: 'PASSWORD — Your chosen password (case-sensitive)' },
        { type: 'text', value: 'Make sure to select Type as "SECRET" and click Deploy.' },
        { type: 'text', value: 'Find your access URL at the workers.dev domain.' },
        { type: 'highlight', value: 'Your URL will look like: bookodav-worker.username.workers.dev/dav' },
      ],
    },
    {
      title: 'Connect & Start Using',
      icon: Rocket,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      content: [
        { type: 'text', value: 'You\'re all set! Now you can connect to your Booko-DAV server.' },
        { type: 'text', value: 'Enter your WebDAV URL, username, and password on the connect page.' },
        { type: 'text', value: 'Upload books, documents, and images. View PDFs and images directly in the browser.' },
        { type: 'text', value: 'Organize your files into categories for easy access.' },
        { type: 'highlight', value: 'You can also use any WebDAV client (like KOReader) to sync with your server!' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Library
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BookOpen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Setup Guide</h1>
              <p className="text-sm text-slate-400 mt-1">Get your Booko-DAV server up and running in minutes</p>
            </div>
          </div>

          {/* What is Booko-DAV */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 mt-6">
            <h2 className="text-sm font-semibold text-amber-400 mb-2">What is Booko-DAV?</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Booko-DAV is a play on "books", KOReader, and WebDAV. It's a WebDAV server designed to transfer and store books between your PC, phone, and e-reader (like a jailbroken Kindle). It's self-hostable with 10GB of free storage via Cloudflare R2.
            </p>
          </div>

          {/* Requirements */}
          <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Requirements</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Cloud, label: 'Cloudflare Account' },
                { icon: Github, label: 'GitHub Account' },
                { icon: Globe, label: 'PC or Mobile' },
                { icon: Shield, label: 'Credit Card' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
                  <Icon size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/30 via-slate-700/30 to-transparent" />

          <div className="space-y-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative pl-16 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  {/* Step number */}
                  <div className={`absolute left-0 w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center border-2 border-slate-900 z-10`}>
                    <Icon size={20} className={step.color} />
                  </div>

                  {/* Step content */}
                  <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/40 transition-all">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step {i + 1}</span>
                      <ChevronRight size={12} className="text-slate-600" />
                      <h2 className="text-base font-semibold text-white">{step.title}</h2>
                    </div>

                    <div className="space-y-3">
                      {step.content.map((item, j) => {
                        if (item.type === 'text') {
                          return (
                            <p key={j} className="text-sm text-slate-400 leading-relaxed flex items-start gap-2">
                              <CheckCircle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                              {item.value}
                            </p>
                          );
                        }
                        if (item.type === 'highlight') {
                          return (
                            <div key={j} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                              <p className="text-sm text-amber-300 font-medium">{item.value}</p>
                            </div>
                          );
                        }
                        if (item.type === 'link') {
                          return (
                            <a
                              key={j}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-700/40 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-700/50 transition-all"
                            >
                              <ExternalLink size={14} />
                              {item.label}
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-800/20 border border-slate-700/30 text-center">
          <p className="text-sm text-slate-400">
            Need help? Visit the{' '}
            <a
              href="https://bookodav.joshuarodrigues.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              official Booko-DAV website
            </a>
            {' '}for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
