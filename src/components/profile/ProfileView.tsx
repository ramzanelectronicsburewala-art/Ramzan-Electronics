import React, { useState, useEffect } from 'react';
import {
  Grid,
  Film,
  Bookmark,
  Settings,
  Link as LinkIcon,
  UserCheck,
  UserPlus,
  MessageCircle,
  MoreVertical,
  X,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, Post } from '../../types';
import { userService } from '../../services/userService';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { formatCompactNumber } from '../../utils/textUtils';
import { ShareModal } from '../common/ShareModal';
import { ReportModal } from '../moderation/ReportModal';

interface ProfileViewProps {
  userId?: string;
  onOpenSettings: () => void;
  onSelectReel: (reelId: string) => void;
  onStartChatWithUser: (user: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onOpenSettings,
  onSelectReel,
  onStartChatWithUser,
}) => {
  const { userProfile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [shareUser, setShareUser] = useState<UserProfile | null>(null);
  const [reportUser, setReportUser] = useState<UserProfile | null>(null);

  const targetId = userId || currentUserProfile?.userId;
  const isOwnProfile = currentUserProfile?.userId === targetId;

  useEffect(() => {
    if (!targetId) return;

    if (isOwnProfile && currentUserProfile) {
      setProfile(currentUserProfile);
      setFollowersCount(currentUserProfile.followersCount);
    } else {
      userService.getUser(targetId).then((res) => {
        if (res) {
          setProfile(res);
          setFollowersCount(res.followersCount);
        }
      });
    }

    // Check if following
    if (currentUserProfile && !isOwnProfile) {
      userService.isFollowing(currentUserProfile.userId, targetId).then(setIsFollowing);
    }

    // Load user's posts
    postService.getAllPosts().then((all) => {
      setPosts(all.filter((p) => p.authorId === targetId));
    });
  }, [targetId, isOwnProfile, currentUserProfile]);

  const handleToggleFollow = async () => {
    if (!currentUserProfile || !targetId) return;
    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    setFollowersCount((prev) => (willFollow ? prev + 1 : Math.max(0, prev - 1)));
    await userService.toggleFollow(currentUserProfile.userId, targetId);
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-zinc-500">
        Loading profile...
      </div>
    );
  }

  const userReels = posts.filter((p) => p.type === 'video');
  const savedPosts = posts.filter((p) => p.isSaved);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative banner accent */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20" />

        <div className="relative pt-8 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-8">
          {/* Avatar with gradient ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 shadow-xl shrink-0">
            <img
              src={profile.avatarUrl}
              alt={profile.username}
              className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
            />
          </div>

          {/* User Info & Actions */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{profile.displayName}</span>
                  {profile.isVerified && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                  {profile.isAdmin && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium">@{profile.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={onOpenSettings}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleToggleFollow}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                        isFollowing
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200'
                          : 'bg-pink-500 text-white hover:bg-pink-600'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </button>

                    <button
                      onClick={() => onStartChatWithUser(profile)}
                      className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 text-pink-500" />
                      <span>Message</span>
                    </button>

                    <button
                      onClick={() => setReportUser(profile)}
                      aria-label="Report creator"
                      className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShareUser(profile)}
                  aria-label="Share profile"
                  className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bio & Link */}
            {profile.bio && (
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-pink-500 hover:underline font-medium mt-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{profile.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            {/* Follower Stats Counts */}
            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center sm:text-left">
              <div>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {posts.length}
                </span>
                <span className="text-xs text-zinc-500 block">Posts</span>
              </div>
              <div
                onClick={() => setShowFollowersModal(true)}
                className="cursor-pointer hover:opacity-80"
              >
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCompactNumber(followersCount)}
                </span>
                <span className="text-xs text-zinc-500 block">Followers</span>
              </div>
              <div
                onClick={() => setShowFollowingModal(true)}
                className="cursor-pointer hover:opacity-80"
              >
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCompactNumber(profile.followingCount)}
                </span>
                <span className="text-xs text-zinc-500 block">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Tabs */}
      <div className="flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'posts'
              ? 'border-pink-500 text-pink-500'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'reels'
              ? 'border-pink-500 text-pink-500'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels ({userReels.length})</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-pink-500 text-pink-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved ({savedPosts.length})</span>
          </button>
        )}
      </div>

      {/* Grid of Posts / Reels */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {posts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
              No posts published yet.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => post.type === 'video' && onSelectReel(post.id)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 group cursor-pointer"
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
                  />
                )}
                {post.type === 'video' && (
                  <div className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {userReels.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
              No short video reels created yet.
            </div>
          ) : (
            userReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => onSelectReel(reel.id)}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 group cursor-pointer"
              >
                <img
                  src={reel.thumbnailUrl || reel.mediaUrl}
                  alt={reel.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5 text-white">
                  <span className="text-[11px] font-bold flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-pink-400" />
                    {formatCompactNumber(reel.viewsCount)} views
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {savedPosts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
              No saved posts bookmarked yet.
            </div>
          ) : (
            savedPosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900"
              >
                <img
                  src={post.thumbnailUrl || post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Followers</h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                    alt="Kai"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Kai Vance</p>
                    <p className="text-[10px] text-zinc-400">@kai_motion</p>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Following
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Following</h3>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
                    alt="Elena"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Elena Rostova</p>
                    <p className="text-[10px] text-zinc-400">@elena_soundscape</p>
                  </div>
                </div>
                <button className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Following
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareUser && (
        <ShareModal
          isOpen={!!shareUser}
          onClose={() => setShareUser(null)}
          title={`Follow @${shareUser.username} on Pulse!`}
        />
      )}

      {/* Report Modal */}
      {reportUser && (
        <ReportModal
          isOpen={!!reportUser}
          onClose={() => setReportUser(null)}
          targetType="user"
          targetId={reportUser.userId}
          targetDetails={`Report user @${reportUser.username}`}
        />
      )}
    </div>
  );
};
