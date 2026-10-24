import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Plus,
  Bookmark,
  MoreVertical,
  Check,
  Disc3,
} from 'lucide-react';
import { Post } from '../../types';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { formatCompactNumber } from '../../utils/textUtils';
import { useAuth } from '../../context/AuthContext';
import { CommentsDrawer } from '../comments/CommentsDrawer';
import { ShareModal } from '../common/ShareModal';
import { ReportModal } from '../moderation/ReportModal';

interface ReelsViewProps {
  onSelectUser: (userId: string) => void;
  onFilterTag: (tag: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ onSelectUser, onFilterTag }) => {
  const { userProfile } = useAuth();
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Global sound state across reels
  const [isMuted, setIsMuted] = useState(true);

  // Video playback states
  const [playingIndex, setPlayingIndex] = useState<number>(0);
  const [isPausedManually, setIsPausedManually] = useState<boolean>(false);

  // Active modals
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; details: string } | null>(null);

  // Double tap heart burst
  const [burstReelId, setBurstReelId] = useState<string | null>(null);

  // Follow states
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setLoading(true);
    const fetched = await postService.getReels();
    setReels(fetched);
    setLoading(false);
  };

  // Setup IntersectionObserver for auto-play on scroll
  useEffect(() => {
    if (reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          const video = videoRefs.current[index];

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setPlayingIndex(index);
            setIsPausedManually(false);
            if (video) {
              video.play().catch(() => {});
              postService.incrementViews(reels[index].id);
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.6],
      }
    );

    const items = containerRef.current?.querySelectorAll('.reel-slide');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [reels]);

  const handleTogglePlayPause = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPausedManually(false);
    } else {
      video.pause();
      setIsPausedManually(true);
    }
  };

  const handleToggleLike = async (reel: Post) => {
    if (!userProfile) return;

    setBurstReelId(reel.id);
    setTimeout(() => setBurstReelId(null), 800);

    const isCurrentlyLiked = reel.isLiked;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? {
              ...r,
              isLiked: !isCurrentlyLiked,
              likesCount: !isCurrentlyLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
            }
          : r
      )
    );

    await postService.toggleLike(reel.id, userProfile.userId);
  };

  const handleToggleFollow = async (authorId: string) => {
    if (!userProfile) return;
    const nextState = !followingMap[authorId];
    setFollowingMap((prev) => ({ ...prev, [authorId]: nextState }));
    await userService.toggleFollow(userProfile.userId, authorId);
  };

  const handleToggleSave = async (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, isSaved: !r.isSaved } : r))
    );
    await postService.toggleSave(reelId);
  };

  return (
    <div className="w-full flex items-center justify-center py-2 sm:py-4 select-none">
      {loading ? (
        <div className="w-full max-w-[420px] h-[85vh] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center">
          <p className="text-zinc-500 text-sm">Loading trending reels...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="w-full max-w-[420px] h-[70vh] rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center p-8">
          <Disc3 className="w-12 h-12 text-pink-500 mb-3 animate-spin" />
          <p className="font-bold text-zinc-100">No reels found</p>
          <p className="text-xs text-zinc-400 mt-1">Upload the first vertical reel video!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full max-w-[420px] h-[88vh] max-h-[860px] overflow-y-scroll snap-y snap-mandatory rounded-3xl shadow-2xl relative border border-zinc-200 dark:border-zinc-800 bg-black scrollbar-none"
        >
          {reels.map((reel, index) => {
            const isPlaying = playingIndex === index && !isPausedManually;
            const isFollowing = followingMap[reel.authorId];
            const isAuthor = userProfile?.userId === reel.authorId;

            return (
              <div
                key={reel.id}
                data-index={index}
                className="reel-slide w-full h-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
                onDoubleClick={() => handleToggleLike(reel)}
                onClick={() => handleTogglePlayPause(index)}
              >
                {/* Background Video */}
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={reel.mediaUrl}
                  loop
                  playsInline
                  muted={isMuted}
                  poster={reel.thumbnailUrl}
                  className="w-full h-full object-cover"
                />

                {/* Double Tap Heart Burst Animation */}
                {burstReelId === reel.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Heart className="w-28 h-28 text-rose-500 fill-rose-500 animate-ping duration-300" />
                  </div>
                )}

                {/* Paused Indicator Overlay */}
                {isPausedManually && playingIndex === index && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 z-20">
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center">
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Global Sound Button (Top Right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Right Action Bar Column */}
                <div
                  className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Creator Avatar with Follow Badge */}
                  <div className="relative mb-2">
                    <img
                      src={reel.authorAvatar}
                      alt={reel.authorUsername}
                      onClick={() => onSelectUser(reel.authorId)}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500 cursor-pointer hover:scale-105 transition-transform"
                    />
                    {!isAuthor && !isFollowing && (
                      <button
                        onClick={() => handleToggleFollow(reel.authorId)}
                        aria-label="Follow creator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center shadow"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    )}
                  </div>

                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleToggleLike(reel)}
                      aria-label="Like reel"
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-rose-500 active:scale-125 transition-all"
                    >
                      <Heart
                        className={`w-7 h-7 ${
                          reel.isLiked ? 'text-rose-500 fill-rose-500' : ''
                        }`}
                      />
                    </button>
                    <span className="text-[11px] font-bold text-white drop-shadow mt-1">
                      {formatCompactNumber(reel.likesCount)}
                    </span>
                  </div>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setActiveCommentsPostId(reel.id)}
                      aria-label="Comments"
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-pink-400 transition-colors"
                    >
                      <MessageCircle className="w-7 h-7" />
                    </button>
                    <span className="text-[11px] font-bold text-white drop-shadow mt-1">
                      {formatCompactNumber(reel.commentsCount)}
                    </span>
                  </div>

                  {/* Bookmark / Save */}
                  <button
                    onClick={() => handleToggleSave(reel.id)}
                    aria-label="Save reel"
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-amber-400 transition-colors"
                  >
                    <Bookmark
                      className={`w-6 h-6 ${
                        reel.isSaved ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Share Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setSharePost(reel)}
                      aria-label="Share reel"
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-indigo-400 transition-colors"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                    <span className="text-[11px] font-bold text-white drop-shadow mt-1">
                      {formatCompactNumber(reel.sharesCount)}
                    </span>
                  </div>

                  {/* Report option */}
                  <button
                    onClick={() =>
                      setReportTarget({
                        id: reel.id,
                        details: `Reel by @${reel.authorUsername}: "${reel.caption.slice(0, 40)}"`,
                      })
                    }
                    aria-label="Report reel"
                    className="p-2 text-white/70 hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Spinning Audio Disc */}
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 ring-2 ring-zinc-700 flex items-center justify-center ${
                      isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                    }`}
                  >
                    <Disc3 className="w-5 h-5 text-pink-400" />
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div
                  className="absolute bottom-4 left-4 right-16 z-20 text-white drop-shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    onClick={() => onSelectUser(reel.authorId)}
                    className="flex items-center gap-1.5 cursor-pointer mb-2 w-max"
                  >
                    <span className="font-bold text-sm hover:underline">
                      @{reel.authorUsername}
                    </span>
                    {reel.authorVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/95 line-clamp-2 leading-relaxed mb-2.5">
                    {reel.caption}
                  </p>

                  {/* Tags */}
                  {reel.tags && reel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {reel.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => onFilterTag(tag)}
                          className="text-[10px] bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-white/90 hover:bg-black/60"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Music audio marquee */}
                  <div className="flex items-center gap-2 text-xs text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full w-max max-w-full">
                    <Music className="w-3 h-3 text-pink-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      {reel.audioTrack || `Original Sound - @${reel.authorUsername}`}
                    </span>
                  </div>
                </div>

                {/* Video Scrubber bar on the bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
                  <div
                    className="h-full bg-pink-500 transition-all duration-100"
                    style={{
                      width: isPlaying ? '100%' : '0%',
                      transition: isPlaying ? 'width 15s linear' : 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comments Drawer */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          isOpen={!!activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
          onCommentCountChange={(newCount) => {
            setReels((prev) =>
              prev.map((r) =>
                r.id === activeCommentsPostId ? { ...r, commentsCount: newCount } : r
              )
            );
          }}
        />
      )}

      {/* Share Modal */}
      {sharePost && (
        <ShareModal
          isOpen={!!sharePost}
          onClose={() => setSharePost(null)}
          title={`Short Reel by @${sharePost.authorUsername} on Pulse`}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType="post"
          targetId={reportTarget.id}
          targetDetails={reportTarget.details}
        />
      )}
    </div>
  );
};
