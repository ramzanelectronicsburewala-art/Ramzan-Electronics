import React, { useState } from 'react';
import { X, Terminal, Globe, Shield, Database, Check, Copy, ExternalLink, Flame } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Install Firebase CLI globally',
      command: 'npm install -g firebase-tools',
      desc: 'Ensures the official Firebase command-line tools are available on your system.',
    },
    {
      title: '2. Authenticate with your Firebase account',
      command: 'firebase login',
      desc: 'Opens a browser window to grant project access to the CLI.',
    },
    {
      title: '3. Build the production React app',
      command: 'npm run build',
      desc: 'Bundles optimized client assets into the "dist" directory using Vite & Tailwind.',
    },
    {
      title: '4. Initialize Firebase Hosting (first time only)',
      command: 'firebase init hosting',
      desc: 'Select your existing project "gen-lang-client-0460521731", set public directory to "dist", and configure as a single-page app (SPA = Yes).',
    },
    {
      title: '5. Deploy Hosting & Firestore Security Rules',
      command: 'firebase deploy --only hosting,firestore:rules',
      desc: 'Deploys your bundled production web app and hardened Firestore security rules in one command.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Firebase Hosting & Deployment Guide
            </h2>
            <p className="text-xs text-zinc-500">
              Step-by-step instructions to test locally and deploy to Google Firebase Hosting
            </p>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-pink-500 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs font-bold">Cloud Firestore</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Database provisioned & secured via ABAC rules in <code className="text-pink-500">firestore.rules</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-indigo-500 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold">Authentication</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Google Auth popup & Email/Password with client profile synchronization.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold">Global CDN</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Ultra-fast static hosting on Google's edge infrastructure with custom domain SSL.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Deployment Commands
          </h3>

          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{step.title}</span>
                <span className="text-[10px] text-zinc-400">Terminal</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{step.desc}</p>
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-emerald-400 select-all">{step.command}</span>
                </div>
                <button
                  onClick={() => copyCode(step.command, idx)}
                  className="p-1 rounded text-zinc-400 hover:text-white shrink-0 ml-2"
                  title="Copy command"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Local dev notice */}
        <div className="mt-6 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs text-zinc-700 dark:text-zinc-300">
          <p className="font-semibold text-pink-500 mb-1">Local Development Server:</p>
          <p>
            Run <code className="font-mono bg-pink-500/20 px-1 py-0.5 rounded text-pink-500">npm run dev</code> to start the local Vite server at <code className="font-mono">http://localhost:3000</code>.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs hover:opacity-90"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
