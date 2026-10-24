import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Sparkles,
  AtSign,
} from 'lucide-react';
import { Notification, NotificationType } from '../../types';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import { formatRelativeTime } from '../../utils/textUtils';
import { useAuth } from '../../context/AuthContext';

interface NotificationsViewProps {
  onSelectUser: (userId: string) => void;
  onSelectPost?: (postId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectUser,
  onSelectPost,
}) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<'all' | NotificationType>('all');
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userProfile) {
      notificationService.getNotifications(userProfile.userId).then(setNotifications);
    }
  }, [userProfile]);

  const handleMarkAllRead = async () => {
    if (!userProfile) return;
    await notificationService.markAllAsRead(userProfile.userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleFollow = async (actorId: string) => {
    if (!userProfile) return;
    const next = !followingState[actorId];
    setFollowingState((prev) => ({ ...prev, [actorId]: next }));
    await userService.toggleFollow(userProfile.userId, actorId);
  };

  const filteredNotifs = notifications.filter((n) =>
    filterType === 'all' ? true : n.type === filterType
  );

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
      case 'mention':
        return <AtSign className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-pink-500" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Notifications</h2>
            <p className="text-xs text-zinc-500">Activity on your posts, reels & profile</p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-xs font-semibold text-pink-500 hover:text-pink-600 flex items-center gap-1 p-2 rounded-xl hover:bg-pink-500/10 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'like', 'comment', 'follow'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              filterType === tab
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden shadow-sm">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No notifications in this category yet.
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center justify-between p-3.5 sm:p-4 gap-3 transition-colors ${
                !notif.isRead ? 'bg-pink-500/5' : ''
              }`}
            >
              <div
                onClick={() => onSelectUser(notif.actorId)}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              >
                <div className="relative shrink-0">
                  <img
                    src={notif.actorAvatar}
                    alt={notif.actorUsername}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow flex items-center justify-center">
                    {getIconForType(notif.type)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                    <span className="font-bold mr-1 text-zinc-900 dark:text-zinc-100">
                      @{notif.actorUsername}
                    </span>
                    <span>{notif.text}</span>
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    {formatRelativeTime(notif.createdAt)} ago
                  </span>
                </div>
              </div>

              {notif.type === 'follow' && (
                <button
                  onClick={() => handleToggleFollow(notif.actorId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    followingState[notif.actorId]
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
                >
                  {followingState[notif.actorId] ? 'Following' : 'Follow Back'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
