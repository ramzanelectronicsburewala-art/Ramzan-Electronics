import React, { useState, useRef } from 'react';
import { X, Sparkles, UploadCloud, Type, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storyService } from '../../services/storyService';
import { Story } from '../../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newStory: Story) => void;
}

const GRADIENTS = [
  'from-pink-600 via-rose-600 to-indigo-900',
  'from-amber-600 via-rose-600 to-purple-800',
  'from-cyan-600 via-blue-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-indigo-950',
  'from-purple-600 via-fuchsia-600 to-amber-700',
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
      setMode('image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'image' && !mediaUrl) return;

    setSubmitting(true);
    try {
      const created = await storyService.createStory({
        authorId: userProfile.userId,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        authorAvatar: userProfile.avatarUrl,
        mediaUrl: mode === 'image' ? mediaUrl : undefined,
        text: text.trim(),
        backgroundGradient: gradient,
      });

      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Add to 24h Story
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Your story disappears after 24 hours. Followers can reply directly to your DMs.
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-4">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'text' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Card</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'image' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo Story</span>
          </button>
        </div>

        {/* Live Story Preview Canvas */}
        <div
          className={`w-full h-72 rounded-2xl overflow-hidden relative flex items-center justify-center p-6 mb-4 shadow-inner ${
            mode === 'image' && mediaUrl ? 'bg-black' : `bg-gradient-to-br ${gradient}`
          }`}
        >
          {mode === 'image' && mediaUrl ? (
            <img src={mediaUrl} alt="Story preview" className="w-full h-full object-cover" />
          ) : (
            <p className="text-xl font-black text-white text-center drop-shadow-md max-w-xs break-words">
              {text || 'Type your message below...'}
            </p>
          )}

          {mode === 'image' && text && (
            <div className="absolute bottom-4 left-4 right-4 p-2 rounded-xl bg-black/60 text-white text-center text-xs font-medium">
              {text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'image' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 hover:border-pink-500"
              >
                <UploadCloud className="w-4 h-4 text-pink-500" />
                <span>{mediaUrl ? 'Change Photo' : 'Select Photo from Device'}</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Story Text / Thoughts
            </label>
            <input
              type="text"
              maxLength={140}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening right now? ✨"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {mode === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Background Theme
              </label>
              <div className="flex gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradient(g)}
                    aria-label="Select gradient color"
                    className={`flex-1 h-8 rounded-xl bg-gradient-to-br ${g} ring-2 transition-all ${
                      gradient === g ? 'ring-pink-500 scale-105' : 'ring-transparent opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (mode === 'text' && !text.trim()) || (mode === 'image' && !mediaUrl)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sharing...' : 'Share to Story'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
