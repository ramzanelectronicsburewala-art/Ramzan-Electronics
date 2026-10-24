import React, { useState, useEffect } from 'react';
import { Search, Film, Heart, MessageCircle, Sparkles, TrendingUp, User as UserIcon } from 'lucide-react';
import { Post, UserProfile } from '../../types';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { formatCompactNumber } from '../../utils/textUtils';
import { CommentsDrawer } from '../comments/CommentsDrawer';

interface ExploreViewProps {
  initialTag?: string;
  onSelectUser: (userId: string) => void;
  onSelectReel: (reelId: string) => void;
}

const CATEGORIES = [
  'All',
  'Trending',
  'Reels',
  'Cinematography',
  'Cyberpunk',
  'Style',
  'Music',
  'Travel',
  'Surf',
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialTag,
  onSelectUser,
  onSelectReel,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTag ? `#${initialTag}` : '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  useEffect(() => {
    loadExplore();
  }, []);

  const loadExplore = async () => {
    setLoading(true);
    const posts = await postService.getAllPosts();
    setAllPosts(posts);
    setLoading(false);
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1 && !searchQuery.startsWith('#')) {
      userService.searchUsers(searchQuery).then(setMatchingUsers);
    } else {
      setMatchingUsers([]);
    }
  }, [searchQuery]);

  // Filter posts based on search query or category
  const filteredPosts = allPosts.filter((post) => {
    const q = searchQuery.toLowerCase().trim().replace(/^#/, '');

    // Category filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Reels' && post.type !== 'video') return false;
      if (selectedCategory === 'Trending' && post.likesCount < 1000) return false;
      if (
        selectedCategory !== 'Reels' &&
        selectedCategory !== 'Trending' &&
        !post.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase()) &&
        !post.caption.toLowerCase().includes(selectedCategory.toLowerCase())
      ) {
        return false;
      }
    }

    // Search query filter
    if (q) {
      const matchTag = post.tags?.some((t) => t.toLowerCase().includes(q));
      const matchCaption = post.caption.toLowerCase().includes(q);
      const matchAuthor = post.authorUsername.toLowerCase().includes(q);
      return matchTag || matchCaption || matchAuthor;
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search creators, hashtags (#reels), or keywords..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Matching User Profiles Dropdown if searching users */}
      {matchingUsers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-lg space-y-1">
          <p className="text-[10px] uppercase font-bold text-zinc-400 px-3 pt-1">
            Matching Creators
          </p>
          {matchingUsers.map((u) => (
            <div
              key={u.userId}
              onClick={() => onSelectUser(u.userId)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <img
                src={u.avatarUrl}
                alt={u.username}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
              />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <span>{u.displayName}</span>
                  {u.isVerified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                      ✓
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-500">@{u.username} • {formatCompactNumber(u.followersCount)} followers</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setSearchQuery('');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Explore Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No results found</p>
          <p className="text-xs text-zinc-400 mt-1">Try another search term or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {filteredPosts.map((post, idx) => {
            const isReel = post.type === 'video';
            const isFeatured = idx % 5 === 0 && isReel;

            return (
              <div
                key={post.id}
                onClick={() => {
                  if (isReel) {
                    onSelectReel(post.id);
                  } else {
                    setActiveCommentsPostId(post.id);
                  }
                }}
                className={`relative group rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 ${
                  isFeatured ? 'col-span-2 row-span-2 aspect-[4/5]' : 'aspect-square'
                }`}
              >
                {post.type === 'video' && (!post.thumbnailUrl || post.thumbnailUrl.endsWith('.mp4') || post.thumbnailUrl.endsWith('.webm')) ? (
                  <video
                    src={post.mediaUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                  />
                ) : (
                  <img
                    src={post.thumbnailUrl || post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}

                {/* Reel Badge if video */}
                {isReel && (
                  <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/60 backdrop-blur-md text-white">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Hover Details Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorUsername}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-bold truncate">@{post.authorUsername}</span>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" />
                      <span>{formatCompactNumber(post.likesCount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>{formatCompactNumber(post.commentsCount)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/80 line-clamp-1">{post.caption}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comments Drawer if viewing photo post */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          isOpen={!!activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}
    </div>
  );
};
