import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { Post, Story } from '../../types';
import { postService } from '../../services/postService';
import { storyService, getViewedStoryIds } from '../../services/storyService';
import { userService } from '../../services/userService';
import { formatRelativeTime, formatCompactNumber } from '../../utils/textUtils';
import { useAuth } from '../../context/AuthContext';
import { CommentsDrawer } from '../comments/CommentsDrawer';
import { ShareModal } from '../common/ShareModal';
import { ReportModal } from '../moderation/ReportModal';

interface FeedViewProps {
  onOpenStory: (stories: Story[], index: number) => void;
  onOpenCreateStory: () => void;
  onOpenCreatePost: () => void;
  onSelectUser: (userId: string) => void;
  onFilterTag: (tag: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onOpenStory,
  onOpenCreateStory,
  onOpenCreatePost,
  onSelectUser,
  onFilterTag,
}) => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; details: string } | null>(null);

  // Double tap heart animation tracker
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null);

  // Mute state for inline feed videos
  const [isMuted, setIsMuted] = useState(true);

  // Followed creators cache
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    const [fetchedPosts, fetchedStories] = await Promise.all([
      postService.getFeedPosts(),
      storyService.getStories(),
    ]);
    setPosts(fetchedPosts);
    setStories(fetchedStories);
    setLoading(false);
  };

  const handleToggleLike = async (post: Post) => {
    if (!userProfile) return;

    // Trigger visual heart burst animation
    setHeartBurstPostId(post.id);
    setTimeout(() => setHeartBurstPostId(null), 800);

    const isCurrentlyLiked = post.isLiked;
    // Optimistic UI
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            isLiked: !isCurrentlyLiked,
            likesCount: !isCurrentlyLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    await postService.toggleLike(post.id, userProfile.userId);
  };

  const handleToggleSave = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, isSaved: !p.isSaved };
        }
        return p;
      })
    );
    await postService.toggleSave(postId);
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!userProfile) return;
    const nextState = !followingMap[targetUserId];
    setFollowingMap((prev) => ({ ...prev, [targetUserId]: nextState }));
    await userService.toggleFollow(userProfile.userId, targetUserId);
  };

  const viewedStoryIds = getViewedStoryIds();

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-4 space-y-6">
      {/* 24h Stories Tray */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 sm:p-4 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-3 sm:gap-4 min-w-max">
          {/* Add Story Button */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={onOpenCreateStory}>
            <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-0.5">
                <img
                  src={
                    userProfile?.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
                  }
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 border-2 border-white dark:border-zinc-900 text-white flex items-center justify-center shadow-md">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Your Story
            </span>
          </div>

          {/* Stories from creators */}
          {stories.map((story, index) => {
            const isViewed = viewedStoryIds.includes(story.id);
            return (
              <div
                key={story.id}
                onClick={() => onOpenStory(stories, index)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
                role="button"
                aria-label={`View story by ${story.authorDisplayName}`}
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                    isViewed
                      ? 'ring-1 ring-zinc-300 dark:ring-zinc-700'
                      : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-0.5">
                    <img
                      src={story.authorAvatar}
                      alt={story.authorUsername}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[64px] truncate text-center">
                  {story.authorUsername}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-96 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Your Feed is Ready</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 mb-4">
            Be the first to share an inspiring photo or reel with the community!
          </p>
          <button
            onClick={onOpenCreatePost}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-pink-500/20"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isFollowing = followingMap[post.authorId];
            const isAuthor = userProfile?.userId === post.authorId;

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between">
                  <div
                    onClick={() => onSelectUser(post.authorId)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img
                      src={post.authorAvatar}
                      alt={post.authorUsername}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline">
                          {post.authorUsername}
                        </span>
                        {post.authorVerified && (
                          <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      {post.location && (
                        <p className="text-[10px] text-zinc-400">{post.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isAuthor && (
                      <button
                        onClick={() => handleToggleFollow(post.authorId)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          isFollowing
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            : 'bg-pink-500 text-white hover:bg-pink-600'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setReportTarget({
                          id: post.id,
                          details: `Report Post: "${post.caption.slice(0, 50)}..." by @${post.authorUsername}`,
                        })
                      }
                      aria-label="Post options"
                      className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Media Container with Double Tap to Like */}
                <div
                  className="relative bg-black flex items-center justify-center select-none overflow-hidden max-h-[580px]"
                  onDoubleClick={() => handleToggleLike(post)}
                >
                  {post.type === 'video' ? (
                    <video
                      src={post.mediaUrl}
                      loop
                      autoPlay
                      muted={isMuted}
                      playsInline
                      className="w-full max-h-[580px] object-cover"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      className="w-full max-h-[580px] object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Double tap heart burst overlay */}
                  {heartBurstPostId === post.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-bounce" />
                    </div>
                  )}

                  {/* Video Mute Toggle */}
                  {post.type === 'video' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Action Bar */}
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleLike(post)}
                        aria-label={post.isLiked ? 'Unlike' : 'Like'}
                        className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200 hover:text-rose-500 transition-colors"
                      >
                        <Heart
                          className={`w-6 h-6 transition-transform active:scale-125 ${
                            post.isLiked ? 'text-rose-500 fill-rose-500' : ''
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => setActiveCommentsPostId(post.id)}
                        aria-label="Comments"
                        className="p-1 text-zinc-800 dark:text-zinc-200 hover:text-pink-500 transition-colors"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </button>

                      <button
                        onClick={() => setSharePost(post)}
                        aria-label="Share"
                        className="p-1 text-zinc-800 dark:text-zinc-200 hover:text-indigo-500 transition-colors"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleSave(post.id)}
                      aria-label={post.isSaved ? 'Remove Bookmark' : 'Bookmark'}
                      className="p-1 text-zinc-800 dark:text-zinc-200 hover:text-amber-500 transition-colors"
                    >
                      <Bookmark
                        className={`w-6 h-6 ${
                          post.isSaved ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Likes count */}
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                    {formatCompactNumber(post.likesCount)} likes
                  </p>

                  {/* Caption & Hashtags */}
                  <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mb-2">
                    <span
                      onClick={() => onSelectUser(post.authorId)}
                      className="font-bold mr-1.5 cursor-pointer hover:underline"
                    >
                      {post.authorUsername}
                    </span>
                    <span>{post.caption}</span>
                  </div>

                  {/* Hashtag pills */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {post.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => onFilterTag(tag)}
                          className="text-[11px] text-pink-600 dark:text-pink-400 font-medium hover:underline"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Comments count trigger */}
                  {post.commentsCount > 0 && (
                    <button
                      onClick={() => setActiveCommentsPostId(post.id)}
                      className="text-xs text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-300 block mb-1"
                    >
                      View all {post.commentsCount} comments
                    </button>
                  )}

                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    {formatRelativeTime(post.createdAt)} ago
                  </span>
                </div>
              </article>
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
            setPosts((prev) =>
              prev.map((p) =>
                p.id === activeCommentsPostId ? { ...p, commentsCount: newCount } : p
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
          title={`Post by @${sharePost.authorUsername} on Pulse`}
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
