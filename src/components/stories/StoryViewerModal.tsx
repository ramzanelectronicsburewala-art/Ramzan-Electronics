import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Eye, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Story } from '../../types';
import { formatRelativeTime } from '../../utils/textUtils';
import { storyService } from '../../services/storyService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const { userProfile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  const currentStory = stories[currentIndex];

  // Mark as viewed
  useEffect(() => {
    if (currentStory && userProfile) {
      storyService.markAsViewed(currentStory.id, userProfile.userId);
    }
  }, [currentStory, userProfile]);

  // Story progress timer (5 seconds duration)
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;

    const interval = 50; // update every 50ms
    const step = (100 / (5000 / interval));

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex, stories.length, currentStory, onClose]);

  if (!isOpen || !currentStory) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !userProfile) return;

    try {
      const conv = await chatService.getOrCreateConversation(userProfile, {
        userId: currentStory.authorId,
        username: currentStory.authorUsername,
        displayName: currentStory.authorDisplayName,
        avatarUrl: currentStory.authorAvatar,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: '',
      });

      await chatService.sendMessage(
        conv.id,
        userProfile.userId,
        `Replied to your story: "${replyText.trim()}"`
      );

      setReplySent(true);
      setReplyText('');
      setTimeout(() => setReplySent(false), 2500);
    } catch (e) {
      console.warn('Failed to send story reply:', e);
    }
  };

  const isOwnStory = userProfile?.userId === currentStory.authorId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Close Button */}
      <button
        onClick={onClose}
        aria-label="Close story"
        className="absolute top-5 right-5 z-40 p-2.5 rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop Prev/Next Buttons */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        aria-label="Previous story"
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all z-30"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentIndex === stories.length - 1}
        aria-label="Next story"
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all z-30"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Card Container */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[850px] rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Author Header */}
        <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.authorAvatar}
              alt={currentStory.authorUsername}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500"
            />
            <div>
              <p className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>{currentStory.authorDisplayName}</span>
                <span className="text-[10px] text-white/70 font-normal">
                  @{currentStory.authorUsername}
                </span>
              </p>
              <p className="text-[10px] text-white/80">{formatRelativeTime(currentStory.createdAt)} ago</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Resume story' : 'Pause story'}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Story Media / Content Area */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          {currentStory.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                currentStory.backgroundGradient || 'from-indigo-600 via-pink-600 to-amber-700'
              } flex items-center justify-center p-8 text-center`}
            >
              <p className="text-2xl font-black text-white drop-shadow-md max-w-xs leading-snug">
                {currentStory.text}
              </p>
            </div>
          )}

          {/* Text Overlay if story has both media and caption */}
          {currentStory.mediaUrl && currentStory.text && (
            <div className="absolute bottom-20 left-4 right-4 z-20 p-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-center text-sm font-medium">
              {currentStory.text}
            </div>
          )}

          {/* Tap Zones for Mobile Navigation */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
            aria-label="Previous story tap zone"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-2/3 z-10 cursor-pointer"
            aria-label="Next story tap zone"
          />
        </div>

        {/* Bottom Story Action Bar */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {isOwnStory ? (
            <div className="flex items-center justify-between text-white text-xs px-2 py-1">
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="flex items-center gap-1.5 text-white/90 hover:text-white font-semibold"
              >
                <Eye className="w-4 h-4 text-pink-400" />
                <span>{currentStory.viewers?.length || 0} Viewers</span>
              </button>
              <span className="text-[10px] text-white/60">Expires in 24h</span>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${currentStory.authorDisplayName}...`}
                className="flex-1 py-2 px-4 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/70 text-xs focus:outline-none focus:bg-white/30"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                aria-label="Send reply"
                className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-40 hover:bg-pink-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {replySent && (
            <p className="text-[11px] text-emerald-400 font-medium text-center mt-1 animate-pulse">
              Reply sent to direct messages! ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
