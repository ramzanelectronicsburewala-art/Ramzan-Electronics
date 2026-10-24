import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Film,
  Image as ImageIcon,
  Music,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { extractHashtags } from '../../utils/textUtils';
import { validateUploadFile, formatFileSize } from '../../utils/mediaUtils';
import { Post } from '../../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newPost: Post) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<'image' | 'video'>('video');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '4:5'>('9:16');
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [audioTrack, setAudioTrack] = useState('');
  const [location, setLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setPostType(validation.type || 'image');
    if (validation.type === 'video') {
      setAspectRatio('9:16');
    }

    // Generate local preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadPresetMedia = (type: 'reel' | 'photo') => {
    setError(null);
    if (type === 'reel') {
      setPostType('video');
      setAspectRatio('9:16');
      setMediaPreview('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4');
      setCaption('Sunset drone glide over the hills 🌄 What a vibe! #travel #nature #reels #sunset');
      setAudioTrack('Original Audio • Chillout Mountain Breeze');
      setLocation('Malibu Coast, CA');
    } else {
      setPostType('image');
      setAspectRatio('4:5');
      setMediaPreview('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80');
      setCaption('Neon nights and midnight conversations. Where are you dreaming of traveling next? ✈️ #cityvibes #neon #nightlife');
      setAudioTrack('Synthwave Collective • Neon Rain');
      setLocation('Tokyo, Japan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaPreview) {
      setError('Please upload a video or photo to post.');
      return;
    }
    if (!userProfile) {
      setError('Please sign in or select a demo user to publish.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate upload progress
    setUploadProgress(20);
    const timer1 = setTimeout(() => setUploadProgress(65), 300);
    const timer2 = setTimeout(() => setUploadProgress(100), 700);

    try {
      const tags = extractHashtags(caption);
      const newPost = await postService.createPost({
        authorId: userProfile.userId,
        authorUsername: userProfile.username,
        authorDisplayName: userProfile.displayName,
        authorAvatar: userProfile.avatarUrl,
        authorVerified: userProfile.isVerified,
        type: postType,
        mediaUrl: mediaPreview,
        thumbnailUrl: mediaPreview,
        aspectRatio,
        caption,
        tags,
        location,
        audioTrack: audioTrack || (postType === 'video' ? `Original Audio - ${userProfile.username}` : undefined),
      });

      if (onCreated) {
        onCreated(newPost);
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create New Post / Reel</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Share short-form video reels or high-res photography with your followers
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Format selection */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <button
              type="button"
              onClick={() => {
                setPostType('video');
                setAspectRatio('9:16');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                postType === 'video'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Short Reel (9:16)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPostType('image');
                setAspectRatio('4:5');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                postType === 'image'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Feed Photo (4:5 / 1:1)</span>
            </button>
          </div>

          {/* Media Upload Area / Preview */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />

            {!mediaPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-pink-500 dark:hover:border-pink-500 rounded-2xl p-8 text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/30 transition-colors group"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  MP4, WEBM, MOV (up to 50MB) or JPG, PNG, WEBP (up to 10MB)
                </p>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-xs">
                  <span className="text-zinc-500">Or test with creator presets:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadPresetMedia('reel');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-500 font-semibold hover:bg-pink-500/20"
                  >
                    Preset Reel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadPresetMedia('photo');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-semibold hover:bg-indigo-500/20"
                  >
                    Preset Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black max-h-80 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                {postType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    autoPlay
                    loop
                    muted
                    className="max-h-80 w-auto object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Upload Preview"
                    className="max-h-80 w-auto object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setMediaPreview('')}
                  aria-label="Remove media"
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Caption & Hashtags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Caption & Hashtags
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... Use #hashtags to be discovered in Explore!"
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
              <span>{caption.length} / 2200 characters</span>
              <div className="flex gap-1.5">
                {['#reels', '#aesthetic', '#trending', '#travel', '#music'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                    className="hover:text-pink-500"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio and Location Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Audio / Sound Track
              </label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={audioTrack}
                  onChange={(e) => setAudioTrack(e.target.value)}
                  placeholder="e.g. Synthwave Beats (Original)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tokyo, Japan"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Publishing to Firestore & Media pipeline...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mediaPreview}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Sharing...' : 'Share to Pulse'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
